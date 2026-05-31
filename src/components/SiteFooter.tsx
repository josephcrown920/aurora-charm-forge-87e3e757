import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const muted = tone === "dark" ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground";
  const border = tone === "dark" ? "border-white/10" : "border-border";
  const dim = tone === "dark" ? "text-white/40" : "text-muted-foreground";
  return (
    <footer className={`relative z-10 border-t ${border} px-6 md:px-12 py-10 mt-12`}>
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-[1fr_2fr] items-start">
        <div className="flex items-center gap-2">
          <span className="size-8 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
          <span className="font-semibold tracking-tight">Aurora Studio</span>
        </div>
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
          <Link to="/studio" className={`no-underline ${muted}`}>Studio</Link>
          <Link to="/colors" className={`no-underline ${muted}`}>Colors</Link>
          <Link to="/ugc" className={`no-underline ${muted}`}>UGC</Link>
          <Link to="/gallery" className={`no-underline ${muted}`}>Gallery</Link>
          <Link to="/canvas" className={`no-underline ${muted}`}>Canvas</Link>
          <Link to="/workflows" className={`no-underline ${muted}`}>Workflows</Link>
          <Link to="/gifts" className={`no-underline ${muted}`}>Gift cards</Link>
          <Link to="/affiliate" className={`no-underline ${muted}`}>Affiliate</Link>
          <Link to="/legal/$slug" params={{ slug: "terms" }} className={`no-underline ${muted}`}>Terms</Link>
          <Link to="/legal/$slug" params={{ slug: "privacy" }} className={`no-underline ${muted}`}>Privacy</Link>
          <Link to="/legal/$slug" params={{ slug: "cookies" }} className={`no-underline ${muted}`}>Cookies</Link>
          <Link to="/legal/$slug" params={{ slug: "refunds" }} className={`no-underline ${muted}`}>Refunds</Link>
          <Link to="/legal/$slug" params={{ slug: "acceptable-use" }} className={`no-underline ${muted}`}>Acceptable use</Link>
          <Link to="/contact" className={`no-underline ${muted}`}>Contact</Link>
        </nav>
      </div>
      <p className={`text-center text-xs mt-8 ${dim}`}>
        © {new Date().getFullYear()} Aurora Studio. AI-generated content — review before publishing.
      </p>
    </footer>
  );
}
