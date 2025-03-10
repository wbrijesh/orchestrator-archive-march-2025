export async function GET() {
  const options = {
    method: "GET",
    headers: {
      "X-BB-API-Key": process.env.BROWSERBASE_API_KEY,
    },
  };

  try {
    const response = await fetch(
      "https://api.browserbase.com/v1/sessions/ccf679d2-dac1-46bd-a984-aaf980a7b054/recording",
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
