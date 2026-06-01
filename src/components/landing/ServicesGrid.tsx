import { Camera, Film, Wand2, Megaphone, Shirt, Activity, Workflow, Bot, Image as ImageIcon, CreditCard } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SERVICES = [
  { icon: ImageIcon, title: "AI Image Generation", desc: "Magazine-grade portraits from a selfie. Seedream 4.5, Nano Banana Pro, more.", to: "/studio" as const, accent: "from-violet-500/30 to-fuchsia-500/10" },
  { icon: Film, title: "AI Video Generation", desc: "Cinematic 5–10s clips. Seedance 2.0 and Kling 3.0 in one canvas.", to: "/canvas" as const, accent: "from-indigo-500/30 to-violet-500/10" },
  { icon: Wand2, title: "AI Lip-Sync Studio", desc: "Frame-accurate Sync 1.9 lip-sync. Music videos and UGC that don't look uncanny.", to: "/lipsync" as const, accent: "from-emerald-500/30 to-teal-500/10" },
  { icon: Megaphone, title: "UGC Ad Creation", desc: "Scroll-stopping ad creatives from one selfie. Built for TikTok, Reels, Shorts.", to: "/ugc" as const, accent: "from-rose-500/30 to-pink-500/10" },
  { icon: Shirt, title: "Virtual Try-On", desc: "Drop a product, drop a model. Get on-figure photography in seconds.", to: "/studio" as const, accent: "from-amber-500/30 to-orange-500/10" },
  { icon: Activity, title: "Motion Transfer", desc: "Take a reference move, apply it to your character. Real dance, real choreography.", to: "/canvas" as const, accent: "from-cyan-500/30 to-blue-500/10" },
  { icon: Workflow, title: "Workflow Canvas", desc: "Wire selfie, outfit, audio and prompt nodes. Save, share, re-run.", to: "/canvas" as const, accent: "from-fuchsia-500/30 to-purple-500/10" },
  { icon: Bot, title: "AI Agent & Automation", desc: "Brief the agent in plain language. Get shot lists, prompts, full pipelines.", to: "/canvas" as const, accent: "from-pink-500/30 to-rose-500/10" },
];

export function ServicesGrid() {
  return (
    <section id="services" className="relative z-10 px-6 md:px-12 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Our services</p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Every creative tool. One studio.</h2>
        <p className="text-white/65 mt-4">
          From cinematic photos to fully produced ad creatives, Aurora replaces expensive shoots, video crews and a stack of AI subscriptions.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.title}
              to={s.to}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 overflow-hidden no-underline hover:-translate-y-1 transition-all duration-300 hover:border-violet-400/40 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className={`absolute -inset-20 blur-3xl opacity-40 bg-gradient-to-br ${s.accent} group-hover:opacity-70 transition-opacity`} />
              <div className="relative">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 border border-white/10 mb-4">
                  <Icon className="size-5 text-violet-200" />
                </span>
                <h3 className="text-base font-semibold text-white">{s.title}</h3>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5"><CreditCard className="size-3.5 text-violet-300" /> Credit-based · no per-model surcharge</span>
        <span className="hidden sm:inline text-white/20">·</span>
        <span className="inline-flex items-center gap-1.5"><Camera className="size-3.5 text-violet-300" /> Commercial license on every plan</span>
      </div>
    </section>
  );
}
