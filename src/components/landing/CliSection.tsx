import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Copy, Terminal } from "lucide-react";

const COMMANDS = [
  "aurora login",
  "aurora image \"cinematic product shot, chrome headphones\"",
  "aurora video --from latest --motion orbit --seconds 10",
  "aurora sync --clip creator.mp4 --audio hook.wav",
];

export function CliSection() {
  return (
    <section className="relative z-10 mx-4 md:mx-12 my-16 overflow-hidden rounded-[32px] border border-white/10 bg-[#06070d] animate-fade-in">
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: "radial-gradient(circle at 80% 10%, rgba(34,211,238,.22), transparent 34%), radial-gradient(circle at 15% 80%, rgba(168,85,247,.24), transparent 38%)" }} />
      <div className="relative grid gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-12 md:py-20 md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-200">
            <Terminal className="size-3.5" /> Aurora CLI
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Run Aurora from your terminal.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/68 md:text-lg">
            Generate images, videos, UGC variations, motion passes, lip-sync renders, and color studies from scripts, automations, and production pipelines.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-cyan-950 no-underline hover:opacity-95"
            >
              Open Studio <ArrowRight className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText("npm install -g aurora-cli")}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Copy className="size-4" /> Copy install
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/70 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-yellow-300" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-mono text-[11px] text-white/45">aurora-cli</span>
          </div>
          <div className="space-y-4 p-4 font-mono text-xs text-white/82 md:p-6 md:text-sm">
            <p><span className="text-cyan-300">$</span> npm install -g aurora-cli</p>
            {COMMANDS.map((command) => (
              <p key={command}><span className="text-cyan-300">$</span> {command}</p>
            ))}
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-200">
              <p className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Render queued · aurora://jobs/ugc-042</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}