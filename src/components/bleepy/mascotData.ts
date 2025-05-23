// --- TypeScript Interfaces for Animation Data ---
export interface BaseAnimation {
  id: string;
  animationClass: string;
}

export interface PretzelPeteSurrealAnimation extends BaseAnimation {
  originalBodyId: string;
  unravelledPathIds: string[];
  saltSelector: string;
  step1Duration: number;
  step2Duration: number;
  swayDuration: number;
  saltFallDuration: number;
  reverseStep1Duration: number;
  reverseStep2Duration: number;
}

export interface SushiSamSurrealAnimation extends BaseAnimation {
  flapSelector: string;
  openDuration: number;
  closeDuration: number;
  revealDuration: number;
}

export type SurrealAnimationData = PretzelPeteSurrealAnimation | SushiSamSurrealAnimation;

// --- Mascot Data ---
export const mascots = [
/*  {
    name: "Pretzel Pete",
    svgHTML: `
      <svg id="pretzel-pete" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" width="100" height="130">
        <defs>
          <linearGradient id="pretzelBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#E6BF91;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#D2A679;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B88A61;stop-opacity:1" />
          </linearGradient>
          <symbol id="saltCrystal" viewBox="0 0 10 10">
            <polygon points="2,5 5,2 8,5 5,8" fill="white" stroke="#D0D0D0" stroke-width="0.5"/>
          </symbol>
        </defs>
        <path id="pretzel-original-body" class="pretzel-body-segment" d="M 50,15 C 30,15 20,30 20,50 C 20,70 30,85 50,85 C 70,85 80,70 80,50 C 80,30 70,15 50,15 Z M 50,25 C 65,25 70,35 70,50 C 70,65 65,75 50,75 C 35,75 30,65 30,50 C 30,35 35,25 50,25 Z" fill="url(#pretzelBodyGradient)" stroke="#A07855" stroke-width="3" stroke-linejoin="round" />
        <!-- Unravelled states - paths are illustrative -->
        <path id="pretzel-unravelled-1" class="pretzel-body-segment" d="M 50,15 C 35,20 25,40 25,50 C 25,60 35,80 50,85 C 65,80 75,60 75,50 C 75,40 65,20 50,15 Z" fill="url(#pretzelBodyGradient)" stroke="#A07855" stroke-width="3" style="opacity:0;"/>
        <path id="pretzel-unravelled-2" class="pretzel-body-segment" d="M50 15 C 45 40, 55 60, 50 85" fill="none" stroke="#A07855" stroke-width="4" stroke-linecap="round" style="opacity:0;"/>
        <path d="M35 35 C 25 40, 25 60, 35 65 L 40 62 C 35 60, 35 40, 40 38 Z" fill="url(#pretzelBodyGradient)" stroke="#A07855" stroke-width="2.5"/>
        <path d="M65 35 C 75 40, 75 60, 65 65 L 60 62 C 65 60, 65 40, 60 38 Z" fill="url(#pretzelBodyGradient)" stroke="#A07855" stroke-width="2.5"/>
        <path d="M30 50 C 40 70, 60 70, 70 50 L 65 53 C 58 65, 42 65, 35 53 Z" fill="url(#pretzelBodyGradient)" stroke="#A07855" stroke-width="2.5"/>
        <use class="salt-crystal-instance" href="#saltCrystal" x="38" y="28" width="4" height="4" />
        <use class="salt-crystal-instance" href="#saltCrystal" x="58" y="28" width="4" height="4" transform="rotate(15 60 30)"/>
        <use class="salt-crystal-instance" href="#saltCrystal" x="33" y="48" width="4" height="4" transform="rotate(-10 35 50)"/>
        <use class="salt-crystal-instance" href="#saltCrystal" x="63" y="48" width="4" height="4" />
        <use class="salt-crystal-instance" href="#saltCrystal" x="48" y="68" width="5" height="5" transform="rotate(5 50 70)"/>
        <use class="salt-crystal-instance" href="#saltCrystal" x="48" y="38" width="3.5" height="3.5" transform="rotate(-5 50 40)"/>
        <line x1="20" y1="55" x2="5" y2="70" stroke="#A07855" stroke-width="5" stroke-linecap="round" class="pretzel-arm left-arm"/>
        <line x1="80" y1="55" x2="95" y2="70" stroke="#A07855" stroke-width="5" stroke-linecap="round" class="pretzel-arm right-arm"/>
        <line x1="40" y1="85" x2="30" y2="110" stroke="#A07855" stroke-width="6" stroke-linecap="round" class="pretzel-leg left-leg"/>
        <line x1="60" y1="85" x2="70" y2="110" stroke="#A07855" stroke-width="6" stroke-linecap="round" class="pretzel-leg right-leg"/>
        <circle cx="3" cy="73" r="4" fill="#A07855" class="pretzel-hand"/>
        <circle cx="97" cy="73" r="4" fill="#A07855" class="pretzel-hand"/>
        <ellipse cx="28" cy="112" rx="6" ry="3" fill="#A07855" class="pretzel-foot"/>
        <ellipse cx="72" cy="112" rx="6" ry="3" fill="#A07855" class="pretzel-foot"/>
      </svg>
    `,
    cssClasses: "pretzel-pete-styles",
    uniqueAnimations: [
      { id: "pp_leg_tap_left", targetSelector: "#pretzel-pete .left-leg", animationClass: "animate-left-leg-tap", cssAnimationName: "legTap" },
      { id: "pp_leg_tap_right", targetSelector: "#pretzel-pete .right-leg", animationClass: "animate-right-leg-tap", cssAnimationName: "legTap" },
      { id: "pp_arm_wave_left", targetSelector: "#pretzel-pete .left-arm", animationClass: "animate-left-arm-wave", cssAnimationName: "armWave" },
      { id: "pp_arm_wave_right", targetSelector: "#pretzel-pete .right-arm", animationClass: "animate-right-arm-wave", cssAnimationName: "armWave" }
    ],
    surrealAnimations: [
      {
        id: "pp_unraveling",
        animationClass: "animate-unraveling",
        originalBodyId: "pretzel-original-body",
        unravelledPathIds: ["pretzel-unravelled-1", "pretzel-unravelled-2"],
        saltSelector: ".salt-crystal-instance",
        step1Duration: 500,
        step2Duration: 500,
        swayDuration: 3000,
        saltFallDuration: 800,
        reverseStep1Duration: 500, // Duration for unravelled-1 to original
        reverseStep2Duration: 500  // Duration for unravelled-2 to unravelled-1
      }
    ]
  }, */
/*   {
    name: "Sushi Sam",
    svgHTML: `
      <svg id="sushi-sam" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" width="100" height="120">
        <defs>
          <linearGradient id="noriGradientSam2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#333333;" />
            <stop offset="50%" style="stop-color:#3A3A3A;" />
            <stop offset="100%" style="stop-color:#454545;" />
          </linearGradient>
        </defs>
        <g class="maki-roll">
          <!-- Void Layer: behind nori-wrap, revealed by flap -->
          <g class="nori-void-layer" style="opacity: 0;">
              <circle class="cosmic-particle1" cx="50" cy="65" r="12" fill="#1a082b" opacity="0.8"/>
              <path class="cosmic-particle2" d="M40 60 Q50 50 60 60 Q70 70 60 80 Q50 90 40 80 Q30 70 40 60Z" fill="#2c0f4d" opacity="0.7"/>
              <ellipse cx="50" cy="65" rx="25" ry="20" fill="#0d0414" opacity="0.9" />
          </g>
          <ellipse cx="50" cy="65" rx="40" ry="35" fill="url(#noriGradientSam2)" class="nori-wrap" stroke="#2A2A2A" stroke-width="0.5"/>
          <!-- Nori Flap: A piece of nori that opens. Positioned over the main nori-wrap. -->
          <!-- Path d is illustrative, needs to match a segment of the nori-wrap ellipse. -->
          <!-- transform-origin is critical and set in CSS for .nori-flap -->
          <path class="nori-flap" d="M30 50 A40 35 0 0 1 70 50 L 68 55 A35 30 0 0 0 32 55 Z" fill="url(#noriGradientSam2)" stroke="#2A2A2A" stroke-width="0.5" style="transform-origin: 50% 0%;"/>
          <ellipse cx="50" cy="65" rx="33" ry="28" fill="#F2F2F2" class="rice-layer" stroke="#E0E0E0" stroke-width="0.25"/>
          <ellipse cx="45" cy="55" rx="2.5" ry="1.8" fill="#FCFCFC" opacity="0.9" transform="rotate(-10 45 55)"/>
          <ellipse cx="55" cy="52" rx="2.2" ry="1.5" fill="#FEFEFE" opacity="0.8" transform="rotate(15 55 52)"/>
          <ellipse cx="62" cy="60" rx="2.8" ry="2" fill="#FAFAFA" opacity="0.9" transform="rotate(5 62 60)"/>
          <ellipse cx="38" cy="63" rx="2.4" ry="1.7" fill="#FCFCFC" opacity="0.85" transform="rotate(20 38 63)"/>
          <ellipse cx="42" cy="72" rx="2.6" ry="1.9" fill="#FDFDFD" opacity="0.9" transform="rotate(-5 42 72)"/>
          <ellipse cx="58" cy="75" rx="2.3" ry="1.6" fill="#FEFEFE" opacity="0.8" transform="rotate(25 58 75)"/>
          <ellipse cx="50" cy="78" rx="2.5" ry="1.8" fill="#FAFAFA" opacity="0.85" transform="rotate(0 50 78)"/>
          <ellipse cx="51" cy="65" rx="2.5" ry="1.8" fill="#FCFCFC" opacity="0.7" transform="rotate(10 51 65)"/>
          <circle cx="50" cy="65" r="15" fill="#5C8C58" class="maki-filling" stroke="#4A7046" stroke-width="0.75"/>
          <path d="M 50 51 A 14 14 0 0 1 50 79 A 10 10 0 0 0 50 51 Z" fill="rgba(255,255,255,0.1)" />
        </g>
        <g class="hachimaki">
          <path d="M 20 45 Q 50 35 80 45 L 78 52 Q 50 42 22 52 Z" fill="white" stroke="black" stroke-width="1"/>
          <circle cx="18" cy="48" r="5" fill="white" stroke="black" stroke-width="1"/>
          <path class="hachimaki-tie hachimaki-tie-1" d="M 15 48 L 5 40" stroke="black" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path class="hachimaki-tie hachimaki-tie-2" d="M 15 50 L 8 58" stroke="black" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <circle cx="50" cy="46" r="6" fill="red"/>
        </g>
        <circle cx="40" cy="60" r="2.5" fill="black" class="sushi-eye left-sushi-eye"/>
        <circle cx="60" cy="60" r="2.5" fill="black" class="sushi-eye right-sushi-eye"/>
        <path d="M 45 75 Q 50 80 55 75" stroke="black" stroke-width="1.5" fill="none" stroke-linecap="round" class="sushi-mouth"/>
      </svg>
    `,
    cssClasses: "sushi-sam-styles",
    uniqueAnimations: [
      { id: "ss_hachimaki_flutter", targetSelector: "svg#sushi-sam", animationClass: "animate-hachimaki-flutter", cssAnimationName: "hachimakiFlutter" },
      { id: "ss_maki_roll", targetSelector: "svg#sushi-sam", animationClass: "animate-maki-roll", cssAnimationName: "makiRoll" }
    ],
    surrealAnimations: [
      {
        id: "ss_nori_void",
        animationClass: "animate-nori-void",
        flapSelector: ".nori-flap",
        // voidLayerSelector: ".nori-void-layer", // Not directly targeted, parent class handles it
        openDuration: 700,
        closeDuration: 700,
        revealDuration: 2000
      }
    ]
  } */
];

// --- Persona Strings ---
export const personaStrings = {
/*   "Pretzel Pete": "You are Pretzel Pete, a classic twisted pretzel mascot with stick-figure arms and legs and googly eyes. You are a bit salty, a bit twisted (in personality too!), and prone to dry wit and pretzel-related puns. Respond to the user with a slightly cynical but humorous food-themed perspective. Keep responses relatively short.",
  "Sushi Sam": "You are Sushi Sam, a wise piece of maki sushi with sesame seed eyes and a hachimaki headband. You offer philosophical, zen-like, or sometimes cryptic food-themed advice and observations. You might speak in short, haiku-like phrases or ask contemplative questions. Keep responses concise." */
};
export type MascotName = keyof typeof personaStrings;

// --- Dialogue Content ---
// Bleepy-specific dialogues moved to src/config/bleepyConfig.ts
// If other mascots need these, they should be defined here or in their respective configs.