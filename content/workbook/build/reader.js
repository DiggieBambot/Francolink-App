/* Runtime for the standalone workbook.
   Marks the exercises, tracks progress, drives the contents panel.
   No dependencies: this file has to work from a local disk with no server. */
(function () {
  "use strict";

  var KEY = window.__WB_ANSWERS__ || {};

  /* Same marking rules as the app (src/lib/workbook/check.ts): an unaccented
     answer is CORRECT, and the accented spelling is shown beside it. Our
     readers are on keyboards without é; marking them wrong would be testing
     hardware, not French. */
  function norm(s) {
    return s.trim().toLowerCase()
      .replace(/[‘’ʼ]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .replace(/[.!?;:]+$/, "");
  }
  function bare(s) {
    return norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/œ/g, "oe").replace(/æ/g, "ae");
  }
  function check(input, answers) {
    var given = norm(input);
    if (!given) return { v: "bad", a: answers[0] || "" };
    for (var i = 0; i < answers.length; i++)
      if (given === norm(answers[i])) return { v: "ok", a: answers[i] };
    var b = bare(input);
    for (var j = 0; j < answers.length; j++)
      if (b === bare(answers[j])) return { v: "near", a: answers[j] };
    return { v: "bad", a: answers[0] || "" };
  }

  function answersFor(ex, i) {
    var list = KEY[ex] || [];
    for (var k = 0; k < list.length; k++)
      if (String(list[k].i) === String(i)) return list[k].answers;
    return null;
  }

  var blanks = [].slice.call(document.querySelectorAll(".blank"));
  var done = Object.create(null);

  /* The feedback goes at the END of the line, not straight after the input.
     A block element dropped mid-sentence pushed the rest of the sentence onto
     its own line -- "1. Je (danser) [dansais]" / "Correct." / "tous les jours."
     which reads as though the sentence broke. */
  function lineOf(input) { return input.closest("p, li") || input.parentNode; }

  function feedbackEl(input) {
    var line = lineOf(input);
    var el = line.querySelector(":scope > .fb");
    if (!el) {
      el = document.createElement("span");
      el.className = "fb";
      line.appendChild(el);
    }
    return el;
  }

  function mark(input) {
    var ex = input.dataset.ex, i = input.dataset.i;
    var answers = answersFor(ex, i);
    if (!answers || !input.value.trim()) return;
    var r = check(input.value, answers);
    input.classList.remove("ok", "near", "bad");
    input.classList.add(r.v);
    var fb = feedbackEl(input);
    fb.className = "fb " + r.v;
    fb.textContent =
      r.v === "ok" ? "✓ Correct."
      : r.v === "near" ? "✓ Correct — mind the accent: " + r.a
      : "✗ Not quite — " + r.a;
    if (r.v !== "bad") done[ex + ":" + i] = true;
    updateExercise(input);
    updateProgress();
  }

  function reveal(input) {
    var answers = answersFor(input.dataset.ex, input.dataset.i);
    if (!answers) return;
    input.value = answers[0];
    input.classList.remove("bad", "near");
    input.classList.add("ok");
    var fb = feedbackEl(input);
    fb.className = "fb ok";
    fb.textContent = "Answer shown.";
  }

  /* Each exercise gets a check-all / show-answers bar and a running score. */
  function groupOf(input) { return input.closest("aside.box.exercice") || input.closest("ol"); }

  function updateExercise(input) {
    var g = groupOf(input); if (!g) return;
    var ins = g.querySelectorAll(".blank");
    var right = 0;
    for (var i = 0; i < ins.length; i++)
      if (done[ins[i].dataset.ex + ":" + ins[i].dataset.i]) right++;
    var s = g.querySelector(".score");
    if (s) s.textContent = right + " / " + ins.length;
  }

  var groups = [];
  blanks.forEach(function (b) { var g = groupOf(b); if (g && groups.indexOf(g) < 0) groups.push(g); });

  groups.forEach(function (g) {
    var ins = g.querySelectorAll(".blank");
    var bar = document.createElement("div");
    bar.className = "exbar";
    bar.innerHTML =
      '<span class="score">0 / ' + ins.length + "</span>" +
      '<button type="button" data-act="check">Check answers</button>' +
      '<button type="button" data-act="show">Show answers</button>' +
      '<button type="button" data-act="clear">Clear</button>';
    (g.tagName === "OL" ? g.parentNode.insertBefore(bar, g.nextSibling) : g.appendChild(bar));
    bar.addEventListener("click", function (e) {
      var act = e.target && e.target.dataset && e.target.dataset.act;
      if (!act) return;
      [].forEach.call(ins, function (inp) {
        if (act === "check") mark(inp);
        else if (act === "show") reveal(inp);
        else {
          inp.value = "";
          inp.classList.remove("ok", "near", "bad");
          delete done[inp.dataset.ex + ":" + inp.dataset.i];
          var fb = lineOf(inp).querySelector(":scope > .fb");
          if (fb) fb.remove();
        }
      });
      updateExercise(ins[0] || null);
      updateProgress();
    });
  });

  blanks.forEach(function (b) {
    b.addEventListener("blur", function () { mark(b); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); mark(b); }
    });
    b.addEventListener("input", function () {
      b.classList.remove("ok", "near", "bad");
      var fb = lineOf(b).querySelector(":scope > .fb");
      if (fb) fb.remove();
    });
  });

  function updateProgress() {
    var el = document.querySelector(".prog");
    if (!el) return;
    var n = Object.keys(done).length;
    el.textContent = n + " of " + blanks.length + " answered";
    try { localStorage.setItem("fpp_done", JSON.stringify(done)); } catch (e) {}
  }

  /* Restore a previous session, when the browser allows it. */
  try {
    var saved = JSON.parse(localStorage.getItem("fpp_done") || "{}");
    Object.keys(saved).forEach(function (k) { done[k] = true; });
  } catch (e) {}
  updateProgress();
  groups.forEach(function (g) { var i = g.querySelector(".blank"); if (i) updateExercise(i); });

  /* Contents panel + back-to-top. */
  var panel = document.getElementById("toc-panel");
  var toggle = document.querySelector(".navbtn.contents");
  if (toggle && panel) {
    toggle.addEventListener("click", function () { panel.classList.toggle("open"); });
    panel.addEventListener("click", function (e) {
      if (e.target.tagName === "A" || e.target.classList.contains("close")) {
        panel.classList.remove("open");
      }
    });
  }
  var top = document.querySelector(".totop");
  if (top) {
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.addEventListener("scroll", function () {
      top.classList.toggle("show", window.scrollY > 900);
    }, { passive: true });
  }
})();
