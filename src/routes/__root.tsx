import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";


import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { usePageViewTracking } from "@/hooks/use-tracking";
import { AuroraChatbot } from "@/components/AuroraChatbot";
import { AdminHotkey } from "@/components/AdminHotkey";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  // Silent boundary — avoids the half-second "try again" flash between route
  // transitions. Errors are still logged to the console for debugging.
  console.error(error);
  return null;
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Aurora Studio" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Aurora Studio" },
      { title: "Aurora Studio — AI Performance Shots & Music-Video Stills" },
      { property: "og:title", content: "Aurora Studio — AI Performance Shots & Music-Video Stills" },
      { name: "twitter:title", content: "Aurora Studio — AI Performance Shots & Music-Video Stills" },

      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "Aurora Studio Star creates performance-style shots from user photos and motion, adding virtual clothing and studio effects." },
      { property: "og:description", content: "Aurora Studio Star creates performance-style shots from user photos and motion, adding virtual clothing and studio effects." },
      { name: "twitter:description", content: "Aurora Studio Star creates performance-style shots from user photos and motion, adding virtual clothing and studio effects." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/J2VHaBkD8FVvbqRyLts8vf9CNTt2/social-images/social-1780019855212-IMG_7719.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/J2VHaBkD8FVvbqRyLts8vf9CNTt2/social-images/social-1780019855212-IMG_7719.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Aurora Studio",
          url: "https://aurorastudiostar.lovable.app",
          description:
            "AI performance shots, music-video stills, lip-sync clips and UGC ads from a single selfie.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Aurora Studio",
          url: "https://aurorastudiostar.lovable.app",
        }),
      },
    ],
  }),
  beforeLoad: ({ location }) => {
    const { pathname, searchStr, hash } = location;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      const stripped = pathname.replace(/\/+$/, "") || "/";
      throw redirect({
        href: `${stripped}${searchStr ?? ""}${hash ? `#${hash}` : ""}`,
        statusCode: 301,
      });
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});



function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  usePageViewTracking();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
      <AuroraChatbot />
      <AdminHotkey />
    </QueryClientProvider>
  );
}
