// src/app/(marketing)/pricing/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Check, X, Crown, Sparkles, Zap, Trophy } from "lucide-react";
import { CheckoutButton } from "@/components/pricing";

type BillingPeriod = "monthly" | "yearly";

const plans = [
  {
    key: "FREE", name: "Free", description: "Start your journey",
    monthly: "$0", yearlyPerMonth: "$0",
    color: "#6B7280", colorDark: "#374151", colorLight: "#F3F4F6",
    gradient: "linear-gradient(135deg,#374151,#1f2937)",
    features: [
      { text: "1 lesson per day", included: true },
      { text: "Unit 1 free forever", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "All levels (A1-C2)", included: false },
      { text: "AI conversation tutor", included: false },
      { text: "Offline mode", included: false },
    ],
  },
  {
    key: "PREMIUM", name: "Premium", description: "Unlock everything",
    monthly: "$7.99", yearlyPerMonth: "$5.00",
    originalMonthly: "$9.99", yearly: "$59.99", savings: "Save $36",
    badge: "Most Popular", highlighted: true,
    color: "#F97316", colorDark: "#C2410C", colorLight: "#FFF7ED",
    gradient: "linear-gradient(135deg,#C2410C,#9a3412)",
    features: [
      { text: "Unlimited lessons", included: true },
      { text: "All levels (A1-C2)", included: true },
      { text: "Advanced progress tracking", included: true },
      { text: "300 AI tutor messages per month", included: true },
      { text: "Offline mode", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    key: "PREMIUM_PLUS", name: "Premium+", description: "The full experience",
    monthly: "$14.99", yearlyPerMonth: "$10.00",
    originalMonthly: "$19.99", yearly: "$119.99", savings: "Save $60",
    badge: "Best Value",
    color: "#A855F7", colorDark: "#7E22CE", colorLight: "#FAF5FF",
    gradient: "linear-gradient(135deg,#7E22CE,#581c87)",
    features: [
      { text: "Unlimited lessons", included: true },
      { text: "All levels (A1-C2)", included: true },
      { text: "Advanced progress tracking", included: true },
      { text: "1,500 AI tutor messages per month", included: true },
      { text: "Offline mode", included: true },
      { text: "Advanced pronunciation analysis", included: true },
    ],
  },
];

const CONFETTI_COLORS = ["#F97316","#A855F7","#3B82F6","#10B981","#F59E0B","#ffffff"];

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  const animRef = useRef<number>(0);
  const particles = useRef<any[]>([]);

  const spawn = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const W = c.width;
    const newP: any[] = [];
    [0.1,0.3,0.5,0.7,0.9].forEach(xr => {
      for (let i = 0; i < 28; i++) {
        newP.push({ x: W*xr, y: -10, vx: (Math.random()-0.5)*10, vy: -(Math.random()*12+6),
          color: CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
          size: Math.random()*10+5, rotation: Math.random()*360,
          rotationSpeed: (Math.random()-0.5)*10, opacity: 1, gravity: 0.28+Math.random()*0.15 });
      }
    });
    particles.current = [...particles.current, ...newP];
  }, [canvasRef]);

  const animate = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0,0,c.width,c.height);
    particles.current = particles.current.filter(p => p.opacity > 0.01);
    particles.current.forEach(p => {
      p.vy += p.gravity; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed;
      if (p.y > c.height*0.7) p.opacity -= 0.025;
      ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
      ctx.translate(p.x,p.y); ctx.rotate((p.rotation*Math.PI)/180);
      ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2); ctx.restore();
    });
    if (particles.current.length > 0) animRef.current = requestAnimationFrame(animate);
  }, [canvasRef]);

  useEffect(() => {
    if (!active) return;
    const c = canvasRef.current; if (!c) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    spawn(); const t1 = setTimeout(spawn,500); const t2 = setTimeout(spawn,1000);
    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize",resize); };
  }, [active, spawn, animate, canvasRef]);
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [confettiActive, setConfettiActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useConfetti(canvasRef, confettiActive);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("success") === "true" || p.get("upgraded") === "true") {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 5000);
    }
  }, []);

  const yearly = billing === "yearly";

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .plan-card{animation:fadeUp 0.5s ease forwards;opacity:0}
        .plan-card:nth-child(1){animation-delay:0.05s}
        .plan-card:nth-child(2){animation-delay:0.15s}
        .plan-card:nth-child(3){animation-delay:0.25s}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none"
        style={{display:confettiActive?"block":"none"}} />

      <div className="min-h-screen" style={{background:"#F0F4FF"}}>

        {/* Nav */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
                style={{background:"linear-gradient(135deg,#1e3a5f,#0f2040)"}}>FL</div>
              <span className="font-bold text-sm text-gray-900">FrancoLink</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden text-center py-14"
          style={{background:"linear-gradient(135deg,#0f2040 0%,#1e3a5f 60%,#0f2040 100%)"}}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{backgroundImage:"radial-gradient(circle at 1px 1px,#F97316 1px,transparent 0)",backgroundSize:"28px 28px"}} />
          <div className="relative max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{background:"rgba(249,115,22,0.15)",color:"#FDBA74",border:"1px solid rgba(249,115,22,0.25)"}}>
              <Trophy className="w-3.5 h-3.5" /> Founding Member Pricing — Limited Time
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Choose Your <span style={{color:"#F97316"}}>Journey</span>
            </h1>
            <p className="mb-8 text-base" style={{color:"rgba(255,255,255,0.65)"}}>
              Join thousands mastering French and more. Cancel anytime.
            </p>
            {/* Billing toggle */}
            <div className="inline-flex p-1 rounded-2xl gap-1"
              style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)"}}>
              {(["monthly","yearly"] as BillingPeriod[]).map(p => (
                <button key={p} onClick={() => setBilling(p)}
                  className="relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={billing===p
                    ? {background:"#F97316",color:"#fff",boxShadow:"0 0 20px rgba(249,115,22,0.5)"}
                    : {color:"rgba(255,255,255,0.55)"}}>
                  {p === "monthly" ? "Monthly" : (
                    <span className="flex items-center gap-2">
                      Yearly
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{background:"rgba(16,185,129,0.25)",color:"#6EE7B7"}}>−37%</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            {yearly && (
              <p className="mt-3 text-sm font-medium" style={{color:"#6EE7B7"}}>
                🎉 You save up to <strong>$60/year</strong> with annual billing
              </p>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="max-w-5xl mx-auto px-4 -mt-4 pb-16">
          <div className="grid md:grid-cols-3 gap-4 items-start">
            {plans.map((plan) => {
              const price = yearly ? plan.yearlyPerMonth : plan.monthly;
              const isHL = plan.highlighted;

              return (
                <div key={plan.key} className="plan-card rounded-2xl overflow-hidden"
                  style={{
                    background:"white",
                    border: isHL ? `2px solid ${plan.color}` : "1px solid #E5E7EB",
                    boxShadow: isHL ? `0 0 40px ${plan.color}25,0 8px 30px rgba(0,0,0,0.08)` : "0 2px 12px rgba(0,0,0,0.05)",
                    transform: isHL ? "scale(1.03)" : "scale(1)",
                  }}>
                  <div className="h-1" style={{background:plan.gradient}} />
                  <div className="p-6">
                    {/* Plan head */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{background:plan.colorLight}}>
                          {plan.key==="FREE" && <Zap className="w-5 h-5" style={{color:plan.color}} />}
                          {plan.key==="PREMIUM" && <Crown className="w-5 h-5" style={{color:plan.color}} />}
                          {plan.key==="PREMIUM_PLUS" && <Sparkles className="w-5 h-5" style={{color:plan.color}} />}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 text-sm">{plan.name}</div>
                          <div className="text-xs text-gray-400">{plan.description}</div>
                        </div>
                      </div>
                      {plan.badge && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                          style={{background:plan.gradient}}>{plan.badge}</span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black" style={{color:"#0f2040"}}>{price}</span>
                        <span className="text-xs text-gray-400 mb-1.5">
                          {plan.key==="FREE" ? "/forever" : yearly ? "/mo·billed yearly" : "/month"}
                        </span>
                      </div>
                      {plan.key !== "FREE" && (
                        <div className="flex items-center gap-2 mt-1">
                          {plan.originalMonthly && !yearly && (
                            <span className="text-xs text-gray-400 line-through">{plan.originalMonthly}/mo</span>
                          )}
                          {yearly && plan.savings && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{background:"#DCFCE7",color:"#166534"}}>{plan.savings}/yr</span>
                          )}
                          {!yearly && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{background:`${plan.color}15`,color:plan.colorDark}}>Founding Price</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f,i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          {f.included
                            ? <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{background:`${plan.color}20`}}>
                                <Check className="w-2.5 h-2.5" style={{color:plan.color}} />
                              </span>
                            : <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <X className="w-2.5 h-2.5 text-gray-300" />
                              </span>
                          }
                          <span className={`text-sm ${f.included?"text-gray-700":"text-gray-300"}`}>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {plan.key === "FREE" ? (
                      <Link href="/signup"
                        className="block w-full py-3 rounded-xl font-semibold text-center text-sm"
                        style={{background:"#F3F4F6",color:"#374151"}}>
                        Get Started Free
                      </Link>
                    ) : (
                      <CheckoutButton
                        plan={plan.key === "PREMIUM" ? "premium" : "premium_plus"}
                        billingPeriod={billing}
                        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                        style={{background:plan.gradient,boxShadow:isHL?`0 4px 20px ${plan.color}40`:"none"} as any}>
                        {yearly ? `Get ${plan.name} — $${plan.key==="PREMIUM"?"59.99":"119.99"}/yr` : `Get ${plan.name}`}
                      </CheckoutButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            {["🔒 Stripe-secured payments","✓ Cancel anytime, no fees","🌍 5,000+ active learners","⭐ 4.9/5 student rating"].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-black text-center mb-6" style={{color:"#0f2040"}}>Questions & Answers</h2>
          <div className="space-y-2">
            {[
              ["Can I cancel anytime?","Yes — one click in your account settings. Access continues to your billing period end."],
              ["What payment methods?","All major credit/debit cards via Stripe. Safe, encrypted, no data stored on our servers."],
              ["Is there a free trial?","Unit 1 is free forever. Upgrade when you're ready for the full experience."],
              ["What's the AI tutor?","Real-time French conversation practice with pronunciation feedback — like a native speaker on demand."],
              ["Can I switch plans?","Anytime. Upgrades are instant; downgrades take effect at next billing cycle."],
            ].map(([q,a],i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-100">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 text-sm">
                  {q}
                  <span className="text-gray-400 transition-transform group-open:rotate-180 ml-4">↓</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="py-12 text-center" style={{background:"linear-gradient(135deg,#0f2040,#1e3a5f)"}}>
          <h2 className="text-2xl font-black text-white mb-3">Ready to start?</h2>
          <p className="mb-6 text-sm" style={{color:"rgba(255,255,255,0.6)"}}>Join thousands already on their language journey.</p>
          <Link href="/learn"
            className="inline-block font-bold px-8 py-3 rounded-xl text-sm transition-all hover:opacity-90"
            style={{background:"#F97316",color:"#fff",boxShadow:"0 0 30px rgba(249,115,22,0.4)"}}>
            Continue Learning →
          </Link>
        </div>
      </div>
    </>
  );
}
