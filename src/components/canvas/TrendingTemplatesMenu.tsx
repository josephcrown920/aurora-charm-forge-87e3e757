import { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, Mic2, Camera, SplitSquareHorizontal, Palette, Film, ImageIcon, Wand2 } from "lucide-react";

export type TemplateGraph = { name: string; nodes: Node<any>[]; edges: Edge[] };

function mk(id: string, kind: string, x: number, y: number, extra: Record<string, unknown> = {}): Node<any> {
  return { id, position: { x, y }, type: "aurora", data: { kind, ...extra } };
}
function ed(s: string, t: string): Edge {
  return { id: `${s}-${t}`, source: s, target: t, animated: true };
}

const COLORS_PRESET_PROMPT =
  "Full-body editorial portrait of the subject standing centered on a seamless royal-blue cyclorama. Monochromatic blue ambient light wrapping the body, soft rim light from camera-left, deep cyan shadow falloff, faint smoke. Outfit recolored to complementary cobalt. Preserve exact facial likeness. Shot on 35mm, 4K, fashion campaign quality.";

const LIPSYNC_PRESET_IMG_PROMPT =
  "Cinematic concert performance shot of the subject mid-vocal, mouth slightly open, vintage SM7B mic on boom in foreground, deep magenta + violet stage haze, anamorphic flares, shallow depth of field, sweat-glow on skin, 35mm.";

type TemplateDef = {
  id: string;
  name: string;
  desc: string;
  icon: typeof Flame;
  tags: string[];
  build: () => TemplateGraph;
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "lipsync-preset",
    name: "Lip-sync · NBA Josh preset",
    desc: "Selfie + audio → concert shot → Sync 1.9 lip-sync. Pre-filled prompts.",
    icon: Mic2,
    tags: ["Selfie", "Audio", "Lip-sync", "Preset"],
    build: () => ({
      name: "Lip-sync · NBA Josh preset",
      nodes: [
        mk("in", "input", 40, 60),
        mk("aud", "audio", 40, 380),
        mk("img", "image", 380, 60, { prompt: LIPSYNC_PRESET_IMG_PROMPT, model: "google/gemini-3-pro-image-preview" }),
        mk("vid", "video", 720, 60, { prompt: "subject sings into the mic, expressive, subtle head sway, locked camera", model: "seedance-2.0", cameraMovement: "static" }),
        mk("lip", "lipsync", 1060, 220, { model: "fal-ai/sync-lipsync/v2" }),
      ],
      edges: [ed("in", "img"), ed("img", "vid"), ed("vid", "lip"), ed("aud", "lip")],
    }),
  },
  {
    id: "lipsync-blank",
    name: "Lip-sync · Blank",
    desc: "Empty selfie + audio → video → lip-sync scaffold. Bring your own prompt.",
    icon: Mic2,
    tags: ["Selfie", "Audio", "Lip-sync", "Blank"],
    build: () => ({
      name: "Lip-sync · Blank",
      nodes: [
        mk("in", "input", 40, 60),
        mk("aud", "audio", 40, 380),
        mk("img", "image", 380, 60, { prompt: "", model: "google/gemini-2.5-flash-image" }),
        mk("vid", "video", 720, 60, { prompt: "", model: "seedance-2.0", cameraMovement: "static" }),
        mk("lip", "lipsync", 1060, 220, { model: "fal-ai/sync-lipsync/v2" }),
      ],
      edges: [ed("in", "img"), ed("img", "vid"), ed("vid", "lip"), ed("aud", "lip")],
    }),
  },
  {
    id: "colors-preset",
    name: "Colors · Blue Performance preset",
    desc: "Selfie → royal-blue cyclorama editorial portrait. Tried & tested prompt.",
    icon: Palette,
    tags: ["Selfie", "Image", "Preset"],
    build: () => ({
      name: "Colors · Blue Performance preset",
      nodes: [
        mk("in", "input", 40, 60),
        mk("img", "image", 380, 60, { prompt: COLORS_PRESET_PROMPT, model: "google/gemini-3-pro-image-preview" }),
      ],
      edges: [ed("in", "img")],
    }),
  },
  {
    id: "colors-blank",
    name: "Colors · Blank",
    desc: "Empty colors canvas. Drop a selfie, pick a palette, write the scene.",
    icon: Palette,
    tags: ["Selfie", "Image", "Blank"],
    build: () => ({
      name: "Colors · Blank",
      nodes: [
        mk("in", "input", 40, 60),
        mk("img", "image", 380, 60, { prompt: "", model: "google/gemini-2.5-flash-image" }),
      ],
      edges: [ed("in", "img")],
    }),
  },
  {
    id: "selfie-concert",
    name: "Selfie → Concert Lip-sync",
    desc: "Selfie + audio → performance shot → lip-sync video",
    icon: Mic2,
    tags: ["Selfie", "Audio", "Lip-sync"],
    build: () => ({
      name: "Selfie → Concert Lip-sync",
      nodes: [mk("in", "input", 40, 60), mk("aud", "audio", 40, 380), mk("img", "image", 380, 60, { prompt: "Cinematic concert performance, stage lights" }), mk("lip", "lipsync", 720, 220)],
      edges: [ed("in", "img"), ed("img", "lip"), ed("aud", "lip")],
    }),
  },
  {
    id: "editorial-cover",
    name: "Editorial Cover Shoot",
    desc: "Selfie → Rembrandt magazine portrait",
    icon: Camera,
    tags: ["Selfie", "Image"],
    build: () => ({
      name: "Editorial Cover Shoot",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Editorial magazine cover, Rembrandt lighting, 85mm" })],
      edges: [ed("in", "img")],
    }),
  },
  {
    id: "split-reality",
    name: "Split Reality",
    desc: "One render, two cinematic grades side-by-side",
    icon: SplitSquareHorizontal,
    tags: ["Selfie", "Split"],
    build: () => ({
      name: "Split Reality",
      nodes: [mk("in", "input", 40, 60), mk("split", "split", 420, 80, { prompt: "Concert wash vs golden hour" })],
      edges: [ed("in", "split")],
    }),
  },
  {
    id: "ugc-loop",
    name: "UGC Ad Loop",
    desc: "Talent + product → looping social ad",
    icon: Film,
    tags: ["Selfie", "Video"],
    build: () => ({
      name: "UGC Ad Loop",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Product hero shot, UGC style" }), mk("vid", "video", 720, 60, { cameraMovement: "slow push in" })],
      edges: [ed("in", "img"), ed("img", "vid")],
    }),
  },
  {
    id: "tryon-reel",
    name: "Outfit Try-On Reel",
    desc: "Selfie + outfit → video reel",
    icon: ImageIcon,
    tags: ["Selfie", "Video"],
    build: () => ({
      name: "Outfit Try-On Reel",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Full body outfit try-on" }), mk("vid", "video", 720, 60, { cameraMovement: "orbit" })],
      edges: [ed("in", "img"), ed("img", "vid")],
    }),
  },
  {
    id: "music-video-mini",
    name: "Music Video Mini",
    desc: "Selfie + audio → video → lip-sync",
    icon: Wand2,
    tags: ["Selfie", "Audio", "Video", "Lip-sync"],
    build: () => ({
      name: "Music Video Mini",
      nodes: [mk("in", "input", 40, 60), mk("aud", "audio", 40, 380), mk("img", "image", 360, 60, { prompt: "Cinematic music video still" }), mk("vid", "video", 680, 60, { cameraMovement: "dolly in" }), mk("lip", "lipsync", 1000, 220)],
      edges: [ed("in", "img"), ed("img", "vid"), ed("vid", "lip"), ed("aud", "lip")],
    }),
  },
];

export function getTemplateById(id: string): TemplateGraph | null {
  const t = TEMPLATES.find((x) => x.id === id);
  return t ? t.build() : null;
}

export function TrendingTemplatesMenu({ onPick }: { onPick: (g: TemplateGraph) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
          <Flame className="size-3.5 mr-1" /> Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Trending workflows</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isPreset = t.tags.includes("Preset");
            const isBlank = t.tags.includes("Blank");
            return (
              <button
                key={t.id}
                onClick={() => { onPick(t.build()); setOpen(false); }}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  isPreset ? "border-emerald-400/40 bg-emerald-500/5 hover:border-emerald-400/70"
                  : isBlank ? "border-sky-400/30 bg-sky-500/5 hover:border-sky-400/60"
                  : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="size-4 text-primary" />
                  <span className="font-medium text-sm">{t.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
