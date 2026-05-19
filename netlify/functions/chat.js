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

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "GROQ_API_KEY not set in Netlify environment variables." }),
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
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: messages,
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Groq error:", response.status, responseText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: responseText }),
      };
    }

    // Groq returns OpenAI format — convert to Anthropic format
    // so the frontend code works without any changes
    const groqData = JSON.parse(responseText);
    const converted = {
      content: [
        {
          type: "text",
          text: groqData.choices[0].message.content,
        },
      ],
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(converted),
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
