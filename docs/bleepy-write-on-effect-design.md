# Design for Bleepy "Write-On" Text Effect

This document outlines the JavaScript logic design for implementing a "write-on" (typewriter) effect for the mascot's speech bubble in `src/components/bleepy/Bleepy.astro`. This effect will replace the current fade-in text appearance.

## Design for "Write-On" Text Effect Logic

This design outlines the modifications and new logic required within the `displayEphemeralSpeech` function in `src/components/bleepy/Bleepy.astro` to achieve a typewriter effect for the mascot's speech.

**1. Core "Write-On" Mechanism:**

*   **Incremental Text Reveal:**
    *   The text will be revealed character by character in the `#mascot-speech-text` paragraph element.
    *   This will be achieved using a recursive `setTimeout` function. A helper function, say `typeCharacter()`, will append one character at a time to the `textContent` of `#mascot-speech-text`.
    *   A variable, `typingTimeoutId`, will store the ID of the `setTimeout` to allow for cancellation if the speech is interrupted.
    *   We'll use `element.textContent += character;` for appending, as it's generally safer and more performant for plain text than `innerHTML`.
*   **Typing Speed:**
    *   A suggested typing speed is **60 milliseconds per character**. This can be defined as a constant, e.g., `const TYPING_SPEED_MS = 60;`. This value offers a good balance between a clear typing effect and not being overly slow.

**2. Replacing `speech-appear` Animation for Text:**

*   The existing CSS class `.appearing` and the `@keyframes speech-appear` (which fades and slides the bubble and text) will **not** be used for the initial text reveal. The text itself will be typed out.
*   **Speech Bubble Visibility:**
    *   The speech bubble (`#mascot-speech-bubble`) will be made visible instantly *before* the typing effect begins.
    *   This will be done by directly manipulating its style via JavaScript:
        *   `mascotSpeechBubble.style.opacity = '1';`
        *   `mascotSpeechBubble.style.transform = 'translateY(0)';` (to ensure it's in its final vertical position without any slide from the old animation)
        *   `mascotSpeechBubble.style.pointerEvents = 'auto';` (to make it interactive once visible)
    *   The initial CSS for `#mascot-speech-bubble` should ensure `opacity: 0;` and `pointer-events: none;` so it's hidden by default.

**3. Integration with Linger and Fade-Out:**

*   **Initiating Linger:**
    *   Once the `typeCharacter()` function has typed out the entire message, the existing logic for calculating `lingerDuration` (based on word count) will be executed.
    *   The `speechLingerTimeout` will then be initiated using this `lingerDuration`.
*   **Fade-Out Mechanism:**
    *   This remains unchanged. After the `speechLingerTimeout` completes, the `.fading` class will be added to `#mascot-speech-bubble`.
    *   This will trigger the existing `speech-fade` CSS animation.
    *   The `animationend` event listener (`speechFadeCleanupListener`) attached to `#mascot-speech-bubble` for the `speech-fade` animation will also remain, responsible for clearing the text content and removing the `.fading` class.

**4. Interruption Handling:**

*   If a new speech request (`displayEphemeralSpeech` is called again) occurs while text is still being typed out or during the linger/fade phases:
    *   **Stop Current Typing:** The active `typingTimeoutId` must be cleared using `clearTimeout(typingTimeoutId)`.
    *   **Clear Partially Typed Text:** The content of `#mascot-speech-text` must be cleared instantly: `mascotSpeechText.textContent = '';`.
    *   **Reset Bubble State:**
        *   Clear any existing `speechLingerTimeout`.
        *   Remove any active `speechFadeCleanupListener` from `#mascot-speech-bubble`.
        *   Remove any animation-related classes (e.g., `.appearing`, `.fading`, `.quick-fading`) from `#mascot-speech-bubble` by setting `mascotSpeechBubble.className = '';`.
        *   Immediately hide the bubble (`mascotSpeechBubble.style.opacity = '0';`) to prepare for the new speech, ensuring a clean transition.
    *   **Start New Speech:** The new text will then begin its own typewriter effect as described above.
*   The `speech-quick-fade` animation is not suitable for interrupting partially typed text. Interruption during typing should result in an immediate clear and reset, not a fade of the incomplete text.

**5. Conceptual Flow for `displayEphemeralSpeech(newText)`:**

```javascript
// --- Potentially at the top of the <script> or relevant scope ---
let typingTimeoutId: number | undefined;
const TYPING_SPEED_MS = 60; // Milliseconds per character

// Existing global/module-level variables:
// let speechLingerTimeout: NodeJS.Timeout | undefined;
// let speechFadeCleanupListener: (() => void) | undefined;
// const mascotSpeechBubble = document.getElementById('mascot-speech-bubble');
// const mascotSpeechText = document.getElementById('mascot-speech-text');
// ... (other necessary DOM elements and state variables)

function displayEphemeralSpeech(text: string) {
  if (!mascotSpeechBubble || !mascotSpeechText) return;

  // 1. Clear any ongoing speech processes (IMPORTANT FOR INTERRUPTIONS)
  clearTimeout(typingTimeoutId);
  typingTimeoutId = undefined;

  clearTimeout(speechLingerTimeout);
  speechLingerTimeout = undefined;

  if (speechFadeCleanupListener) {
    mascotSpeechBubble.removeEventListener('animationend', speechFadeCleanupListener);
    speechFadeCleanupListener = undefined;
  }

  // Reset bubble visual state and text content
  mascotSpeechBubble.className = ''; // Clear .appearing, .fading, .quick-fading
  mascotSpeechBubble.style.opacity = '0'; // Hide before new setup
  mascotSpeechBubble.style.transform = 'translateY(0)'; // Ensure correct position
  mascotSpeechBubble.style.pointerEvents = 'none'; // Default to non-interactive
  mascotSpeechText.textContent = '';   // Clear any old text

  // --- Existing mascot jiggle/mouth animation logic ---
  // (This logic from the current Bleepy.astro can be largely reused here)
  // Example:
  // if (activeMascot && mascotImageDisplay) { ... }
  // --- End of jiggle/mouth animation logic ---

  // 2. Make #mascot-speech-bubble visible for the new text
  mascotSpeechBubble.style.opacity = '1';
  mascotSpeechBubble.style.pointerEvents = 'auto'; // Make interactive

  // 3. Start the typewriter effect
  let charIndex = 0;
  const fullTextToDisplay = text; // Avoid issues if 'text' param is somehow changed externally

  function typeCharacter() {
    if (charIndex < fullTextToDisplay.length) {
      mascotSpeechText.textContent += fullTextToDisplay.charAt(charIndex);
      charIndex++;
      typingTimeoutId = setTimeout(typeCharacter, TYPING_SPEED_MS);
    } else {
      // Typing is complete
      typingTimeoutId = undefined;
      onTypingComplete();
    }
  }

  // Optional: A very small delay before starting typing can sometimes feel more natural
  // This also ensures that the bubble is definitely visible before typing starts.
  setTimeout(() => {
    // Check if the bubble is still meant to be showing this text (i.e., not interrupted again *during* this small delay)
    if (mascotSpeechBubble.style.opacity === '1' && mascotSpeechText.textContent === '') {
         typeCharacter();
    }
  }, 50); // e.g., 50ms delay, adjust as needed or remove if not desired.

  function onTypingComplete() {
    // 4. When typing is complete:
    //    a. Calculate lingerDuration
    const words = fullTextToDisplay.split(/\s+/).length;
    let currentLingerDuration = (words / 2.5) * 1000 + 1500; // Existing formula
    currentLingerDuration = Math.max(2500, Math.min(currentLingerDuration, 10000)); // Existing clamps

    //    b. Start the speechLingerTimeout
    speechLingerTimeout = setTimeout(() => {
      if (!mascotSpeechBubble || !mascotSpeechText) return;

      // 5. When speechLingerTimeout completes:
      //    a. Add .fading class to trigger speech-fade animation
      mascotSpeechBubble.classList.add('fading');

      //    b. Set up animationend listener for cleanup
      speechFadeCleanupListener = () => {
        if (!mascotSpeechBubble || !mascotSpeechText) return;
        mascotSpeechBubble.classList.remove('fading');
        mascotSpeechText.textContent = '';
        mascotSpeechBubble.style.opacity = '0'; // Ensure it's hidden post-animation
        mascotSpeechBubble.style.pointerEvents = 'none';
        speechFadeCleanupListener = undefined;
      };
      mascotSpeechBubble.addEventListener('animationend', speechFadeCleanupListener, { once: true });
    }, currentLingerDuration);
  }
}
```

**Mermaid Diagram of `displayEphemeralSpeech` Flow:**

```mermaid
graph TD
    A[displayEphemeralSpeech(newText)] --> B{Bubble/Text Elements Exist?};
    B -- No --> X[Exit];
    B -- Yes --> C[Clear Previous State: <br>- typingTimeoutId <br>- speechLingerTimeout <br>- speechFadeCleanupListener <br>- Bubble CSS Classes <br>- Bubble Opacity/Transform/PointerEvents <br>- mascotSpeechText.textContent];
    C --> D[Perform Mascot Jiggle/Mouth Animation (Existing Logic)];
    D --> E[Make Speech Bubble Visible: <br>- style.opacity = 1 <br>- style.transform = 'translateY(0)' <br>- style.pointerEvents = 'auto'];
    E --> F[Optional: Short Delay (e.g., 50ms)];
    F --> G{Start Typewriter Effect: typeCharacter()};
    G --> H{charIndex < fullText.length?};
    H -- Yes --> I[Append char to mascotSpeechText.textContent];
    I --> J[Increment charIndex];
    J --> K[typingTimeoutId = setTimeout(typeCharacter, TYPING_SPEED_MS)];
    K ----> G;
    H -- No (Typing Complete) --> L[typingTimeoutId = undefined <br> onTypingComplete()];
    L --> M[Calculate lingerDuration];
    M --> N[speechLingerTimeout = setTimeout(...)];
    N -- Timeout Completes --> O[Add '.fading' class to bubble];
    O --> P[speechFadeCleanupListener = () => {...} <br> bubble.addEventListener('animationend', listener)];
    P -- 'speech-fade' Animation Ends --> Q[Cleanup After Fade: <br>- Remove '.fading' class <br>- Clear textContent <br>- Set bubble opacity = 0, pointerEvents = 'none' <br>- Clear listener];
    Q --> X;