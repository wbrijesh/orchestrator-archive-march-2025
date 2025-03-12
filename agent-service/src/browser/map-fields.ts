/**
 * Helper function to map a browser session to database fields
 * @param session Browserbase session object
 * @returns Object with browser_ prefixed fields
 */
export function mapBrowserSessionToFields(session: any) {
  return {
    browser_session_id: session.id || "",
    browser_connect_url: session.connectUrl || "",
  };
}
