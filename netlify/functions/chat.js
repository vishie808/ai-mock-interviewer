exports.handler = async function (event, context) {

  // ── CORS headers so the browser can talk to this function ──
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // ── Read API key from Netlify environment variable ──
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set in environment variables.");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "API key not configured. Add ANTHROPIC_API_KEY in Netlify → Site Settings → Environment Variables.",
      }),
    };
  }

  // ── Parse the request body ──
  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages;
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON in request body." }),
    };
  }

  if (!messages || !Array.isArray(messages)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing or invalid 'messages' array." }),
    };
  }

  // ── Call the Anthropic API ──
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",   // Fast + cheap model — works on free tier
        max_tokens: 1024,
        messages: messages,
      }),
    });

    // If Anthropic returned an error, forward it with details
    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Anthropic API returned ${response.status}`,
          detail: errText,
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (err) {
    console.error("Network/fetch error calling Anthropic:", err);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Failed to reach Anthropic API.",
        detail: err.message,
      }),
    };
  }
};
