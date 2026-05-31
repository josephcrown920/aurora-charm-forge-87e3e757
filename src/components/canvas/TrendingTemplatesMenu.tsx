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

const TEMPLATES: { name: string; desc: string; icon: typeof Flame; tags: string[]; build: () => TemplateGraph }[] = [
  {
    name: "Selfie → Concert Lip-sync", desc: "Selfie + audio → performance shot → lip-sync video", icon: Mic2, tags: ["Selfie", "Audio", "Lip-sync"],
    build: () => ({
      name: "Selfie → Concert Lip-sync",
      nodes: [mk("in", "input", 40, 60), mk("aud", "audio", 40, 380), mk("img", "image", 380, 60, { prompt: "Cinematic concert performance, stage lights" }), mk("lip", "lipsync", 720, 220)],
      edges: [ed("in", "img"), ed("img", "lip"), ed("aud", "lip")],
    }),
  },
  {
    name: "Editorial Cover Shoot", desc: "Selfie → Rembrandt magazine portrait", icon: Camera, tags: ["Selfie", "Image"],
    build: () => ({
      name: "Editorial Cover Shoot",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Editorial magazine cover, Rembrandt lighting, 85mm" })],
      edges: [ed("in", "img")],
    }),
  },
  {
    name: "Split Reality", desc: "One render, two cinematic grades side-by-side", icon: SplitSquareHorizontal, tags: ["Selfie", "Split"],
    build: () => ({
      name: "Split Reality",
      nodes: [mk("in", "input", 40, 60), mk("split", "split", 420, 80, { prompt: "Concert wash vs golden hour" })],
      edges: [ed("in", "split")],
    }),
  },
  {
    name: "Color Story", desc: "Selfie + palette → studio scene image", icon: Palette, tags: ["Selfie", "Image"],
    build: () => ({
      name: "Color Story",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Studio scene with bold complementary color wash" })],
      edges: [ed("in", "img")],
    }),
  },
  {
    name: "UGC Ad Loop", desc: "Talent + product → looping social ad", icon: Film, tags: ["Selfie", "Video"],
    build: () => ({
      name: "UGC Ad Loop",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Product hero shot, UGC style" }), mk("vid", "video", 720, 60, { cameraMovement: "slow push in" })],
      edges: [ed("in", "img"), ed("img", "vid")],
    }),
  },
  {
    name: "Outfit Try-On Reel", desc: "Selfie + outfit → video reel", icon: ImageIcon, tags: ["Selfie", "Video"],
    build: () => ({
      name: "Outfit Try-On Reel",
      nodes: [mk("in", "input", 40, 60), mk("img", "image", 380, 60, { prompt: "Full body outfit try-on" }), mk("vid", "video", 720, 60, { cameraMovement: "orbit" })],
      edges: [ed("in", "img"), ed("img", "vid")],
    }),
  },
  {
    name: "Music Video Mini", desc: "Selfie + audio → video → lip-sync", icon: Wand2, tags: ["Selfie", "Audio", "Video", "Lip-sync"],
    build: () => ({
      name: "Music Video Mini",
      nodes: [mk("in", "input", 40, 60), mk("aud", "audio", 40, 380), mk("img", "image", 360, 60, { prompt: "Cinematic music video still" }), mk("vid", "video", 680, 60, { cameraMovement: "dolly in" }), mk("lip", "lipsync", 1000, 220)],
      edges: [ed("in", "img"), ed("img", "vid"), ed("vid", "lip"), ed("aud", "lip")],
    }),
  },
];

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
            return (
              <button
                key={t.name}
                onClick={() => { onPick(t.build()); setOpen(false); }}
                className="text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
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
