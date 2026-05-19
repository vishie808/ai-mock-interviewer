exports.handler = async function (event, context) {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Netlify environment variables." }),
    };
  }

  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages;
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const requestBody = {
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: messages,
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Anthropic error:", response.status, responseText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: responseText }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: responseText,
    };

  } catch (err) {
    console.error("Fetch error:", err.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
