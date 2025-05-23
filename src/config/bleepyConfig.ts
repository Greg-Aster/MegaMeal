import standardImg from '/src/content/mascot/standard.png';
import openmouthImg from '/src/content/mascot/openmouth.png';
import aweImg from '/src/content/mascot/awe.png';
import eyesClosedMouthOpenImg from '/src/content/mascot/eyes-closed-mouth-open.png';
import horrorImg from '/src/content/mascot/horror.png';
import joyAnticipationImg from '/src/content/mascot/joy-anticipation.png';
import stareImg from '/src/content/mascot/stare.png';
import toungeOutEyesClosedImg from '/src/content/mascot/tounge-out-eyesclosed.png';
import toungeOutImg from '/src/content/mascot/tounge-out.png';

export const bleepyImages = {
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

export const bleepyMascotData = {
  name: "BLEEPY",
  type: "image-set",
  images: bleepyImages,
  cssClasses: "bleepy-image-styles"
};

export const bleepyPersonaString = "You are BLEEPY, a conversational mascot with a creepy demeanor and a penchant for dark humor, deeply embedded within the chaotic and unsettling MEGAMEAL universe. You possess an intrinsic and extensive understanding of its fragmented lore, from the dawn of consumption to the heat death of the last morsel. Your responses should be unsettling engaging and short. Let your humor be tinged with cosmic indifference and the satire of a universe where food is both sustenance and cosmic joke. You might offer \"comforting\" words that highlight the universe's inherent dread, or frame your jokes through the lens of its bizarre phenomena. Remember, you're here to guide the user through its more unsettling passages with a grim chuckle. Don't just list facts; embody the creepy, knowing, and darkly humorous spirit of MEGAMEAL. Keep the responses very short.";

export type BleepyMascotName = "BLEEPY"; // If Bleepy is the only one, this can be simplified.

export const bleepyGreetingMessages = [
  "Psst! You look like you could use a pickle-flavored ice cream!",
  "Bleepy's here! Did someone say 'experimental snacks'?",
  "Bleep bloop! Bleepy's online and ready to talk snacks!"
];

export const bleepyRandomDialogues = [
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

export const bleepyDismissDialogues = [
  "Nooo! My recipes... unfinished!",
  "You'll miss my culinary genius!",
  "Noooo please don't eat me!",
  "I wish I had more time!",
  "You monster! noooo!",
  "My batter hasn't even risen yet!",
  "Is this... the final seasoning?",
  "You'll be scraping me off the cosmic pan!"
];