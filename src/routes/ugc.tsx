import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Smartphone, Camera, ShoppingBag, Coffee, Dumbbell, Sparkles, Check } from "lucide-react";
import avatar1 from "@/assets/ugc-avatar-1.jpg";
import avatar2 from "@/assets/ugc-avatar-2.jpg";
import avatar3 from "@/assets/ugc-avatar-3.jpg";
import avatar4 from "@/assets/ugc-avatar-4.jpg";
import avatar5 from "@/assets/ugc-avatar-5.jpg";
import avatar6 from "@/assets/ugc-avatar-6.jpg";

export const Route = createFileRoute("/ugc")({
  component: UGCStudio,
  head: () => ({
    meta: [
      { title: "UGC Factory — Aurora" },
      { name: "description", content: "Pick an AI avatar and generate scroll-stopping UGC ads in seconds. iPhone realism, product in hand, native social vibe." },
      { property: "og:title", content: "UGC Factory — Aurora" },
      { property: "og:description", content: "Pick an avatar, drop your product, ship UGC ads. iPhone-real, native, scroll-stopping." },
      { property: "og:url", content: "https://aurorastudiostar.lovable.app/ugc" },
    ],
    links: [{ rel: "canonical", href: "https://aurorastudiostar.lovable.app/ugc" }],
  }),
});

const AVATARS = [
  { id: "maya",  name: "Maya",  vibe: "Cozy bedroom reviewer", img: avatar1 },
  { id: "deon",  name: "Deon",  vibe: "Hoodie tech-talk creator", img: avatar2 },
  { id: "luna",  name: "Luna",  vibe: "Golden-hour lifestyle", img: avatar3 },
  { id: "kenji", name: "Kenji", vibe: "Gym & wellness", img: avatar4 },
  { id: "ava",   name: "Ava",   vibe: "Cafe blogger energy", img: avatar5 },
  { id: "rio",   name: "Rio",   vibe: "Kitchen / morning routine", img: avatar6 },
];

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
  const [avatarId, setAvatarId] = useState<string>(AVATARS[0].id);
  const avatar = AVATARS.find(a => a.id === avatarId)!;

  const launch = (presetId: string, hint: string) => {
    nav({
      to: "/studio",
      search: { recipe: presetId, prompt: `${hint} Featuring avatar: ${avatar.name} (${avatar.vibe}).`, avatar: avatar.id } as never,
    });
  };

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

      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">UGC Factory</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Pick an avatar. Ship UGC.</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Six on-brand AI creators, ready to film. Choose a face, pick a scene, and Aurora generates a native TikTok-style ad with your product in hand.
        </p>

        {/* Avatar gallery */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">1. Choose your avatar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AVATARS.map(a => {
              const active = a.id === avatarId;
              return (
                <button
                  key={a.id}
                  onClick={() => setAvatarId(a.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition group ${active ? "border-primary shadow-[0_0_24px_oklch(0.78_0.18_305/0.4)]" : "border-border hover:border-primary/50"}`}
                >
                  <img src={a.img} alt={a.name} width={512} height={512} loading="lazy" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 text-left">
                    <p className="text-white text-sm font-semibold leading-none">{a.name}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{a.vibe}</p>
                  </div>
                  {active && (
                    <span className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset gallery */}
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">2. Pick a scene</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => launch(p.id, p.hint)}
                className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary transition group"
              >
                <p.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold group-hover:text-primary">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.hint}</p>
                <p className="text-[11px] text-primary/80 mt-3">→ Open in Studio with {avatar.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-semibold">How it works</h2>
          <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-5">
            <li>Pick one of the six AI avatars above — that face stays consistent across every shot.</li>
            <li>Choose a scene preset to pre-fill Studio with the right framing & lighting.</li>
            <li>Drop your product photo into the reference slot.</li>
            <li>Generate the image, then "Bring it to life" with Seedance for the video clip.</li>
          </ol>
          <Button className="mt-4" onClick={() => nav({ to: "/studio" })}>Open Studio</Button>
        </div>
      </section>
      <SiteFooter tone="light" />
    </main>
  );
}
