"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { AdminGoogleButton } from "@/components/auth/admin-google-button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setError(err);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setIsLoading(false); return; }
      if (data.session) {
        const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
        const role = (profile?.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "COMMUNITY_MANAGER") {
          await supabase.auth.signOut();
          setError("Access denied. Staff privileges required.");
          setIsLoading(false);
          return;
        }
        // Community managers get the scoped support inbox; admins get the console.
        window.location.href = role === "COMMUNITY_MANAGER" ? "/admin/support" : "/admin";
      }
    } catch {
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ar {
          min-height: 100vh;
          background: #05090f;
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          position: relative; overflow: hidden;
        }

        /* Navy base glow + orange accent glow */
        .ar-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 55% at 50% 0%, rgba(15,35,70,0.8) 0%, transparent 65%),
            radial-gradient(ellipse 50% 35% at 100% 100%, rgba(234,88,12,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 0% 80%, rgba(30,58,95,0.2) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Grid — navy tint */
        .ar-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(30,58,95,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,58,95,0.12) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none;
        }

        /* Main orb — navy */
        .ar-orb-navy {
          position: absolute; top: 25%; left: 50%; transform: translate(-50%, -50%);
          width: 800px; height: 500px;
          background: radial-gradient(ellipse, rgba(20,50,100,0.4) 0%, transparent 70%);
          pointer-events: none; filter: blur(50px);
        }

        /* Accent orb — orange, bottom right */
        .ar-orb-orange {
          position: absolute; bottom: -100px; right: -100px;
          width: 500px; height: 500px;
          background: radial-gradient(ellipse, rgba(234,88,12,0.12) 0%, transparent 65%);
          pointer-events: none; filter: blur(60px);
        }

        /* Corner brackets — navy with orange dots */
        .c { position: absolute; width: 100px; height: 100px; pointer-events: none; }
        .c.tl { top: 28px; left: 28px; border-top: 1px solid rgba(30,58,95,0.6); border-left: 1px solid rgba(30,58,95,0.6); }
        .c.tr { top: 28px; right: 28px; border-top: 1px solid rgba(30,58,95,0.6); border-right: 1px solid rgba(30,58,95,0.6); }
        .c.bl { bottom: 28px; left: 28px; border-bottom: 1px solid rgba(30,58,95,0.6); border-left: 1px solid rgba(30,58,95,0.6); }
        .c.br { bottom: 28px; right: 28px; border-bottom: 1px solid rgba(30,58,95,0.6); border-right: 1px solid rgba(30,58,95,0.6); }
        .c::before {
          content: ''; position: absolute;
          width: 5px; height: 5px;
          background: #ea580c;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(234,88,12,0.8);
        }
        .c.tl::before { top: -2px; left: -2px; }
        .c.tr::before { top: -2px; right: -2px; }
        .c.bl::before { bottom: -2px; left: -2px; }
        .c.br::before { bottom: -2px; right: -2px; }

        /* Status bar */
        .sb {
          position: absolute; top: 32px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 16px;
          font-size: 10px; color: rgba(100,140,200,0.45); letter-spacing: 0.14em; white-space: nowrap;
        }
        .sb-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #ea580c;
          box-shadow: 0 0 8px rgba(234,88,12,0.9);
          animation: blink 2.5s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

        /* Panel */
        .panel {
          position: relative; z-index: 10; width: min(440px, calc(100vw - 40px));
          opacity: 0; transform: translateY(20px);
          animation: fadein 0.7s cubic-bezier(0.16,1,0.3,1) forwards 0.15s;
        }
        @keyframes fadein { to { opacity:1; transform:translateY(0); } }

        /* Header */
        .ph { text-align: center; margin-bottom: 28px; }

        .icon-ring {
          display: inline-flex; align-items: center; justify-content: center;
          width: 64px; height: 64px; border-radius: 18px;
          background: linear-gradient(135deg, #0f2040 0%, #0a1628 100%);
          border: 1px solid rgba(234,88,12,0.4);
          margin-bottom: 22px; position: relative;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.5),
            0 0 20px rgba(234,88,12,0.1),
            inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .icon-ring::after {
          content: ''; position: absolute; inset: -1px; border-radius: 18px;
          background: linear-gradient(135deg, rgba(234,88,12,0.2) 0%, transparent 55%);
          pointer-events: none;
        }

        .pt {
          font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
          color: #e8f0ff; letter-spacing: -0.02em; margin-bottom: 8px;
        }
        .ps { font-size: 10px; color: rgba(234,88,12,0.55); letter-spacing: 0.18em; text-transform: uppercase; }

        /* Card */
        .card {
          background: rgba(6,14,30,0.9);
          border: 1px solid rgba(30,58,95,0.4);
          border-radius: 20px; padding: 36px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 40px 80px rgba(0,0,0,0.6),
            0 0 40px rgba(15,35,70,0.3),
            inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
        }

        /* Top accent — orange */
        .card::before {
          content: ''; position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,88,12,0.6), transparent);
        }

        /* Scan line — orange tinted */
        .scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,88,12,0.2), rgba(234,88,12,0.4), rgba(234,88,12,0.2), transparent);
          animation: scandown 6s ease-in-out infinite; pointer-events: none;
        }
        @keyframes scandown { 0% { top:0; opacity:0; } 5% { opacity:1; } 95% { opacity:1; } 100% { top:100%; opacity:0; } }

        /* Fields */
        .fl { margin-bottom: 22px; }
        .flabel {
          display: block; font-size: 10px; color: rgba(234,88,12,0.55);
          letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 9px; font-weight: 500;
        }
        .fwrap { position: relative; }
        .ficon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(30,58,95,0.8); pointer-events: none; display: flex;
        }
        .finput {
          width: 100%;
          background: rgba(10,20,45,0.7);
          border: 1px solid rgba(30,58,95,0.5);
          border-radius: 10px; padding: 13px 14px 13px 44px;
          font-family: 'JetBrains Mono', monospace; font-size: 13px;
          color: #c8d8f0; outline: none; transition: all 0.2s; letter-spacing: 0.02em;
        }
        .finput::placeholder { color: rgba(30,58,95,0.6); }
        .finput:focus {
          border-color: rgba(234,88,12,0.4);
          background: rgba(15,30,65,0.7);
          box-shadow: 0 0 0 3px rgba(234,88,12,0.06), 0 0 12px rgba(234,88,12,0.04);
        }
        .finput.pr { padding-right: 44px; }
        .ftoggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: rgba(30,58,95,0.6);
          cursor: pointer; display: flex; transition: color 0.2s; padding: 0;
        }
        .ftoggle:hover { color: rgba(234,88,12,0.7); }

        /* Error */
        .err {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 22px;
          font-size: 12px; color: #fca5a5; line-height: 1.5;
        }

        /* Submit — navy bg, orange accent */
        .sbtn {
          width: 100%;
          background: linear-gradient(135deg, #1e3a5f 0%, #162d4a 60%, #0f2038 100%);
          border: 1px solid rgba(234,88,12,0.5);
          border-radius: 10px; padding: 15px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
          color: #fdba74;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all 0.25s; margin-top: 6px; position: relative; overflow: hidden;
        }
        .sbtn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(234,88,12,0.12) 0%, transparent 55%);
          opacity: 0; transition: opacity 0.25s;
        }
        .sbtn:hover:not(:disabled) {
          border-color: rgba(234,88,12,0.75);
          color: #fed7aa;
          box-shadow: 0 0 28px rgba(234,88,12,0.15), 0 4px 16px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        .sbtn:hover:not(:disabled)::before { opacity: 1; }
        .sbtn:active:not(:disabled) { transform: translateY(0); }
        .sbtn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* OR divider — sits between password auth and SSO */
        .orsep { display: flex; align-items: center; gap: 12px; margin: 24px 0 20px; }
        .orsep::before, .orsep::after { content: ''; flex: 1; height: 1px; background: rgba(30,58,95,0.35); }
        .orsep span { font-size: 9px; color: rgba(100,130,180,0.45); letter-spacing: 0.18em; text-transform: uppercase; }

        /* Google button — same panel language, cooler/neutral accent so it reads
           as a secondary path next to the orange primary CTA */
        .gbtn {
          width: 100%;
          background: rgba(10,20,45,0.5);
          border: 1px solid rgba(30,58,95,0.55);
          border-radius: 10px; padding: 13px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500;
          color: #a8bfe0;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em;
        }
        .gbtn:hover:not(:disabled) {
          border-color: rgba(120,160,220,0.6);
          background: rgba(15,30,65,0.7);
          color: #dce6f7;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        }
        .gbtn:active:not(:disabled) { transform: translateY(0); }
        .gbtn:disabled { opacity: 0.5; cursor: not-allowed; }

        .meta {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(30,58,95,0.3);
          font-size: 10px; color: rgba(100,130,180,0.25); letter-spacing: 0.1em;
        }
        .back { color: rgba(234,88,12,0.35); text-decoration: none; font-size: 10px; letter-spacing: 0.1em; transition: color 0.2s; }
        .back:hover { color: rgba(234,88,12,0.7); }

        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

        /* Small screens: hide the floating status bar (it collides with the
           panel once there's no room above it) and tighten card padding */
        @media (max-width: 480px) {
          .sb { display: none; }
          .card { padding: 26px; }
          .c { width: 60px; height: 60px; }
        }
      `}</style>

      <div className="ar">
        <div className="ar-bg" />
        <div className="ar-grid" />
        <div className="ar-orb-navy" />
        <div className="ar-orb-orange" />

        <div className="c tl" /><div className="c tr" />
        <div className="c bl" /><div className="c br" />

        {mounted && (
          <div className="sb">
            <span>SYS:ONLINE</span><div className="sb-dot" />
            <span>{time}</span><div className="sb-dot" />
            <span>FRANCOLINK//ADMIN</span>
          </div>
        )}

        <div className="panel">
          <div className="ph">
            <div className="icon-ring">
              <Shield size={26} color="#ea580c" strokeWidth={1.5} />
            </div>
            <div className="pt">Admin Access</div>
            <div className="ps">Restricted — Authorized Personnel Only</div>
          </div>

          <div className="card">
            <div className="scan" />
            <form onSubmit={handleLogin}>
              {error && (
                <div className="err">
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}
              <div className="fl">
                <label className="flabel">Identifier</label>
                <div className="fwrap">
                  <div className="ficon"><Mail size={15} /></div>
                  <input type="email" className="finput" placeholder="admin@francolink.net"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                    autoFocus disabled={isLoading} />
                </div>
              </div>
              <div className="fl">
                <label className="flabel">Passphrase</label>
                <div className="fwrap">
                  <div className="ficon"><Lock size={15} /></div>
                  <input type={showPassword ? "text" : "password"} className="finput pr"
                    placeholder="••••••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    disabled={isLoading} />
                  <button type="button" className="ftoggle" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="sbtn" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Authenticating...</>
                  : <><Shield size={14} />Authenticate</>
                }
              </button>
            </form>

            <div className="orsep"><span>Or continue with</span></div>
            <AdminGoogleButton />

            <div className="meta">
              <span>v2.0 // SECURE CHANNEL</span>
              <a href="/login" className="back">← User Login</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
