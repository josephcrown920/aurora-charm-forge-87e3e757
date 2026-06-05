import { useRef } from "react";
import profile from "@/assets/video-josh-profile.mp4.asset.json";
import lipsync from "@/../public/videos/lipsync-performance.mp4.asset.json";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type PreviewClip = {
  label: string;
  /** Which `cameraMovement` Select value this clip illustrates. */
  cameraValue: string;
  url: string;
};

// Close-up + low-angle clips removed pending user-supplied footage.
const CLIPS: PreviewClip[] = [
  { label: "Static · locked off", cameraValue: "static",   url: lipsync.url },
  { label: "Side profile pan",    cameraValue: "pan_left", url: profile.url },
];

/**
 * Tiny horizontal scroller that shows what each camera move actually
 * looks like on the same subject. Click a thumb to pre-select its
 * matching `cameraMovement` in the parent Select.
 */
export function BringItToLifePreview({
  active,
  onPick,
}: {
  active?: string;
  onPick: (cameraValue: string) => void;
}) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Play className="size-3" /> Examples · tap to load
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {CLIPS.map((c, i) => {
          const isActive = active === c.cameraValue;
          return (
            <button
              key={c.cameraValue}
              type="button"
              onClick={() => onPick(c.cameraValue)}
              onMouseEnter={() => refs.current[i]?.play().catch(() => {})}
              className={cn(
                "shrink-0 snap-start w-28 rounded-lg overflow-hidden border text-left transition-all bg-background/40",
                isActive ? "border-primary shadow-[var(--shadow-glow)]" : "border-border hover:border-primary/40",
              )}
              title={c.label}
            >
              <div className="relative aspect-[4/5] bg-black">
                <video
                  ref={(el) => { refs.current[i] = el; }}
                  src={c.url}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/85 to-transparent" />
              </div>
              <div className="px-1.5 py-1 text-[9px] leading-tight text-foreground/85 line-clamp-2">
                {c.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
