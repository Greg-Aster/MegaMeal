# Proactive Dialogue System Design

This document outlines the design for a proactive dialogue system for the mascots in `src/components/bleepy/Bleepy.astro`, combining pre-written dialogue with AI-generated "thoughts."

## 1. AI "Random Thought" Prompt Structure

When `src/components/bleepy/Bleepy.astro` decides to request an AI-generated "thought" from the Cloudflare Worker, it will send a JSON payload. The `persona` field will contain the active mascot's persona string from `mascotData.ts`. The `message` field will contain the specific instruction for the LLM.

**Proposed `message` field content (instruction for LLM):**

```
"You are currently <MASCOT_NAME>. Generate a brief, spontaneous, in-character statement, observation, or dark joke, consistent with your established persona. This is not a reply to a user, but rather a random thought or musing you might have about the MEGAMEAL universe or your own existence within it. Keep it concise."
```

*   **Rationale:**
    *   Explicitly states it's *not* a reply to a user, guiding the LLM towards a proactive utterance.
    *   Reinforces the need to be in-character and consistent with the `persona`.
    *   Suggests the type of content (statement, observation, dark joke, musing).
    *   Mentions the MEGAMEAL universe context.
    *   Requests brevity.
    *   The `<MASCOT_NAME>` placeholder would be dynamically replaced with the actual mascot's name (e.g., "BLEEPY") by `Bleepy.astro` before sending the request, further grounding the LLM.

## 2. Blending Strategy for Legacy vs. AI Thoughts

When the proactive dialogue timer fires in `src/components/bleepy/Bleepy.astro`, the system will use a probabilistic approach to decide between displaying a legacy random dialogue from `mascotData.ts -> randomDialogues` and requesting an AI-generated thought.

**Proposed Blending Ratio:**

*   **70% chance** for a legacy random dialogue.
*   **30% chance** for an AI-generated thought.

**Implementation:**
Generate a random number between 0 and 1.
*   If the number is less than 0.7, select a random dialogue from the `randomDialogues` array.
*   Otherwise (if the number is 0.7 or greater), trigger a request to the Cloudflare Worker for an AI-generated thought using the prompt structure defined in section 1.

**Rationale:**
*   This ratio prioritizes the curated, pre-written content, ensuring a baseline level of quality and thematic consistency.
*   It introduces AI-generated thoughts frequently enough to add novelty and dynamism without overwhelming the user or relying too heavily on potentially less predictable AI responses.
*   This ratio can be easily adjusted in the future based on user feedback and observed quality of AI responses.

## 3. Frequency of Proactive Utterances

The proactive dialogue timer should attempt to make a mascot speak at a regular interval, with the timer being reset by user interaction.

**Proposed Frequency:**

*   The timer will fire **every 45 to 60 seconds**.
*   This timer should be **reset** whenever the user:
    *   Sends a message through the chat input.
    *   Possibly other significant interactions, if any (e.g., clicking on the mascot, though this might trigger a different interaction type).

**Implementation:**
*   Use a `setTimeout` function in `Bleepy.astro`.
*   When the timer fires, execute the blending strategy (section 2).
*   After an utterance (either legacy or AI), or if the AI request fails, reset the timer for another 45-60 seconds (a random value within this range can add more natural variation).
*   Clear and reset the timer upon user chat input.

**Rationale:**
*   A 45-60 second interval provides a good balance – frequent enough to feel proactive but not so frequent as to be annoying or interruptive.
*   Resetting on user interaction ensures the mascot doesn't speak over the user or immediately after the user has engaged, making the proactive dialogue feel more natural and less like a fixed, intrusive loop.

## 4. Cloudflare Worker Request Modification

Based on the current implementation of the Cloudflare Worker (`../mascot-chatbot-cf-worker/my-mascot-worker-service/src/index.ts`), **no significant modifications are strictly necessary** to handle the "random thought" request if the instruction is sent as the `message` field.

*   The worker already accepts `message` and `persona` fields.
*   It passes the `persona` as a system instruction and the `message` as the user prompt to the Gemini LLM.
*   The proposed "random thought" instruction (section 1) is designed to be effective when passed as the `message`.

**Consideration for Future Enhancement (Optional):**

For greater clarity and potential future differentiation of request types within the worker, a new field like `requestType: "randomThought"` could be added to the JSON payload sent from `Bleepy.astro`.

*   **If implemented:**
    *   `Bleepy.astro` would include this field.
    *   The Cloudflare Worker could then (optionally) have logic to slightly adjust parameters or pre-processing if `requestType` is `"randomThought"`, though for the current design, the core Gemini call would remain similar.
    *   For example, specific safety settings or generation parameters (`temperature`, `maxOutputTokens`) might be tuned differently for random thoughts versus direct replies in the future.

However, for the initial implementation, **using the existing `message` field for the instruction is sufficient and simpler.** The worker will treat it as the primary input to the LLM, guided by the `persona`.