interface Env {
  GEMINI_API_KEY?: string;
}

/**
 * Handles OPTIONS requests for CORS preflight.
 * @param request The incoming request.
 * @returns A Response object with appropriate CORS headers.
 */
function handleOptions(request: Request): Response {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Added Authorization for potential future use
  };
  return new Response(null, { headers });
}

/**
 * Helper function to create a JSON response with CORS headers.
 * @param data The data to send in the JSON response.
 * @param options Optional ResponseInit options (e.g., status).
 * @returns A Response object.
 */
function jsonResponse(data: any, options?: ResponseInit): Response {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return new Response(JSON.stringify(data), { ...defaultOptions, ...options });
}

/**
 * Handles the main incoming requests to the worker.
 * @param request The incoming request.
 * @param env The worker environment containing secrets.
 * @returns A Promise resolving to a Response object.
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  // 1. API Key Management
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured.');
    return jsonResponse({ error: 'API key not configured. Please contact support.' }, { status: 500 });
  }

  // 2. Request Validation
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Invalid request method. Only POST is allowed.' }, { status: 405 });
  }

  if (request.headers.get('Content-Type') !== 'application/json') {
    return jsonResponse({ error: 'Invalid Content-Type. Only application/json is accepted.' }, { status: 415 });
  }

  let requestBody: { message?: string; persona?: string };
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('Failed to parse JSON body:', e);
    return jsonResponse({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { message, persona } = requestBody;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return jsonResponse({ error: 'Missing or invalid "message" field in request body.' }, { status: 400 });
  }
  if (!persona || typeof persona !== 'string' || persona.trim() === '') {
    return jsonResponse({ error: 'Missing or invalid "persona" field in request body.' }, { status: 400 });
  }

  // 3. Gemini API Request Construction
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const geminiRequestBody = {
    system_instruction: {
      parts: [{ text: persona }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  // 4. Making the API Call & Processing Response
  try {
    const apiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Gemini API request failed with status ${apiResponse.status}: ${errorText}`);
      return jsonResponse({ error: 'Failed to communicate with the AI service.' }, { status: 502 });
    }

    const geminiResponseData = await apiResponse.json();

    // Check for prompt feedback block reason
    if (geminiResponseData.promptFeedback?.blockReason) {
      console.error('Gemini API blocked prompt:', geminiResponseData.promptFeedback);
      return jsonResponse(
        { error: `Request blocked by AI safety filters: ${geminiResponseData.promptFeedback.blockReason}` },
        { status: 400 }
      );
    }

    // Check candidates
    if (!geminiResponseData.candidates || geminiResponseData.candidates.length === 0) {
      console.error('No candidates returned from Gemini API:', geminiResponseData);
      return jsonResponse({ error: 'AI service did not return a valid response.' }, { status: 500 });
    }

    const candidate = geminiResponseData.candidates[0];
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error(`Gemini API returned non-STOP finish reason: ${candidate.finishReason}`, candidate);
      if (candidate.finishReason === 'SAFETY') {
        return jsonResponse({ error: 'AI response flagged for safety reasons.' }, { status: 400 });
      }
      return jsonResponse({ error: `AI processing issue: ${candidate.finishReason}` }, { status: 500 });
    }

    if (!candidate.content?.parts?.[0]?.text) {
        console.error('Invalid response structure from Gemini API, missing text:', geminiResponseData);
        return jsonResponse({ error: 'AI service returned an unexpected response format.' }, { status: 500 });
    }

    const generatedText = candidate.content.parts[0].text;

    // 5. Returning Response to Client
    return jsonResponse({ reply: generatedText });

  } catch (error) {
    console.error('Error during Gemini API call or response processing:', error);
    return jsonResponse({ error: 'An unexpected error occurred while processing your request.' }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    try {
      return await handleRequest(request, env);
    } catch (e: any) {
      console.error('Unhandled error in fetch handler:', e);
      return jsonResponse({ error: `Internal Server Error: ${e.message}` }, { status: 500 });
    }
  },
};