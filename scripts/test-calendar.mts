import {
  toCalendarEvent, toIcsCalendar, googleCalendarUrl,
} from "../src/lib/booking/calendar";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, x = "") => {
  if (c) { pass++; console.log("  ok   " + n); }
  else { fail++; console.log("  FAIL " + n + (x ? "  → " + x : "")); }
};

const booking = {
  id: "abc-123",
  starts_at: "2026-09-01T13:00:00.000Z",
  ends_at: "2026-09-01T13:50:00.000Z",
  status: "confirmed",
  duration_minutes: 50,
  tutor_name: "Njinu; Bambot, PhD",   // deliberately full of ICS metacharacters
  student_name: "Marie\nDupont",
  room_url: "https://app.francolink.net/room/xyz",
};

console.log("\n1. event shape");
const ev = toCalendarEvent(booking, "student", "https://app.francolink.net");
check("uid stable per booking", ev.uid === "booking-abc-123@francolink.net", ev.uid);
check("titled for the student (names the tutor)", ev.title.includes("Njinu"), ev.title);
const tutorEv = toCalendarEvent(booking, "tutor", "https://app.francolink.net");
check("titled for the tutor (names the student)", tutorEv.title.includes("Marie"), tutorEv.title);
check("not cancelled", !ev.cancelled);

console.log("\n2. ICS escaping (silent-corruption risk)");
const ics = toIcsCalendar([ev], "FrancoLink lessons");
check("semicolon escaped", ics.includes("Njinu" + String.fromCharCode(92) + ";"), "missing backslash-semicolon");
check("comma escaped", ics.includes("Bambot\\,"), "missing \\,");
check("CRLF line endings", ics.includes("\r\n") && !/[^\r]\n/.test(ics));
check("has BEGIN/END VCALENDAR", ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
check("DTSTART is a UTC stamp", /DTSTART:20260901T130000Z/.test(ics), ics.match(/DTSTART:.*/)?.[0]);
check("DTEND is a UTC stamp", /DTEND:20260901T135000Z/.test(ics));
check("STATUS:CONFIRMED", ics.includes("STATUS:CONFIRMED"));
check("no raw newline inside DESCRIPTION", !/DESCRIPTION:[^\r]*\n(?! )/.test(ics));

console.log("\n3. cancelled lessons are published, not dropped");
const cancelled = toCalendarEvent({ ...booking, status: "cancelled_by_student" }, "student", "https://app.francolink.net");
const cIcs = toIcsCalendar([cancelled], "x");
check("STATUS:CANCELLED", cIcs.includes("STATUS:CANCELLED"));
check("same UID so subscribers replace it", cancelled.uid === ev.uid);
check("title says cancelled", cancelled.title.startsWith("Cancelled:"));

console.log("\n4. line folding (RFC 5545: <=75 octets)");
const long = toCalendarEvent({ ...booking, tutor_name: "A".repeat(300) }, "student", "https://app.francolink.net");
const lIcs = toIcsCalendar([long], "x");
const tooLong = lIcs.split("\r\n").filter(l => l.length > 75);
check("no line exceeds 75 chars", tooLong.length === 0, `${tooLong.length} long line(s)`);
check("continuations start with a space", lIcs.split("\r\n").filter(l => l.startsWith(" ")).length > 0);

console.log("\n5. Add-to-Google link");
const g = googleCalendarUrl(ev);
check("points at Google render endpoint", g.startsWith("https://calendar.google.com/calendar/render?"));
check("dates in start/end stamp form", g.includes("dates=20260901T130000Z%2F20260901T135000Z"), g.match(/dates=[^&]*/)?.[0]);
check("carries the join URL", decodeURIComponent(g).includes("/room/xyz"));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
