import { useEffect, useRef, type ReactNode } from "react";
import "./TiltCard.css";

// Original implementation of the hover interaction; no paid component source.
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const surface = surfaceRef.current!;
    const enabled = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 801px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      delete container.dataset.tilt;
      surface.style.removeProperty("--card-rx");
      surface.style.removeProperty("--card-ry");
      // Keep the last reflection position while its opacity fades out.
    }

    function move(event: PointerEvent) {
      if (!enabled.matches || event.pointerType !== "mouse") return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Measure the stationary wrapper so tilting never feeds back into input.
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        surface.style.setProperty("--card-rx", `${(0.5 - y) * 7}deg`);
        surface.style.setProperty("--card-ry", `${(x - 0.5) * 9}deg`);
        surface.style.setProperty("--card-light-x", `${x * 100}%`);
        surface.style.setProperty("--card-light-y", `${y * 100}%`);
        container.dataset.tilt = "active";
      });
    }

    container.addEventListener("pointermove", move);
    container.addEventListener("pointerleave", reset);
    container.addEventListener("pointercancel", reset);
    enabled.addEventListener("change", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    document.addEventListener("visibilitychange", reset);
    return () => {
      reset();
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerleave", reset);
      container.removeEventListener("pointercancel", reset);
      enabled.removeEventListener("change", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  return (
    <div ref={containerRef} className="tilt-card">
      <article ref={surfaceRef} className={`tilt-card__surface ${className}`}>
        {children}
      </article>
    </div>
  );
}
