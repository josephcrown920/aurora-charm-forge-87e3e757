import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Play, BookOpen, Wand2, Film, Camera } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { trackAffiliateClick } from "@/lib/affiliate.functions";
import { useAuth } from "@/hooks/use-auth";
import { TutorialModal } from "@/components/TutorialModal";
import { SiteFooter } from "@/components/SiteFooter";
import { SHOWCASE_MODELS } from "@/lib/models";
import { SplitReality } from "@/components/landing/SplitReality";
import { LipSyncDemo } from "@/components/landing/LipSyncDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { ModelCardArt } from "@/components/landing/ModelCardArt";
import { LeadCapture } from "@/components/landing/LeadCapture";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";
import { TrustBar } from "@/components/landing/TrustBar";
import { StickyCreditsBar } from "@/components/landing/StickyCreditsBar";
import { ExitIntentModal } from "@/components/landing/ExitIntentModal";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { ReferralBlock } from "@/components/landing/ReferralBlock";
import { TrendingWorkflows, FeaturesGrid } from "@/components/landing/TrendingWorkflows";
import {
  SupercomputerSection,
  MarketingStudioSection,
  SupercomputerCard,
  MotionControlSection,
  OneClickVideoSection,
  AiCanvasSection,
} from "@/components/landing/ScreenshotSections";

import { track } from "@/lib/tracking";
import shot1 from "@/assets/showcase-1.jpg";
import shot2 from "@/assets/showcase-2.jpg";
import shot3 from "@/assets/showcase-3.jpg";
import shot4 from "@/assets/showcase-4.jpg";
import shot5 from "@/assets/showcase-5.jpg";
import shot6 from "@/assets/showcase-6.jpg";

const FAQ_ITEMS = [
  { q: "How do credits work?", a: "1 credit ≈ 1 image. Videos cost 5 credits (5s) or 10 credits (10s). Lip-sync is 1 credit per second. Credits never expire and roll across all models." },
  { q: "Can I use the results commercially?", a: "Yes. Every paid plan includes a full commercial license for the outputs you generate — ads, music videos, UGC, client deliverables. You own the renders." },
  { q: "Which models are included?", a: "All of them. Seedance 2.0, Kling 3.0, Nano Banana Pro, Seedream 4.5, Sync 1.9 lip-sync, and every new model we ship. No per-model surcharge." },
  { q: "Do you store my photos?", a: "Uploads are stored privately in your account so you can re-render. You can delete any asset at any time from your dashboard, and we never train on user content." },
  { q: "What if I'm not happy?", a: "7-day refund on any unused credits, no questions asked. Email us and we'll return your remaining balance." },
  { q: "Is there a free trial?", a: "Yes — every new account gets 5 free credits the moment you sign in. Enough to test image generation and decide if Aurora is for you." },
];

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Aurora Studio — Turn a selfie into a cinematic performance" },
      { name: "description", content: "Aurora gives you the world's best AI image and video models — Seedance 2.0, Kling 3.0, Nano Banana Pro — in one studio. Selfie in, performance out." },
      { property: "og:title", content: "Aurora Studio — Shoot like you're on the main stage" },
      { property: "og:description", content: "Cinematic AI performance shots, lip-sync videos and UGC ads from one selfie. All top models in one credit-based studio." },
      { property: "og:url", content: "https://aurorastudiostar.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://aurorastudiostar.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});


const TILES = [
  { src: shot1, label: "Concert wash" },
  { src: shot2, label: "Editorial" },
  { src: shot3, label: "Golden hour" },
  { src: shot4, label: "Pastel dream" },
  { src: shot5, label: "Rembrandt" },
  { src: shot6, label: "Butterfly beauty" },
];

function Index() {
  const { user } = useAuth();
  const ctaLabel = user ? "Open Studio" : "Try it free";
  const greeting = user?.user_metadata?.display_name
    ? `Welcome back, ${String(user.user_metadata.display_name).split(" ")[0]}`
    : "Welcome to Aurora";
  const [tutorialTick, setTutorialTick] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const trackRef = useServerFn(trackAffiliateClick);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      try { localStorage.setItem("aurora_ref", ref); } catch {}
      trackRef({ data: { code: ref } }).catch(() => {});
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [trackRef]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#070612] text-white pb-28 md:pb-24">

      <TutorialModal trigger={tutorialTick} />
      <ScrollProgress />
      <StickyCreditsBar />
      <ExitIntentModal />

      {/* Ambient violet glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-[640px] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, hsl(270 90% 60% / 0.55), transparent 60%)" }} />
      <div className="pointer-events-none absolute top-1/3 -left-40 size-[520px] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, hsl(290 80% 55% / 0.5), transparent 60%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

      {/* Sticky header */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-[#070612]/85 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-12 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight no-underline">
            <span className="size-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/40">
              <Sparkles className="size-4 text-white" />
            </span>
            <span className="text-white">Aurora</span>
          </Link>
          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              hash="pricing"
              onClick={() => void track("nav_click", { target: "pricing" })}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5 no-underline"
            >
              Pricing
            </Link>
            <button
              onClick={() => setTutorialTick((t) => t + 1)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5"
            >
              <BookOpen className="size-3.5" /> Tutorials
            </button>
            <Link to="/canvas" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5 no-underline">
              <Sparkles className="size-3.5" /> Canvas
            </Link>
            <Link to="/lipsync" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5 no-underline">
              <Wand2 className="size-3.5" /> Lip Sync
            </Link>
            <Link to="/workflows" className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5 no-underline">
              Workflows
            </Link>
            {user ? (
              <Link to="/dashboard" className="px-3 py-1.5 text-sm rounded-full border border-white/15 text-white/90 hover:bg-white/5 no-underline">Dashboard</Link>
            ) : (
              <Link to="/auth" className="px-3 py-1.5 text-sm rounded-full border border-white/15 text-white/90 hover:bg-white/5 no-underline">Sign in</Link>
            )}
            <Link
              to="/studio"
              onClick={() => void track("header_cta_click")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full font-medium text-white no-underline bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95 shadow-lg shadow-violet-500/30"
            >
              {ctaLabel} <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-6 md:pt-12 pb-16 grid lg:grid-cols-12 gap-10 items-center animate-fade-in">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200 text-xs">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
            {greeting} · Creativity lives here
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
            Turn a selfie into a
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-200 bg-clip-text text-transparent">
              cinematic performance.
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            One studio. Every model that matters — Seedance 2.0, Kling 3.0, Nano Banana Pro, Seedream 4.5, Sync lip-sync. Drop a photo, pick a vibe, get magazine-grade shots and motion in seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/studio"
              onClick={() => void track("hero_cta_click", { variant: "primary" })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-white no-underline bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95 shadow-xl shadow-violet-500/30"
            >
              <Play className="size-4" /> Start creating — 5 free credits
            </Link>
            <Link
              to="/"
              hash="pricing"
              onClick={() => void track("hero_cta_click", { variant: "pricing" })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-white/90 border border-white/15 hover:bg-white/5 no-underline"
            >
              See pricing
            </Link>
          </div>
          <div className="flex items-center gap-4 pt-2 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5"><Camera className="size-3.5" /> 5 image models</span>
            <span className="inline-flex items-center gap-1.5"><Film className="size-3.5" /> 4 video models</span>
            <span className="inline-flex items-center gap-1.5"><Wand2 className="size-3.5" /> Lip-sync built-in</span>
          </div>
        </div>

        {/* Animated tile mosaic */}
        <div className="lg:col-span-6 relative">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {TILES.map((t, i) => (
              <div
                key={i}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-950/40 animate-scale-in hover:-translate-y-1 transition-transform duration-300"
                style={{
                  animation: `float ${6 + (i % 3)}s ease-in-out ${i * 0.4}s infinite alternate`,
                  transform: `translateY(${(i % 2) * 18}px)`,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <img src={t.src} alt={t.label} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                <div className="absolute bottom-2 left-2 right-2 text-[10px] uppercase tracking-wider text-white/80 font-medium">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
          <style>{`@keyframes float { from { transform: translateY(0) } to { transform: translateY(-14px) } }`}</style>
        </div>
      </section>

      {/* Trust bar — right under hero */}
      <TrustBar />

      {/* Split reality demo */}
      <SplitReality />

      {/* Lip-sync demo */}
      <LipSyncDemo />

      {/* Screenshot-inspired sections */}
      <SupercomputerSection />
      <MarketingStudioSection />
      <SupercomputerCard />
      <MotionControlSection />
      <OneClickVideoSection />
      <AiCanvasSection />



      {/* Canvas teaser */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent p-6 md:p-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">New · Aurora Canvas</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">A node canvas for your whole shoot.</h2>
            <p className="text-white/70 mt-3 max-w-lg">
              Drop a selfie, an outfit, a beat — wire them into image, video, lip-sync and split-reality nodes. Run the whole pipeline in one click. Save it. Re-run it. Remix it.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                to="/canvas"
                onClick={() => void track("canvas_cta_click", { source: "landing" })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white no-underline bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95 shadow-lg shadow-violet-500/30"
              >
                <Sparkles className="size-4" /> Open Canvas
              </Link>
              <Link
                to="/colors"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white/90 border border-white/15 hover:bg-white/5 no-underline"
              >
                <Camera className="size-4" /> Colors Studio
              </Link>
            </div>
          </div>
          {/* Mini canvas mockup */}
          <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-[#0a0815] overflow-hidden">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            {/* Nodes */}
            {[
              { l: "Selfie", x: "6%", y: "20%", c: "from-violet-500 to-fuchsia-500" },
              { l: "Outfit", x: "6%", y: "58%", c: "from-fuchsia-500 to-pink-500" },
              { l: "Image gen", x: "40%", y: "16%", c: "from-violet-500 to-indigo-500" },
              { l: "Video", x: "40%", y: "60%", c: "from-pink-500 to-rose-500" },
              { l: "Lip-sync", x: "72%", y: "38%", c: "from-emerald-400 to-cyan-400" },
            ].map((n) => (
              <div
                key={n.l}
                className="absolute -translate-x-0 -translate-y-0 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-white shadow-lg"
                style={{ left: n.x, top: n.y }}
              >
                <span className={`inline-block size-1.5 rounded-full mr-1.5 align-middle bg-gradient-to-r ${n.c}`} />
                {n.l}
              </div>
            ))}
            {/* Wires */}
            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M14,24 C28,24 28,20 40,20" stroke="rgba(167,139,250,0.6)" strokeWidth="0.4" fill="none" />
              <path d="M14,62 C28,62 28,64 40,64" stroke="rgba(244,114,182,0.6)" strokeWidth="0.4" fill="none" />
              <path d="M52,22 C62,22 62,40 72,40" stroke="rgba(167,139,250,0.6)" strokeWidth="0.4" fill="none" />
              <path d="M52,64 C62,64 62,44 72,44" stroke="rgba(244,114,182,0.6)" strokeWidth="0.4" fill="none" />
            </svg>
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-violet-500/20 border border-violet-400/30 text-violet-200">Run pipeline</div>
          </div>
        </div>
      </section>

      {/* Trending workflows + features */}
      <TrendingWorkflows />
      <FeaturesGrid />

      {/* Model showcase strip — compact */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-1">The model rack</p>
            <h2 className="text-xl md:text-2xl font-semibold">Best-in-class models, one canvas.</h2>
          </div>
          <Link to="/studio" className="hidden md:inline-flex items-center gap-1 text-sm text-white/70 hover:text-white no-underline">
            Open studio <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {SHOWCASE_MODELS.map((m) => (
            <div
              key={m.name}
              className="group relative aspect-square rounded-xl border border-white/10 overflow-hidden p-2.5 flex flex-col justify-between bg-white/[0.03] backdrop-blur-sm hover:border-white/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`absolute -inset-8 opacity-50 blur-2xl bg-gradient-to-br ${m.glow} group-hover:opacity-80 transition-opacity`} />
              <ModelCardArt kind={m.kind} />
              <div className="relative flex items-center justify-between">
                {m.status === "LIVE" && (
                  <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-300/90">
                    <span className="size-1 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                )}
                {m.status === "SOON" && (
                  <span className="text-[8px] uppercase tracking-wider text-white/40">Soon</span>
                )}
              </div>
              <div className="relative">
                <p className="text-xs font-semibold leading-tight">{m.name}</p>
                <p className="text-[9px] text-white/50 mt-0.5">{m.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Pricing */}
      <PricingSection />

      {/* Social proof */}
      <Testimonials />

      {/* Referral + gift cards */}
      <ReferralBlock />

      {/* Objections */}
      <FAQ />

      {/* Lead capture */}
      <LeadCapture />

      {/* Footer CTA */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold">Your first shot is on us.</h3>
            <p className="text-white/70 mt-1">No sign-up to configure. Sign in only when you hit Generate.</p>
          </div>
          <Link
            to="/studio"
            onClick={() => void track("footer_cta_click")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white no-underline bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95 shadow-xl shadow-violet-500/30"
          >
            <Sparkles className="size-4" /> Enter the studio
          </Link>
        </div>
      </section>

      <SiteFooter tone="dark" />
    </main>
  );
}
