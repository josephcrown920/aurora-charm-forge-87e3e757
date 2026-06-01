import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Image as ImageIcon, Mic2, Film, Wand2, CheckCircle2 } from "lucide-react";
import joshStill from "@/assets/josh-performance-still-v1.jpg";
import joshRef from "@/assets/ref-josh-front.jpeg";
import showcase from "@/assets/showcase-3.jpg";

const FINISHED_VIDEO = "/__l5e/assets-v1/438b3b44-9d3b-4735-970b-632f3557616d/video-josh-performance.mp4";

const NODES = [
  { icon: ImageIcon, label: "Selfie", sub: "1 image", tone: "from-violet-500/40 to-fuchsia-500/10" },
  { icon: Mic2, label: "Audio", sub: "Suno · 30s", tone: "from-emerald-500/40 to-teal-500/10" },
  { icon: Wand2, label: "Style", sub: "Cinematic", tone: "from-amber-500/40 to-rose-500/10" },
  { icon: Film, label: "Render", sub: "Kling 3.0", tone: "from-cyan-500/40 to-blue-500/10" },
];

/**
 * Landing showpiece: Canvas pipeline → finished generation (image + auto-playing video).
 * No user data — purely a marketing demo of what Aurora ships.
 */
export function FinishedExample() {
  return (
    <section className="relative z-10 px-6 md:px-12 pb-20">
      <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Live example</p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
          From one selfie to a finished video.
        </h2>
        <p className="text-white/65 mt-4 text-sm md:text-base">
          This is a real Aurora Canvas pipeline. Wire the nodes, hit run, watch the shot render. No editor, no plugins.
        </p>
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d0a24] via-[#0a0817] to-[#070612] overflow-hidden p-5 md:p-8">
        {/* Grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,.45), transparent 60%)" }} />

        <div className="relative grid lg:grid-cols-[1.05fr_1.4fr] gap-6 items-stretch">
          {/* LEFT: Canvas pipeline */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Aurora Canvas · live
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/40">4 nodes</span>
            </div>

            <div className="relative space-y-3">
              {NODES.map((n, i) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.label}
                    className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <div className={`absolute -inset-10 blur-2xl opacity-30 bg-gradient-to-br ${n.tone}`} />
                    <span className="relative size-9 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center">
                      <Icon className="size-4 text-violet-200" />
                    </span>
                    <div className="relative flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{n.label}</div>
                      <div className="text-[11px] text-white/45">{n.sub}</div>
                    </div>
                    <span className="relative text-[10px] text-emerald-300/90 inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> ready
                    </span>
                    {i < NODES.length - 1 && (
                      <span className="absolute left-7 -bottom-3 h-3 w-px bg-gradient-to-b from-violet-400/60 to-transparent" />
                    )}
                  </div>
                );
              })}

              {/* Run button */}
              <Link
                to="/canvas"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white no-underline shadow-lg shadow-violet-500/30 hover:opacity-95"
              >
                <Sparkles className="size-4" /> Run this pipeline
              </Link>
            </div>

            {/* Inputs strip */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[joshRef, showcase, joshStill].map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Finished generation */}
          <div className="relative rounded-2xl border border-white/15 bg-black overflow-hidden min-h-[420px] group">
            {/* Animated shimmer while loading the video poster */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/10 to-transparent" />
            <video
              src={FINISHED_VIDEO}
              poster={joshStill}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Generation animation overlay — sweeping shimmer */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute -inset-y-10 -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3.2s_ease-in-out_infinite]"
                style={{ animationName: "shimmer" }}
              />
            </div>
            {/* HUD chips */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur border border-white/15 text-[10px] text-white">
                Kling 3.0 · 10s
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur border border-emerald-400/40 text-[10px] text-emerald-200 inline-flex items-center gap-1">
                <span className="size-1 rounded-full bg-emerald-300 animate-pulse" /> rendered
              </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">Performance Studio · finished render</div>
                  <div className="text-[11px] text-white/60 truncate">Selfie → cinematic stage performance · 28s total</div>
                </div>
                <Link
                  to="/gallery"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold no-underline hover:opacity-90"
                >
                  See more <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local keyframes for the shimmer (Tailwind v4 friendly) */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-30%) rotate(12deg); opacity: 0; }
          30%  { opacity: .9; }
          100% { transform: translateX(380%) rotate(12deg); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
