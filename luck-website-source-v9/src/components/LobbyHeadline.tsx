import { Fragment, useEffect, useRef } from "react";
import "./LobbyHeadline.css";

const headline = "让幸运，在此刻发生。";

export function LobbyHeadline() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current!;
    const letters = Array.from(
      heading.querySelectorAll<HTMLElement>(".lobby-scatter-letter"),
    );
    const motion = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 601px) and (prefers-reduced-motion: no-preference)",
    );
    let animations: Animation[] = [];

    function reset() {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    }

    function scatter(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !motion.matches) return;
      const starts = letters.map(
        (letter) => getComputedStyle(letter).transform,
      );
      reset();
      animations = letters.map((letter, index) => {
        const x = (((index * 7) % 11) - 5) * 0.07;
        const y = -(0.24 + ((index * 5) % 8) * 0.085);
        const rotation = ((index * 17) % 45) - 22;
        return letter.animate(
          [
            { transform: starts[index], easing: "cubic-bezier(.16, 1, .3, 1)" },
            {
              transform: `translate(${x}em, ${y}em) rotate(${rotation}deg)`,
              offset: 0.27,
              easing: "cubic-bezier(.4, 0, .8, .35)",
            },
            {
              transform: "translate(0, .045em) rotate(0deg)",
              offset: 0.82,
              easing: "cubic-bezier(.16, 1, .3, 1)",
            },
            { transform: "none" },
          ],
          { duration: 1250 + (index % 3) * 80 },
        );
      });
    }

    function settle() {
      if (!animations.some((animation) => animation.playState === "running"))
        return;
      const starts = letters.map(
        (letter) => getComputedStyle(letter).transform,
      );
      reset();
      animations = letters.map((letter, index) =>
        letter.animate([{ transform: starts[index] }, { transform: "none" }], {
          duration: 480,
          easing: "cubic-bezier(.16, 1, .3, 1)",
        }),
      );
    }

    heading.addEventListener("pointerenter", scatter);
    heading.addEventListener("pointerleave", settle);
    motion.addEventListener("change", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      reset();
      heading.removeEventListener("pointerenter", scatter);
      heading.removeEventListener("pointerleave", settle);
      motion.removeEventListener("change", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  return (
    <div className="lobby-scatter-intro">
      <h1
        className="lobby-scatter-heading"
        aria-label={headline}
        ref={headingRef}
      >
        {Array.from(headline).map((letter, index) => (
          <Fragment key={index}>
            <i
              className="lobby-scatter-letter"
              data-luck={"幸运".includes(letter)}
              aria-hidden="true"
            >
              {letter}
            </i>
            {letter === "，" && (
              <br className="lobby-scatter-break" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </h1>
      <p>转盘就绪，牌桌入席。选择你的幸运方式。</p>
    </div>
  );
}
