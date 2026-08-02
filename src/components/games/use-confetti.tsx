// src/components/games/use-confetti.tsx
//
// Full-screen confetti burst, shared across games and the certificate view.
// Extracted verbatim from certificate-view.tsx so all celebratory moments use
// the same particle physics and 10-color palette, and so new games don't each
// re-roll a copy. Render `<ConfettiOverlay trigger={bool} />` for the common
// case, or call `useConfetti(canvasRef, trigger)` directly with your own
// `<canvas>` if you need custom placement/sizing.

import { useCallback, useEffect, useRef, useState } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; size: number;
  rotation: number; rotationSpeed: number;
  shape: "rect" | "circle" | "triangle";
  opacity: number; gravity: number;
}

const COLORS = [
  "#f59e0b","#3b82f6","#10b981","#8b5cf6",
  "#ef4444","#ec4899","#14b8a6","#f97316","#ffffff","#fbbf24",
];

export function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>, trigger: boolean) {
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  // Stable self-reference for the rAF loop so `animate` can reschedule itself
  // without appearing in its own dependency array.
  const animateRef = useRef<() => void>(() => {});

  const spawnBurst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const shapes: Particle["shape"][] = ["rect","circle","triangle"];
    const origins = [
      { x: W*0.1, vxRange: [-2,5] }, { x: W*0.3, vxRange: [-4,4] },
      { x: W*0.5, vxRange: [-5,5] }, { x: W*0.7, vxRange: [-4,4] },
      { x: W*0.9, vxRange: [-5,2] },
    ];
    const newP: Particle[] = [];
    origins.forEach(({ x, vxRange }) => {
      for (let i = 0; i < 28; i++) {
        newP.push({
          x, y: -10,
          vx: vxRange[0] + Math.random() * (vxRange[1] - vxRange[0]),
          vy: -(Math.random() * 12 + 6),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 10 + 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 1,
          gravity: 0.25 + Math.random() * 0.15,
        });
      }
    });
    particlesRef.current = [...particlesRef.current, ...newP];
  }, [canvasRef]);

  const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    if (p.shape === "rect") {
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    } else if (p.shape === "circle") {
      ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0,-p.size/2);
      ctx.lineTo(p.size/2,p.size/2); ctx.lineTo(-p.size/2,p.size/2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01);
    particlesRef.current.forEach(p => {
      p.vy += p.gravity; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (p.y > canvas.height * 0.75) p.opacity -= 0.025;
    });
    particlesRef.current.forEach(p => drawParticle(ctx, p));
    if (particlesRef.current.length > 0) {
      animRef.current = requestAnimationFrame(animateRef.current);
    }
  }, [canvasRef]);
  useEffect(() => { animateRef.current = animate; }, [animate]);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    spawnBurst();
    const t1 = setTimeout(spawnBurst, 600);
    const t2 = setTimeout(spawnBurst, 1200);
    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener("resize", resize);
    };
  }, [trigger, spawnBurst, animate, canvasRef]);
}

/** Drop-in confetti: render this once near the root and toggle `trigger`.
 *  Sizes itself to the viewport and sits above everything (pointer-events-none). */
export function ConfettiOverlay({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useConfetti(canvasRef, trigger);
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30" aria-hidden />;
}

/** Convenience: fire a one-shot burst. Returns `[fire, node]` — render `node`
 *  once in your tree and call `fire()` whenever you want confetti. Each call
 *  bumps an internal counter that retriggers the hook. */
export function useConfettiBurst(): { fire: () => void; overlay: React.ReactNode } {
  const [count, setCount] = useState(0);
  // trigger stays true briefly so the hook runs; we flip it back off after the
  // burst is seeded so subsequent fire() calls re-trigger the effect.
  const [armed, setArmed] = useState(false);
  const fire = useCallback(() => {
    setArmed(true);
    setCount(c => c + 1);
  }, []);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 1600);
    return () => clearTimeout(t);
  }, [armed, count]);
  return { fire, overlay: <ConfettiOverlay key={count} trigger={armed} /> };
}
