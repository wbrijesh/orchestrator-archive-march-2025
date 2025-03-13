/**
 * Helper function to map a browser session to database fields
 * @param session Browserbase session object
 * @param liveViewUrl Optional live view URL from debug information
 * @returns Object with browser_ prefixed fields
 */
export function mapBrowserSessionToFields(session: any, liveViewUrl?: string) {
  return {
    browser_session_id: session.id || "",
    browser_connect_url: session.connectUrl || "",
    live_view_url: liveViewUrl || "",
  };
}
