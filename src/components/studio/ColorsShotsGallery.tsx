import a1 from "@/assets/josh/josh-colors-session.png.asset.json";
import a2 from "@/assets/josh/josh-rainbow-stripes.png.asset.json";
import a3 from "@/assets/josh/josh-red-spotlights.jpg.asset.json";
import a4 from "@/assets/josh/josh-blue-orange.jpg.asset.json";
import a5 from "@/assets/josh/josh-yellow-mic.jpg.asset.json";
import a6 from "@/assets/josh/josh-neon-seated.png.asset.json";
import a7 from "@/assets/josh/josh-studio-mic.jpg.asset.json";
import a8 from "@/assets/josh/josh-blue-fullbody.png.asset.json";
import a9 from "@/assets/josh/josh-jxst-portrait.png.asset.json";

const SHOTS = [
  { src: a1.url, label: "Magenta cyclorama · Session 1", color: "Magenta + cyan key" },
  { src: a2.url, label: "Rainbow stripes set", color: "Rainbow spectrum" },
  { src: a3.url, label: "Red spotlight studio", color: "Stage red + tungsten" },
  { src: a4.url, label: "Royal blue · orange puffer", color: "Royal blue" },
  { src: a5.url, label: "Yellow cyclorama · vintage mic", color: "Cadmium yellow" },
  { src: a6.url, label: "Neon line-room · seated", color: "Electric blue neon" },
  { src: a7.url, label: "Broadcast mic · neon room", color: "Cool blue + smoke" },
  { src: a8.url, label: "Blue cyclorama · full body", color: "Deep blue" },
  { src: a9.url, label: "Portrait · red shades", color: "Cobalt portrait" },
];

export function ColorsShotsGallery() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-4 md:p-5 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold tracking-tight">Real Colors shoots</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Reference looks generated with Aurora. Tap any to use as a scene/lighting reference.</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">9 looks</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {SHOTS.map((s) => (
          <figure
            key={s.src}
            className="group relative overflow-hidden rounded-xl border border-border bg-background/40 aspect-[3/4]"
          >
            <img
              src={s.src}
              alt={s.label}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <figcaption className="text-[10px] font-medium text-white">{s.label}</figcaption>
              <div className="text-[9px] text-white/70">{s.color}</div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
