import { useState } from "react";
import { Terminal, Copy, Check, Sparkles } from "lucide-react";
import { track } from "@/lib/tracking";

const INSTALL = "npm install -g @aurora-studio/cli";
const LOGIN = "aurora login";
const GENERATE = `aurora generate \\
  --model nano-banana-pro \\
  --prompt "neon-lit Tokyo rooftop, cinematic 35mm" \\
  --ref ./selfie.jpg \\
  --out ./shot.png`;

const LINES = [
  { p: "$", t: "aurora login", c: "text-emerald-300" },
  { p: ">", t: "Opening browser… signed in as josh@aurora.studio", c: "text-white/50" },
  { p: "$", t: "aurora generate --model seedance-2.0 --prompt 'desert chase' --duration 5", c: "text-emerald-300" },
  { p: ">", t: "✓ Job queued · q_8f3b · 5 credits", c: "text-white/50" },
  { p: ">", t: "✓ Rendering on H100 · 00:42", c: "text-white/50" },
  { p: ">", t: "✓ Saved → ~/aurora/renders/desert-chase.mp4", c: "text-cyan-300" },
];

export function CliSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    void track("cli_copy", { key });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="relative z-10 mx-4 md:mx-12 my-16 rounded-[32px] overflow-hidden border border-white/10 bg-[#070710] animate-fade-in">
      <div className="absolute inset-0 pointer-events-none opacity-50"
        style={{ background: "radial-gradient(circle at 80% 0%, rgba(110,231,183,0.18), transparent 55%)" }} />

      <div className="relative grid md:grid-cols-2 gap-10 px-6 md:px-12 py-14 md:py-20 items-center">
        {/* Pitch */}
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 text-emerald-200 text-[11px] uppercase tracking-widest">
            <Terminal className="size-3" /> Aurora CLI · Beta
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-white">
            Ship campaigns from
            <span className="block bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">your terminal.</span>
          </h2>
          <p className="mt-4 text-white/65 max-w-md">
            One npm package. Every Aurora model. Scriptable batch renders, CI/CD-friendly, perfect for agencies and devs.
          </p>

          <div className="mt-6 space-y-2">
            <CmdRow text={INSTALL} onCopy={() => copy(INSTALL, "install")} copied={copied === "install"} />
            <CmdRow text={LOGIN} onCopy={() => copy(LOGIN, "login")} copied={copied === "login"} />
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-2 text-xs text-white/70">
            {[
              "Batch render queues",
              "Webhook-driven jobs",
              "Streamable logs",
              "Project-scoped API keys",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles className="size-3 text-emerald-300" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Terminal */}
        <div className="rounded-2xl border border-white/10 bg-black/80 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-yellow-400/80" />
            <span className="size-2.5 rounded-full bg-green-400/80" />
            <span className="ml-3 text-[11px] text-white/40 font-mono">aurora — zsh</span>
            <button
              onClick={() => copy(GENERATE, "generate")}
              className="ml-auto inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white"
            >
              {copied === "generate" ? <Check className="size-3 text-emerald-300" /> : <Copy className="size-3" />}
              {copied === "generate" ? "copied" : "copy"}
            </button>
          </div>
          <pre className="px-4 py-4 text-[12px] leading-6 font-mono overflow-x-auto">
            {LINES.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-white/30 select-none">{l.p}</span>
                <span className={l.c}>{l.t}</span>
              </div>
            ))}
            <div className="mt-3 text-white/30 text-[11px]">{/* template */}# Or run a full pipeline:</div>
            <code className="text-fuchsia-300 whitespace-pre-wrap">{GENERATE}</code>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-white/30">$</span>
              <span className="inline-block w-2 h-4 bg-emerald-300 animate-pulse" />
            </div>
          </pre>
        </div>
      </div>
    </section>
  );
}

function CmdRow({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white/85">
      <span className="text-emerald-300">$</span>
      <span className="flex-1 truncate">{text}</span>
      <button onClick={onCopy} className="text-white/50 hover:text-white inline-flex items-center gap-1 text-[10px]">
        {copied ? <Check className="size-3 text-emerald-300" /> : <Copy className="size-3" />}
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
