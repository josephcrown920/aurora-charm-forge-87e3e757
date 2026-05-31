import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Wand2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { trackAffiliateClick } from "@/lib/affiliate.functions";
import { useAuth } from "@/hooks/use-auth";
import { TutorialModal } from "@/components/TutorialModal";
import { SiteFooter } from "@/components/SiteFooter";
import { Testimonials } from "@/components/landing/Testimonials";
import { TrustBar } from "@/components/landing/TrustBar";
import { StickyCreditsBar } from "@/components/landing/StickyCreditsBar";
import { ExitIntentModal } from "@/components/landing/ExitIntentModal";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { HeroContactForm } from "@/components/landing/HeroContactForm";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { WhyUs } from "@/components/landing/WhyUs";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { track } from "@/lib/tracking";

const FAQ_ITEMS = [
  { q: "How do credits work?", a: "1 credit ≈ 1 image. Videos cost 5 credits (5s) or 10 credits (10s). Lip-sync is 1 credit per second. Credits never expire and roll across all models." },
  { q: "Can I use the results commercially?", a: "Yes. Every paid plan includes a full commercial license for the outputs you generate — ads, music videos, UGC, client deliverables. You own the renders." },
  { q: "Which models are included?", a: "All of them. Seedance 2.0, Kling 3.0, Nano Banana Pro, Seedream 4.5, Sync 1.9 lip-sync, and every new model we ship." },
];

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Aurora Studio — A creative supercomputer for next-gen creators" },
      { name: "description", content: "AI image, video, lip-sync, UGC ads, virtual try-on — all in one studio. Seedance, Kling, Seedream, Nano Banana Pro and Sync. Selfie in, campaign out." },
      { property: "og:title", content: "Aurora Studio — A creative supercomputer" },
      { property: "og:description", content: "Every major AI creative tool in one premium studio. Cinematic content from a single selfie." },
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
            <a
              href="#services"
              onClick={() => void track("nav_click", { target: "services" })}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm rounded-full text-white/80 hover:text-white hover:bg-white/5 no-underline"
            >
              Services
            </a>
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

      {/* 1. Hero + contact form */}
      <HeroContactForm greeting={greeting} />

      {/* 2. Trust badges */}
      <TrustBar />

      {/* 3. Our services */}
      <ServicesGrid />

      {/* 4. Why us */}
      <WhyUs />

      {/* 5. Reviews */}
      <Testimonials />

      {/* 6. Final CTA */}
      <FinalCTA />

      <SiteFooter />
    </main>
  );
}
