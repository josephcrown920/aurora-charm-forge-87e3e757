import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Sparkles } from "lucide-react";
import balloonAsset from "@/assets/balloon-head.png.asset.json";
import audioAsset from "@/assets/the-one-hook.mp3.asset.json";

/**
 * Balloon Head Lip-sync — animates the balloon face's mouth + a frequency
 * visualizer in real time using the Web Audio API analyser.
 *
 * Lyrics scroll in sync (approximate timing — first hook of the track).
 */

type Cue = { t: number; text: string };
// Rough timing — adjust if the bounce feels off. ~25s hook.
const LYRICS: Cue[] = [
  { t: 0.0, text: "Floatin' over the city, head in the clouds" },
  { t: 3.6, text: "NBA Josh — they hearin' me loud" },
  { t: 7.4, text: "Balloon vibes, sky‑high, I'm proud" },
  { t: 11.2, text: "Skyline shinin', no doubt" },
  { t: 14.8, text: "One hook, one take, no edits" },
  { t: 18.4, text: "Aurora rendered every credit" },
  { t: 22.0, text: "—" },
];

export function BalloonLipsync() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const mouthRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(LYRICS[0].text);

  const ensureAudioGraph = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!ctxRef.current) {
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
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
  };

  const loop = () => {
    const analyser = analyserRef.current;
    const audio = audioRef.current;
    if (!analyser || !audio) return;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);

    // Mouth driven by low–mid energy (voice band)
    let bassSum = 0;
    const bassEnd = Math.floor(buf.length * 0.35);
    for (let i = 1; i < bassEnd; i++) bassSum += buf[i];
    const bass = bassSum / (bassEnd - 1) / 255; // 0..1
    const open = Math.min(1, Math.max(0.02, bass * 1.6));

    if (mouthRef.current) {
      mouthRef.current.style.transform = `translate(-50%, -50%) scaleY(${0.15 + open * 1.05}) scaleX(${0.9 + open * 0.25})`;
      mouthRef.current.style.opacity = String(0.55 + open * 0.45);
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = String(0.35 + open * 0.5);
      glowRef.current.style.filter = `blur(${24 + open * 28}px)`;
    }

    // Equalizer bars
    if (barsRef.current) {
      const bars = barsRef.current.children;
      const step = Math.floor(buf.length / bars.length);
      for (let i = 0; i < bars.length; i++) {
        const v = buf[i * step] / 255;
        (bars[i] as HTMLElement).style.transform = `scaleY(${0.08 + v * 1})`;
        (bars[i] as HTMLElement).style.opacity = String(0.35 + v * 0.65);
      }
    }

    // Lyrics
    const t = audio.currentTime;
    let cue = LYRICS[0].text;
    for (const c of LYRICS) if (t >= c.t) cue = c.text;
    if (cue !== line) setLine(cue);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative z-10 mx-4 md:mx-12 my-12 rounded-[32px] overflow-hidden border border-white/10 animate-fade-in"
      style={{ background: "radial-gradient(circle at 30% 0%, #1a0d3a 0%, #0a0717 60%, #050410 100%)" }}>
      <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-0">
        {/* Visual stage */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[520px] overflow-hidden">
          <img
            src={balloonAsset.url}
            alt="NBA Josh balloon head — lip-sync visualizer"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* Reactive glow behind face */}
          <div
            ref={glowRef}
            className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 size-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.65), rgba(139,92,246,0.25) 60%, transparent 75%)", opacity: 0.3 }}
          />
          {/* Mouth overlay — sits over the lips area of the photo */}
          <div
            ref={mouthRef}
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "47%",
              width: "12%",
              height: "5.5%",
              transform: "translate(-50%, -50%) scaleY(0.15)",
              borderRadius: "9999px",
              background:
                "radial-gradient(ellipse at 50% 40%, #1a0a14 0%, #2a0a1a 40%, rgba(40,10,25,0.85) 75%, transparent 100%)",
              boxShadow:
                "0 0 24px 6px rgba(236,72,153,0.5), inset 0 -2px 4px rgba(255,90,140,0.4)",
              transition: "opacity 60ms linear",
            }}
          />
          {/* Equalizer bars overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <div ref={barsRef} className="flex items-end justify-between gap-[3px] h-16">
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
            <span className="size-1.5 rounded-full bg-white animate-pulse" /> Live lip‑sync
          </div>
        </div>

        {/* Side panel — controls + lyrics */}
        <div className="relative p-6 md:p-10 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-300/40 bg-pink-500/10 text-pink-200 text-[11px] uppercase tracking-widest w-fit">
            <Sparkles className="size-3" /> Sync 1.9 · Audio reactive
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.05]">
            The balloon <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">sings</span>.
          </h2>
          <p className="mt-3 text-white/65 text-base md:text-lg">
            Press play — the mouth, glow, and EQ bars react to the actual waveform of an
            unreleased NBA Josh hook. Same engine as Aurora's Sync 1.9 lip‑sync model.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full bg-pink-400 px-5 py-3 text-sm font-bold text-pink-950 hover:opacity-95 shadow-[0_0_30px_-5px_rgba(236,72,153,0.7)]"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Pause hook" : "Play the hook"}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/55">
              <Volume2 className="size-3.5" /> Best with sound on
            </span>
          </div>

          {/* Lyrics ticker */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Now playing · lyrics</p>
            <p
              key={line}
              className="text-xl md:text-2xl font-semibold text-white leading-snug animate-fade-in"
            >
              {line === "—" ? <span className="text-white/40">— end of hook —</span> : line}
            </p>
          </div>

          <audio
            ref={audioRef}
            src={audioAsset.url}
            crossOrigin="anonymous"
            preload="auto"
            onEnded={() => setPlaying(false)}
          />
        </div>
      </div>
    </section>
  );
}
