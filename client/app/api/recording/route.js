export async function POST(request) {
  try {
    // Parse the request body to get the session ID
    const body = await request.json();
    const sessionId = body.sessionId;

    // Validate that sessionId exists
    if (!sessionId) {
      return Response.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const options = {
      method: "GET", // Note: We still use GET for the BrowserBase API call
      headers: {
        "X-BB-API-Key": process.env.BROWSERBASE_API_KEY,
      },
    };

    const response = await fetch(
      `https://api.browserbase.com/v1/sessions/${sessionId}/recording`,
      options,
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching recording:", error);
    return Response.json(
      { error: "Failed to fetch recording" },
      { status: 500 },
    );
  }
}
