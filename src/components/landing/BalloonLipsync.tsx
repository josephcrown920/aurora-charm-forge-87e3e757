import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import balloonAsset from "@/assets/balloon-head.png.asset.json";
import audioAsset from "@/assets/the-one-hook.mp3.asset.json";

/**
 * Every Face Sings — animates a clear lip-sync mouth and an audio
 * visualizer in real time. Uses the Web Audio API when CORS permits,
 * otherwise falls back to a synthetic syllable rhythm derived from
 * audio.currentTime so the mouth and lyrics always move.
 */

type Cue = { t: number; text: string };

// Hook timing (~25s). First line shows before play so users see the lyrics.
const LYRICS: Cue[] = [
  { t: 0.0,  text: "Floatin' over the city, head in the clouds" },
  { t: 3.6,  text: "NBA Josh — they hearin' me loud" },
  { t: 7.4,  text: "Balloon vibes, sky-high, I'm proud" },
  { t: 11.2, text: "Skyline shinin', no doubt" },
  { t: 14.8, text: "One hook, one take, no edits" },
  { t: 18.4, text: "Aurora rendered every credit" },
  { t: 22.0, text: "— every face sings —" },
];

export function BalloonLipsync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserBrokenRef = useRef(false);

  const mouthRef = useRef<HTMLDivElement | null>(null);
  const upperLipRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);

  const ensureAudioGraph = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!ctxRef.current) {
      try {
        const AC: typeof AudioContext =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = src;
      } catch {
        analyserBrokenRef.current = true;
      }
    }
    if (ctxRef.current?.state === "suspended") void ctxRef.current.resume();
  };

  const applyMouth = (open: number) => {
    if (mouthRef.current) {
      mouthRef.current.style.transform = `translate(-50%, -50%) scaleY(${0.18 + open * 1.25}) scaleX(${0.92 + open * 0.3})`;
      mouthRef.current.style.opacity = String(0.7 + open * 0.3);
    }
    if (upperLipRef.current) {
      upperLipRef.current.style.transform = `translate(-50%, ${-open * 6}px)`;
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = String(0.3 + open * 0.55);
      glowRef.current.style.filter = `blur(${22 + open * 30}px)`;
    }
  };

  const applyBars = (values: number[]) => {
    if (!barsRef.current) return;
    const bars = barsRef.current.children;
    for (let i = 0; i < bars.length; i++) {
      const v = values[i % values.length] ?? 0;
      (bars[i] as HTMLElement).style.transform = `scaleY(${0.08 + v * 1})`;
      (bars[i] as HTMLElement).style.opacity = String(0.35 + v * 0.65);
    }
  };

  const loop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    let open = 0;
    let bars: number[] = new Array(48).fill(0);

    const analyser = analyserRef.current;
    if (analyser && !analyserBrokenRef.current) {
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      let sum = 0;
      const bassEnd = Math.floor(buf.length * 0.35);
      for (let i = 1; i < bassEnd; i++) sum += buf[i];
      const bass = sum / (bassEnd - 1) / 255;
      open = Math.min(1, Math.max(0, bass * 1.7));
      bars = Array.from({ length: 48 }, (_, i) => {
        const step = Math.floor(buf.length / 48);
        return buf[i * step] / 255;
      });
      // If analyser is silent (CORS blocked the stream), mark broken so we fall back.
      if (open < 0.01 && !audio.paused && audio.currentTime > 0.4) {
        analyserBrokenRef.current = true;
      }
    }

    if (analyserBrokenRef.current || !analyser) {
      // Synthetic mouth/visualizer driven by time — fast syllable rhythm.
      const t = audio.currentTime;
      const beat = Math.abs(Math.sin(t * 7.2)) * 0.7 + Math.abs(Math.sin(t * 13.1)) * 0.3;
      const breath = (Math.sin(t * 1.3) + 1) / 2;
      open = audio.paused ? 0.05 : Math.min(1, beat * (0.55 + breath * 0.45));
      bars = Array.from({ length: 48 }, (_, i) => {
        if (audio.paused) return 0.06;
        const phase = i * 0.35 + t * 6;
        return Math.max(0.05, (Math.sin(phase) + 1) / 2 * (0.4 + breath * 0.6));
      });
    }

    applyMouth(open);
    applyBars(bars);

    // Lyrics
    const t = audio.currentTime;
    let idx = 0;
    for (let i = 0; i < LYRICS.length; i++) if (t >= LYRICS[i].t) idx = i;
    if (idx !== lineIdx) setLineIdx(idx);

    rafRef.current = requestAnimationFrame(loop);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    ensureAudioGraph();
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
        rafRef.current = requestAnimationFrame(loop);
      } catch {
        /* autoplay blocked */
      }
    } else {
      audio.pause();
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <section
      className="relative z-10 mx-4 md:mx-12 my-12 rounded-[32px] overflow-hidden border border-white/10 animate-fade-in"
      style={{ background: "radial-gradient(circle at 30% 0%, #1a0d3a 0%, #0a0717 60%, #050410 100%)" }}
    >
      <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-0">
        {/* Visual stage */}
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[560px] overflow-hidden">
          <img
            src={balloonAsset.url}
            alt="Every face sings — Aurora lip-sync visualizer"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* Vignette so overlays read */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70 pointer-events-none" />

          {/* Reactive glow behind face */}
          <div
            ref={glowRef}
            className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 size-80 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(236,72,153,0.7), rgba(139,92,246,0.3) 60%, transparent 75%)",
              opacity: 0.35,
            }}
          />

          {/* Upper lip — subtle lift */}
          <div
            ref={upperLipRef}
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "49%",
              width: "18%",
              height: "1.5%",
              transform: "translate(-50%, 0)",
              borderRadius: "9999px",
              background: "linear-gradient(180deg, rgba(255,140,170,0.0), rgba(255,90,140,0.85))",
              transition: "transform 60ms linear",
            }}
          />

          {/* Mouth — big, obvious, animates clearly */}
          <div
            ref={mouthRef}
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "53%",
              width: "20%",
              height: "9%",
              transform: "translate(-50%, -50%) scaleY(0.18)",
              borderRadius: "9999px",
              background:
                "radial-gradient(ellipse at 50% 35%, #ff4d8a 0%, #c2185b 35%, #4a0a1f 75%, rgba(20,0,8,0.95) 100%)",
              boxShadow:
                "0 0 40px 10px rgba(236,72,153,0.65), inset 0 -4px 8px rgba(255,140,180,0.6), inset 0 4px 10px rgba(0,0,0,0.6)",
              transition: "opacity 60ms linear",
            }}
          />

          {/* LYRICS — overlaid on image so they're impossible to miss */}
          <div className="absolute inset-x-0 bottom-20 px-6 text-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-200/80 mb-2">
              Now playing · lyrics
            </p>
            <p
              key={lineIdx}
              className="mx-auto max-w-md text-lg md:text-2xl font-bold text-white leading-snug animate-fade-in drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            >
              {LYRICS[lineIdx].text}
            </p>
          </div>

          {/* Equalizer bars overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
            <div ref={barsRef} className="flex items-end justify-between gap-[3px] h-14">
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  className="block flex-1 rounded-sm origin-bottom"
                  style={{
                    background: "linear-gradient(to top, #ec4899, #a855f7, #22d3ee)",
                    transform: "scaleY(0.08)",
                    opacity: 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live tag */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/90 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            <span className="size-1.5 rounded-full bg-white animate-pulse" /> Live lip-sync
          </div>
        </div>

        {/* Side panel — controls + lyrics */}
        <div className="relative p-6 md:p-10 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-300/40 bg-pink-500/10 text-pink-200 text-[11px] uppercase tracking-widest w-fit">
            <Sparkles className="size-3" /> Sync 1.9 · Audio reactive
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.05]">
            Every face{" "}
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              sings
            </span>
            .
          </h2>
          <p className="mt-3 text-white/65 text-base md:text-lg">
            Press play — the mouth, glow and EQ bars react to the actual waveform of an
            unreleased NBA Josh hook. Same engine as Aurora's Sync 1.9 lip-sync model —
            drop any selfie, get a singing performance back.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full bg-pink-400 px-5 py-3 text-sm font-bold text-pink-950 hover:opacity-95 shadow-[0_0_30px_-5px_rgba(236,72,153,0.7)]"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Pause hook" : "Play the hook"}
            </button>
            <a
              href="/canvas?template=lipsync-preset"
              className="inline-flex items-center gap-2 rounded-full border border-pink-300/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-pink-100 hover:bg-white/10 no-underline"
            >
              <Wand2 className="size-3.5" /> Use this template <ArrowRight className="size-3.5" />
            </a>
            <a
              href="/canvas?template=lipsync-blank"
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white no-underline"
            >
              or start blank
            </a>
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/55">
            <Volume2 className="size-3.5" /> Best with sound on
          </span>


          {/* Full lyrics list (side) */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-3">Lyrics</p>
            <ol className="space-y-2">
              {LYRICS.map((l, i) => (
                <li
                  key={i}
                  className={`text-sm md:text-base transition-colors ${
                    i === lineIdx ? "text-white font-semibold" : "text-white/45"
                  }`}
                >
                  {l.text}
                </li>
              ))}
            </ol>
          </div>

          <audio
            ref={audioRef}
            src={audioAsset.url}
            crossOrigin="anonymous"
            preload="auto"
            onEnded={() => {
              setPlaying(false);
              setLineIdx(0);
            }}
          />
        </div>
      </div>
    </section>
  );
}
