
End-to-end fixes for the Studio + Colors + Gallery flow. Scoped to the issues you listed.

## 1. Replace the wrong "Blue performance studio" preview

The current Tried & Tested final on `/colors` shows an orange puffer + green sneakers (`tutorial-colors-blue-final.jpeg`). You uploaded `IMG_7999.png` (red jersey, black puffer vest, white sneakers, hanging silver mic, royal-blue cyclorama, dreadlocks) — that is the correct reference for this preset.

- Upload `IMG_7999.png` as a Lovable Asset → `src/assets/tutorial-colors-blue-final.jpg.asset.json` (overwrite the existing pointer so every reference auto-updates).
- Rewrite the prompt string inside `<TriedTestedShowcase>` in `src/routes/colors.tsx` to match the new image: royal-blue cyclorama, vintage silver mic **hanging from above at chest height**, red performance jersey under a black hooded puffer vest, distressed black stacked jeans, white sneakers, ARRI rim light.

## 2. Every color gets its own performance setup

Right now all 12 colors share the same generic `Studio · Wide` prompt. Add a dedicated **"Performance"** scene kind that varies the mic style, pose and energy per color, so picking a different swatch actually changes the staging.

- In `src/lib/colors.presets.ts`:
  - Add a new `SetupKind`: `"performance"` and a label in `SETUP_KINDS`.
  - Add a `performance` field on each `ColorPreset` describing `{ mic: "hanging" | "standing" | "handheld" | "boom", pose: string, energy: string }`. Suggested mapping:
    - Royal Blue → hanging vintage mic, side profile, calm power
    - Hot Pink → standing chrome mic, three-quarter, hand on mic stand
    - Sunset Orange → handheld dynamic SM58, mid-stride
    - Neon Green → boom mic from above, head tilted back, screaming
    - Crimson Red → hanging mic, back-to-camera turn
    - Electric Purple → standing mic with reverb haze, eyes-closed performance
    - Cyber Yellow → handheld, jumping pose
    - Ice White → boom overhead, prayer-hands
    - Obsidian → standing mic in single spotlight
    - Aqua Teal → hanging mic, low-angle hero
    - Rose Gold → standing mic, soft ballad pose
    - Lime Pop → handheld, lean-back energy
  - Add `buildPerformancePrompt(colorId)` that composes the full prompt from the chosen color + its performance config (cyclorama colour, mic spec, pose, lighting, identity preservation).
- In `src/routes/colors.tsx`: surface "Performance" in the Scene-type tabs and wire the Generate button to call `buildPerformancePrompt` when that tab is active. Show a small descriptor under the swatch row that updates with the selected color ("Royal Blue · hanging vintage mic · side profile").

## 3. "Bring it to life" → real video illustrations

The right-hand "Bring it to life" panel in `src/routes/studio.tsx` is text + dropdowns only. Add a thin video preview strip at the top of that card so users see *what animation actually looks like* before they spend 5 credits.

- Use existing clips already in the project (no new uploads needed):
  - `public/videos/lipsync-performance.mp4.asset.json`
  - `src/assets/video-josh-closeup.mp4.asset.json`
  - `src/assets/video-josh-lowangle.mp4.asset.json`
  - `src/assets/video-josh-profile.mp4.asset.json`
- New component `src/components/studio/BringItToLifePreview.tsx`: horizontal scroller of 4 muted, autoplay, looped `<video>` thumbnails labelled with the camera move they demonstrate (Static, Push in, Low angle, Side profile). Clicking a thumbnail sets the matching `cameraMovement` select value.
- Drop the component above the `<Select>` row inside the "Bring it to life" card.

## 4. Urban Cuts recipe → avatar video card

The Urban Cuts recipe tile on the landing tutorials currently shows a stock portrait of someone else. Convert that single tile to a looping video using your avatar footage.

- In `src/lib/tutorials.ts`: change `Recipe.image: string` to `image: string; video?: string` (optional) and set the Urban Cuts recipe's `video` to `video-josh-lowangle.mp4` (the urban / cars / cinematic clip).
- In `src/components/canvas/TrendingTemplatesMenu.tsx` (and any other consumer that renders recipe tiles): if `recipe.video` is set, render a muted/looped/autoplay `<video>` instead of `<img>`. Keep aspect ratio identical so the grid doesn't reflow.
- Also drop `shot5` (the stock urban portrait) from the landing showcases where it was standing in for "urban cuts" — replace with the same avatar video clip in `CanvasShowcase.tsx`.

## 5. Remove the grey-shirt subject from the app

The "Cinematic editorial photograph of the subject…" Chicago-rooftop grey-tee image on your dashboard is a real row in your `generations` table — it isn't seeded anywhere in code, so a one-time delete is enough.

- Add a Delete control on each gallery card in `src/routes/gallery.tsx`: trash-icon button with a confirm dialog → calls a new `deleteGeneration` server fn.
- New `src/lib/gallery.functions.ts` exporting `deleteGeneration` (uses `requireSupabaseAuth`, deletes the row scoped to `auth.uid()`, and removes the storage object referenced by `result_image_url`).
- After delete, invalidate `["gens"]` and `["profile"]` queries so the dashboard counters update.
- I'll also delete the specific Chicago-grey-shirt row from your DB via a one-off migration so you don't have to hunt for it.

## 6. Re-check the rest of the site after the edits

After the above lands I'll spot-check `/`, `/studio`, `/colors`, `/gallery`, `/dashboard`, `/split-reality`, `/lipsync`, `/canvas` with `browser--view_preview` at mobile width (430×667, your current viewport) and verify:
- Tried & Tested image matches the new prompt
- Each color swatch changes the performance descriptor
- Bring-it-to-life thumbnails play
- Urban Cuts tile plays the avatar clip
- Gallery delete works and the dashboard count drops by one

## Technical notes (for me)

- Assets: use `lovable-assets create --file /mnt/user-uploads/IMG_7999.png --filename tutorial-colors-blue-final.jpeg > src/assets/tutorial-colors-blue-final.jpg.asset.json` (overwrite). Asset IDs change but every consumer imports the pointer, so nothing else needs editing.
- Don't touch `src/routeTree.gen.ts`, `src/integrations/supabase/client.ts`, or `client.server.ts`.
- New server fn must be wired through `attachSupabaseAuth` (already global in `src/start.ts`).
- Migration: a plain `DELETE FROM public.generations WHERE id = '<grey-shirt id>' AND user_id = '<your uid>';` — I'll fetch the id with a `supabase--read_query` filter on the prompt prefix before writing the migration.
