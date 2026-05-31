import shot1 from "@/assets/showcase-1.jpg";
import shot2 from "@/assets/showcase-2.jpg";
import shot3 from "@/assets/showcase-3.jpg";
import shot4 from "@/assets/showcase-4.jpg";

export type Recipe = {
  id: string;
  title: string;
  tag: string;
  blurb: string;
  image: string;
  steps: string[];
  prompt: string;
};

export const RECIPES: Recipe[] = [
  {
    id: "colors",
    title: "Colors-style performance",
    tag: "Wide · Hot Pink",
    blurb:
      "The iconic Colors Show look: bold single-color cyclorama, vintage hanging mic, full-body performance pose. Drop a selfie and you're on the wall.",
    image: shot1,
    steps: [
      "Pick a backdrop color (hot pink, royal blue, sunset orange).",
      "Upload a selfie — or use ours.",
      "Aurora stages the cyclorama, mic, lighting, and platform.",
    ],
    prompt:
      "Place the subject into a minimalist studio performance scene. Full-body side profile pose, arms slightly extended forward as if performing. Use an exact suspended vintage studio microphone — photoreal shape, size, material, cable — hanging from ceiling at chest level. Environment is a seamless hot pink cyclorama studio — background and floor are one continuous hot pink color, no visible edges or corners. Soft even glossy lighting with smooth gradient. Subject stands on a circular performance platform matching the hot pink tone, slightly elevated with subtle shadow and faint reflective sheen. Preserve exact facial likeness, beard, skin tone, hairstyle, body proportions. Cinematic studio lighting, gentle floor shadow, rim light separation, ultra-realistic skin texture, natural pores, sharp clothing detail, high-end music video aesthetic, 4K photoreal quality.",
  },
  {
    id: "luxury-car",
    title: "Luxury car music video",
    tag: "Maybach · ARRI look",
    blurb:
      "Put yourself in the backseat of a Maybach — quilted leather, starlight headliner, cinematic bokeh — shot like an ARRI Alexa + Cooke anamorphic.",
    image: shot3,
    steps: [
      "Selfie locks your identity.",
      "Aurora rebuilds the scene inside a luxury Maybach interior.",
      "Animate with Seedance to make it move.",
    ],
    prompt:
      "Place the subject seated naturally in the backseat of a Mercedes-Maybach, viewed through a slightly lowered car window. Preserve exact facial identity — same facial structure, skin tone, beard, lips, eye shape, and proportions. Transform the interior into ultra-luxury Maybach: white quilted leather executive seats, luxury center console, ambient LED lighting, illuminated luxury panels, fiber-optic starlight headliner ceiling, ultra-premium limousine atmosphere. Cinematography looks captured on an ARRI Alexa 35 with a Cooke anamorphic lens. Cinematic natural lighting, subtle reflections on the car window glass, soft luxury interior lighting on the subject. Very shallow depth of field, creamy optical bokeh, luxury ambient lights and starlight ceiling blooming into soft light circles. Tack-sharp face, ultra-photorealistic skin: visible pores, natural texture, realistic light falloff. Luxury editorial automotive photography, cinematic contrast, filmic highlight roll-off, 8K photorealism, subtle film grain.",
  },
  {
    id: "phone-lipsync",
    title: "Phone lip-sync scene",
    tag: "POV · Viral",
    blurb:
      "Looks like a friend caught you on their phone at the spot. AI plants a smartphone in front of your face — perfect for green-screen lip syncs.",
    image: shot2,
    steps: [
      "We use a stylized location (gas station, rooftop, street).",
      "A hand enters frame holding a phone in front of your mouth.",
      "Animate it, drop your audio — viral content.",
    ],
    prompt:
      "Use the reference selfie as the exact identity. Place the subject in a cinematic nighttime exterior scene with moody practical lighting. Keep the subject's expression and ultra-realistic skin texture. Add a realistic modern smartphone held horizontally directly in front of his/her mouth with a bright green chroma screen. Include a hand and partial forearm entering from the side holding the phone — match scale, perspective, reflections, and contact shadows so the phone and hand blend naturally with the scene lighting. Cinematic shallow depth of field, natural skin pores, filmic color science, 4K photoreal quality, no text or logos.",
  },
  {
    id: "collage",
    title: "Editorial collage panel",
    tag: "High fashion close-up",
    blurb:
      "Cinematic chest-up portrait with gold-chain detail and creamy studio bokeh — the building-block panel for vertical collage Reels.",
    image: shot4,
    steps: [
      "One headshot drives identity.",
      "Aurora delivers a tight editorial close-up.",
      "Use Re-angle to spin out eyes, lips, side profile panels.",
    ],
    prompt:
      "Tight close-up portrait from chest up of the subject, preserving exact facial features, skin tone, hairstyle, beard, and proportions. Outfit matches the reference. Visible gold chain and accessories. Background is a soft blurred studio environment with creamy optical bokeh. Soft studio rim lighting, editorial fashion photography, 85mm lens, cinematic color grading with warm tones, ultra-realistic skin texture with natural pores and micro-detail, high-end magazine cover look, 4K photoreal quality.",
  },
];
