import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import type { Round } from "../types";
import "./DealerFilm.css";

export function DealerFilm({ round }: { round: Round }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = round.stage === "CLOSED";
  const idle = round.stage === "OPEN";

  useEffect(() => {
    const root = rootRef.current!;
    const video = videoRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;

    function sync() {
      video.pause();
      if (video.readyState < 1) return;
      if (idle) video.currentTime = 0;
      else
        video.currentTime = Math.min(
          9.95,
          Math.max(0, (Date.now() - round.closesAt) / 1000),
        );
      if (
        active &&
        visible &&
        !document.hidden &&
        !reduced.matches &&
        !failed
      ) {
        void video
          .play()
          .then(() => {
            if (!disposed) setBlocked(false);
          })
          .catch(() => {
            if (!disposed) setBlocked(true);
          });
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    video.addEventListener("loadedmetadata", sync);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();
    return () => {
      disposed = true;
      video.pause();
      observer.disconnect();
      video.removeEventListener("loadedmetadata", sync);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [active, idle, round.closesAt, failed]);

  function playWithSound() {
    const video = videoRef.current!;
    const next = !muted;
    video.muted = next;
    video.volume = 0.6;
    setMuted(next);
    if (active)
      void video
        .play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
  }

  return (
    <div className="dealer-film" ref={rootRef}>
      <img
        className="dealer-film-still"
        src={
          idle
            ? "/assets/dealer-video-idle.jpg"
            : "/assets/dealer-video-end.jpg"
        }
        alt=""
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        className={`dealer-film-video ${failed ? "unavailable" : ""}`}
        src="/assets/dealer-shake-10s.mp4"
        poster="/assets/dealer-video-idle.jpg"
        preload="auto"
        muted={muted}
        playsInline
        aria-hidden="true"
        onError={() => setFailed(true)}
      />
      {!failed && (
        <div className="dealer-film-controls">
          {blocked && active && (
            <button
              onClick={() => {
                videoRef.current!.currentTime = Math.min(
                  9.95,
                  Math.max(0, (Date.now() - round.closesAt) / 1000),
                );
                void videoRef
                  .current!.play()
                  .then(() => setBlocked(false))
                  .catch(() => setBlocked(true));
              }}
            >
              <Play size={15} />
              播放摇骰
            </button>
          )}
          <button
            onClick={playWithSound}
            aria-label={muted ? "开启摇骰声音" : "关闭摇骰声音"}
            aria-pressed={!muted}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {muted ? "声音关闭" : "声音开启"}
          </button>
        </div>
      )}
    </div>
  );
}
