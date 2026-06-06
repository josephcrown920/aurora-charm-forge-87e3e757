import { Link } from "@tanstack/react-router";
import { ArrowRight, ImageIcon, Wand2, Film, Sparkles, CheckCircle2 } from "lucide-react";
import shot1 from "@/assets/showcase-1.jpg";
import shot3 from "@/assets/showcase-3.jpg";
import shot5 from "@/assets/showcase-5.jpg";
import joshStill from "@/assets/josh-performance-still-v1.jpg";

/**
 * AI Canvas — shows a real, finished workflow:
 *   Selfie ──► Style transfer ──► Motion shot ──► Final still
 * Ends in the finished rendered frame (static image, not video).
 */
export function CanvasShowcase() {


  return (
    <section className="relative z-10 mx-4 md:mx-12 my-16 rounded-[32px] overflow-hidden border border-white/10 animate-fade-in"
      style={{ background: "radial-gradient(circle at 50% 0%, #0f2954 0%, #08152e 60%, #050a17 100%)" }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.2) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative px-6 md:px-12 py-14 md:py-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-200 text-[11px] uppercase tracking-widest">
            <Sparkles className="size-3" /> Finished render
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-white">
            One selfie. Four nodes. <span className="text-cyan-300">A cinematic shot.</span>
          </h2>
          <p className="mt-3 text-white/65 text-base md:text-lg">
            This is a real Aurora Canvas pipeline — pulled straight from the editor, ending in the finished video.
          </p>
        </div>

        {/* Workflow pipeline */}
        <div className="mt-12 grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.2fr] gap-3 md:gap-2 items-center">
          {/* Node 1 — Input */}
          <WorkflowNode
            tag="01 · Input"
            title="Selfie"
            icon={<ImageIcon className="size-3.5" />}
            color="violet"
            image={joshStill}
            status="Loaded"
          />
          <Arrow />

          {/* Node 2 — Style */}
          <WorkflowNode
            tag="02 · Style"
            title="Nano Banana Pro"
            icon={<Wand2 className="size-3.5" />}
            color="fuchsia"
            image={shot1}
            status="Stylized"
          />
          <Arrow />

          {/* Node 3 — Motion */}
          <WorkflowNode
            tag="03 · Motion"
            title="Seedance 2.0"
            icon={<Film className="size-3.5" />}
            color="cyan"
            image={shot3}
            status="Animated · 5s"
          />
          <Arrow />

          {/* Node 4 — Finished render (static image, no video) */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300/50 bg-black shadow-[0_0_60px_-10px_rgba(110,231,183,0.45)]">
            <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/90 text-[10px] font-bold text-emerald-950">
              <CheckCircle2 className="size-3" /> RENDERED
            </div>
            <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 border border-white/15 text-[10px] font-semibold text-white">
              Kling 3.0 · 10s
            </div>
            <img
              src={shot5 || joshStill}
              alt="Performance Studio — finished render"
              className="w-full aspect-[3/4] object-cover"
            />
            <div className="p-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
              <p className="text-xs font-semibold text-white">Performance Studio · finished</p>
              <p className="text-[10px] text-emerald-300/90 mt-0.5">Selfie → cinematic stage performance · 11 Aurora</p>
            </div>
          </div>

        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/canvas"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-cyan-950 no-underline hover:opacity-95"
          >
            Open this workflow in Canvas <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/workflows"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-white/10"
          >
            Browse trending workflows
          </Link>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <div className="relative w-full h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10">
        <span className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)] animate-pulse" />
      </div>
    </div>
  );
}

type NodeColor = "violet" | "fuchsia" | "cyan";

function WorkflowNode({
  tag, title, icon, color, image, status,
}: { tag: string; title: string; icon: React.ReactNode; color: NodeColor; image: string; status: string }) {
  const ring =
    color === "violet" ? "border-violet-300/40 shadow-violet-500/20" :
    color === "fuchsia" ? "border-fuchsia-300/40 shadow-fuchsia-500/20" :
    "border-cyan-300/40 shadow-cyan-500/20";
  const dot =
    color === "violet" ? "bg-violet-300" :
    color === "fuchsia" ? "bg-fuchsia-300" :
    "bg-cyan-300";

  return (
    <div className={`rounded-2xl overflow-hidden border bg-black/40 backdrop-blur-sm shadow-xl ${ring}`}>
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/70">
          <span className={`size-1.5 rounded-full ${dot}`} />
          {tag}
        </span>
        <span className="text-white/60">{icon}</span>
      </div>
      <img src={image} alt={title} className="w-full aspect-[3/4] object-cover" />
      <div className="p-3 border-t border-white/10">
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[10px] text-white/55 mt-0.5">{status}</p>
      </div>
    </div>
  );
}
