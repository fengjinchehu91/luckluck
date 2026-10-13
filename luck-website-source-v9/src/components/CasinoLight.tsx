import { useEffect, useRef } from "react";
import "./CasinoLight.css";

// Independently authored ambient light; no React Bits Pro source or runtime.
export function CasinoLight({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const gold = getComputedStyle(canvas).getPropertyValue("--gold").trim();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprites = ["clover", "diamond", "glow"].map((shape) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 192;
      const brush = sprite.getContext("2d")!;
      const glow = brush.createRadialGradient(96, 96, 12, 96, 96, 94);
      glow.addColorStop(0, gold);
      glow.addColorStop(0.4, gold);
      glow.addColorStop(1, "transparent");
      brush.fillStyle = glow;
      if (shape === "glow") {
        brush.fillRect(0, 0, 192, 192);
      } else {
        brush.filter = "blur(9px)";
        brush.beginPath();
        if (shape === "clover") {
          for (let petal = 0; petal < 4; petal++) {
            const angle = (petal * Math.PI) / 2;
            const x = 96 + Math.cos(angle) * 30;
            const y = 96 + Math.sin(angle) * 30;
            brush.moveTo(x + 36, y);
            brush.arc(x, y, 36, 0, Math.PI * 2);
          }
        } else {
          brush.moveTo(96, 14);
          brush.lineTo(143, 96);
          brush.lineTo(96, 178);
          brush.lineTo(49, 96);
          brush.closePath();
        }
        brush.fill();
      }
      return sprite;
    });

    // Fixed positions keep the light stable across renders and route visits.
    const patches = Array.from({ length: 24 }, (_, index) => ({
      x: ((index * 37 + 7) % 101) / 100,
      y: ((index * 53 + 11) % 97) / 100,
      size: 0.1 + (index % 5) * 0.028,
      phase: index * 2.399,
      sprite: sprites[index % 2],
    }));
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = false;
    let width = 0;
    let height = 0;

    function draw(time: number) {
      if (!context || !canvas || !width || !height) return;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";

      // Broad, slowly swaying chandelier reflections under the smaller dapples.
      for (let index = 0; index < 2; index++) {
        context.save();
        context.translate(width * (index ? 0.86 : 0.15), height * 0.16);
        context.rotate(-0.32 + Math.sin(time * 0.13 + index) * 0.06);
        context.globalAlpha = 0.16;
        context.drawImage(
          sprites[2],
          -width * 0.17,
          -height * 0.8,
          width * 0.34,
          height * 1.7,
        );
        context.restore();
      }

      for (const patch of patches) {
        const sway = Math.sin(time * 0.24 + patch.phase);
        const size = Math.min(width, height * 1.25) * patch.size;
        context.save();
        context.translate(
          width * patch.x + sway * width * 0.025,
          height * patch.y +
            Math.cos(time * 0.19 + patch.phase) * height * 0.018,
        );
        context.rotate(patch.phase + sway * 0.13);
        context.globalAlpha =
          0.1 + (Math.sin(time * 0.32 + patch.phase) + 1) * 0.075;
        context.drawImage(
          patch.sprite,
          -size / 2,
          -size * 0.36,
          size,
          size * 0.72,
        );
        context.restore();
      }
      context.globalCompositeOperation = "source-over";
    }

    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      if (now - lastFrame < 1000 / 24) return;
      // Pausing a tab or scrolling away must not advance the lighting abruptly.
      if (lastFrame) elapsed += Math.min(now - lastFrame, 100) / 1000;
      lastFrame = now;
      draw(elapsed);
    }

    function syncMotion() {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      const running = visible && !document.hidden && !motion.matches;
      canvas!.dataset.motion = motion.matches
        ? "still"
        : running
          ? "running"
          : "paused";
      if (running) frame = requestAnimationFrame(animate);
      else if (motion.matches) draw(0);
    }

    const resize = new ResizeObserver(([entry]) => {
      const { width: cssWidth, height: cssHeight } = entry.contentRect;
      // Soft light needs no retina buffer; bound the fill cost on large screens.
      const scale = Math.min(1, 960 / Math.max(cssWidth, cssHeight));
      width = canvas.width = Math.max(1, Math.round(cssWidth * scale));
      height = canvas.height = Math.max(1, Math.round(cssHeight * scale));
      draw(motion.matches ? 0 : elapsed);
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncMotion();
    });
    resize.observe(canvas);
    intersection.observe(canvas);
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncMotion);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`casino-light ${className}`}
      aria-hidden="true"
    />
  );
}
