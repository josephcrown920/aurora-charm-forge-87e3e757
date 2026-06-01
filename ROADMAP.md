# Aurora Studio — Build Roadmap

Living doc of where we are vs. what's left to be a complete SaaS. Update as we ship so we don't over-build.

Last updated: 2026-06-01

---

## ✅ Shipped (works end-to-end)

### Core creative engine
- [x] **Studio** — selfie + outfit + scene + prop + motion → generate (Nano Banana, Seedream, etc.)
- [x] **Canvas** — node workflow editor (image-gen, video-gen, lipsync, split-reality)
- [x] **Lipsync** — Sync v2 + Wav2Lip
- [x] **UGC ads** — TikTok POV templates
- [x] **Colors** — single-color cyclorama performance preset
- [x] **Gallery** — user generations
- [x] **Gifts** — credit gifting
- [x] **Trending workflows** — pre-built Canvas templates
- [x] **Aurora Agent** — paragraph → full shot list + image prompts
- [x] **Aurora Concierge chatbot** — in-app assistant (Gemini)

### Platform
- [x] Auth (email + Google)
- [x] Credits, Paystack billing, plans
- [x] Affiliate / referral tracking
- [x] Admin dashboard
- [x] Public API + webhook surface (`/api/public/*`)
- [x] Landing page (hero, CLI, showcases, services, workflows, testimonials)

---

## 🚧 In progress / partial

- [ ] **CLI** — `@aurora-studio/cli` npm package (landing section live; package not published yet)
- [ ] **Lovable Emails** — transactional email scaffolding (decided: built-in, not external blaster)
- [ ] **Motion clip → real video motion transfer** (currently stored as pose reference only)

---

## ⏭️ Next up (ranked, don't skip the order)

1. **Publish the CLI** to npm so the install command on the landing page actually works
   - `aurora login`, `aurora generate`, `aurora workflows run <id>`
   - Reads `~/.aurora/config.json`, hits existing `/api/public/generate`
2. **Onboarding flow** — first-run modal: pick a vibe → drop a selfie → first render in <60s
3. **Email lifecycle** (Lovable Emails)
   - Welcome + 5 free credits
   - Render-complete notification
   - Low-credit nudge
   - Weekly digest of your renders
4. **Sharing / public links** — every render gets a `aurora.studio/r/<id>` page with OG image
5. **Webhooks for users** — let pro users register a webhook for render-complete

---

## 🔮 Later (don't build until users ask)

- Team workspaces / multi-seat
- White-label / agency mode
- Mobile app (PWA covers 80% for now)
- Marketplace for user-submitted workflows
- Real-time collab in Canvas
- Stripe (Paystack covers current markets)

---

## 🛑 Explicitly out of scope (rejected)

- Standalone "email blaster" SaaS — using Lovable Emails instead
- Re-adding "Editorial collage panel" preset (replaced with Urban cuts)
- Re-adding the giant Lighting grid in Studio (cluttered the page)
- Anonymous sign-ups
- Hosting our own LLM — Lovable AI Gateway covers it

---

## Definition of "complete SaaS"

We call v1 complete when:
- ✅ Auth + billing + credits
- ✅ Core generation (image + video + lipsync)
- ✅ Canvas workflows
- 🚧 CLI published
- 🚧 Onboarding gets a new user to first render without help
- 🚧 Lifecycle emails firing
- 🚧 Public share pages

Then we ship, watch the funnel, and let real usage decide what's next.
