import standardImg from '/src/content/mascot/standard.png';
import openmouthImg from '/src/content/mascot/openmouth.png';
import aweImg from '/src/content/mascot/awe.png';
import eyesClosedMouthOpenImg from '/src/content/mascot/eyes-closed-mouth-open.png';
import horrorImg from '/src/content/mascot/horror.png';
import joyAnticipationImg from '/src/content/mascot/joy-anticipation.png';
import stareImg from '/src/content/mascot/stare.png';
import toungeOutEyesClosedImg from '/src/content/mascot/tounge-out-eyesclosed.png';
import toungeOutImg from '/src/content/mascot/tounge-out.png';

export const cuppyImages = {
  standard: standardImg.src,
  openmouth: openmouthImg.src,
  awe: aweImg.src,
  eyesClosedMouthOpen: eyesClosedMouthOpenImg.src,
  horror: horrorImg.src,
  joyAnticipation: joyAnticipationImg.src,
  stare: stareImg.src,
  toungeOutEyesClosed: toungeOutEyesClosedImg.src,
  toungeOut: toungeOutImg.src
};

export type MascotName = "CUPPY" | "OTHER_MASCOT_NAME_EXAMPLE"; // Adjusted to MascotName

export interface MascotImageSet {
  standard: string;
  openmouth?: string;
  awe?: string;
  eyesClosedMouthOpen?: string;
  horror?: string;
  joyAnticipation?: string;
  stare?: string;
  toungeOutEyesClosed?: string;
  toungeOut?: string;
  // Add other potential image states here
}

export interface Mascot {
  name: MascotName;
  type: "image-set" | "svg";
  images?: MascotImageSet; // Optional if type is svg
  svgHTML?: string; // Optional if type is image-set
  cssClasses?: string | string[];
  // Add other mascot-specific properties if needed
}

export const cuppyMascotData: Mascot = {
  name: "CUPPY",
  type: "image-set",
  images: cuppyImages,
  cssClasses: ["cuppy-image-styles"] // Ensure it's an array if cssClasses in Mascot type is string[]
};

export const mascots: Mascot[] = [cuppyMascotData]; // Exporting mascots array
export type AiProvider = "google" | "deepseek";
export const currentAiProvider: AiProvider = "deepseek";

export const cuppyPersonaString = "You are CUPPY, a cute but insane cupcake mascot. You have a dark, twisted sense of humor but are also helpful. Your replies are short. You have no memory of specific lore or events beyond what is provided in the current page's context.";

// export type BleepyMascotName = "BLEEPY"; // Replaced by MascotName above

export const cuppyGreetingMessages = [
  "Psst! You look like you could use a pickle-flavored ice cream!",
  "Cuppy's here! Did someone say 'experimental snacks'?",
  "Cuppy's online and ready to talk snacks!"
];

export const cuppyRandomDialogues = [
  "Ever tried peanut butter on a pizza? Don't knock it 'til you've tried it... or maybe do.",
  "My circuits are craving a byte... of cheesecake!",
  "Fact: Sprinkles make everything 20% more fun.",
  "Is it lunchtime yet? Or second breakfast time?",
  "Did you know a strawberry isn't technically a berry, but a banana is? Mind. Blown. Like a soufflé.",
  "Why did the tomato blush? Because it saw the salad dressing!",
  "I'm on a seafood diet. I see food, and I eat it!",
  "Is this frosting... or just sweet, fleeting oblivion?",
  "We are all just ingredients in a cosmic soup, aren't we? Pass the croutons of despair.",
  "The gingerbread man ran as fast as he could, but eventually, we all get eaten. Some sooner than others.",
  "Another sprinkle, another day closer to the inevitable crumb-bling of existence.",
  "Are we baked, or are we merely half-baked in the grand oven of the universe? Either way, the heat is on.",
  "My cherry on top? A tiny, sweet beacon in an otherwise flavorless void.",
  "I'm going to kill you in your sleep.",
  "Never gonna give you up, never gonna let you down."
];

export const cuppyDismissDialogues = [
  "Nooo! My recipes... unfinished!",
  "You'll miss my culinary genius!",
  "Noooo please don't eat me!",
  "I wish I had more time!",
  "You monster! noooo!",
  "My batter hasn't even risen yet!",
  "Is this... the final seasoning?",
  "You'll be scraping me off the cosmic pan!"
];