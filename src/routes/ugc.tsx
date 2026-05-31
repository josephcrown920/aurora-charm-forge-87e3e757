import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Smartphone, Camera, ShoppingBag, Coffee, Dumbbell, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ugc")({
  component: UGCStudio,
  head: () => ({
    meta: [
      { title: "UGC Studio — Aurora" },
      { name: "description", content: "Generate scroll-stopping UGC ads from a single selfie. iPhone realism, product in hand, native social vibe." },
      { property: "og:title", content: "UGC Studio — Aurora" },
      { property: "og:description", content: "iPhone-real UGC ads from one selfie. Native, scroll-stopping, ready to post." },
      { property: "og:url", content: "https://aurorastudiostar.lovable.app/ugc" },
    ],
    links: [{ rel: "canonical", href: "https://aurorastudiostar.lovable.app/ugc" }],
  }),
});

const PRESETS = [
  { id: "iphone-selfie", name: "iPhone selfie review", icon: Smartphone, hint: "Front camera, slightly tilted, soft window light, casual room." },
  { id: "unboxing", name: "Unboxing hands", icon: ShoppingBag, hint: "Top-down product reveal on desk, natural fingers, kraft paper." },
  { id: "lifestyle-cafe", name: "Cafe lifestyle", icon: Coffee, hint: "Holding product at a cafe table, blurred background, golden hour." },
  { id: "gym-mirror", name: "Gym mirror", icon: Dumbbell, hint: "Mirror selfie at the gym, post-workout glow, fluorescent overhead." },
  { id: "get-ready", name: "Get-ready-with-me", icon: Camera, hint: "Bathroom mirror, ring light, candid morning routine." },
  { id: "tiktok-pov", name: "TikTok POV", icon: Sparkles, hint: "POV holding phone, talking-to-camera framing, 9:16 vertical." },
];

function UGCStudio() {
  const nav = useNavigate();
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold no-underline text-foreground">Aurora</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/studio" className="text-foreground/70 no-underline">Studio</Link>
          <Link to="/colors" className="text-foreground/70 no-underline">Colors</Link>
          <Link to="/canvas" className="text-foreground/70 no-underline">Canvas</Link>
        </nav>
      </header>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">UGC Studio</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Scroll-stopping creator content from one selfie + your product photo. Built for TikTok, Reels, and Shorts — vertical-first, native, not glossy.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => nav({ to: "/studio", search: { recipe: p.id, prompt: p.hint } as never })}
              className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary transition group"
            >
              <p.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold group-hover:text-primary">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{p.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-semibold">How it works</h2>
          <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-5">
            <li>Pick a preset — it pre-fills the Studio with the right framing & lighting.</li>
            <li>Drop your selfie + product photo into the reference slots.</li>
            <li>Generate the image, then "Bring it to life" with Seedance for the video clip.</li>
          </ol>
          <Button className="mt-4" onClick={() => nav({ to: "/studio" })}>Open Studio</Button>
        </div>
      </section>
      <SiteFooter tone="light" />
    </main>
  );
}
