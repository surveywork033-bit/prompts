import { useEffect, useRef } from "react";

export default function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      fadeSpeed: number;
    }> = [];

    const colors = [
      "rgba(147, 51, 234, 0.4)",  // magenta/purple glow
      "rgba(59, 130, 246, 0.3)",  // vibrant blue glow
      "rgba(6, 182, 212, 0.35)",  // cyber cyan glow
      "rgba(236, 72, 153, 0.25)"   // deep pink glow
    ];

    const createParticle = (x?: number, y?: number) => {
      return {
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        size: Math.random() * 3.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.1,
        fadeSpeed: Math.random() * 0.002 + 0.0005,
      };
    };

    // Initialize particles
    for (let i = 0; i < 45; i++) {
      particles.push(createParticle());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background radial glows to create deep space ambience
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        20,
        width * 0.5,
        height * 0.3,
        width * 0.8
      );
      gradient.addColorStop(0, "rgba(23, 15, 30, 0.35)");
      gradient.addColorStop(1, "rgba(9, 9, 11, 0.2)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Very slight pulsing
        p.alpha += p.speedX * 0.02;
        if (p.alpha <= 0.05 || p.alpha >= 0.8) {
          p.speedX = -p.speedX;
        }
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id="promptverse_background_particles"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-zinc-950 transition-colors duration-1000"
    />
  );
}
