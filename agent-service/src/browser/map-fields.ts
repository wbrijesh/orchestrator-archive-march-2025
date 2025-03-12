/**
 * Helper function to map a browser session to database fields
 * @param session Browserbase session object
 * @returns Object with browser_ prefixed fields
 */
export function mapBrowserSessionToFields(session: any) {
  return {
    browser_session_id: session.id || "",
    browser_created_at: session.createdAt || "",
    browser_updated_at: session.updatedAt || "",
    browser_project_id: session.projectId || "",
    browser_started_at: session.startedAt || "",
    browser_ended_at: session.endedAt || "",
    browser_expires_at: session.expiresAt || "",
    browser_status: session.status || "",
    browser_proxy_bytes: session.proxyBytes || "",
    browser_avg_cpu_usage: session.avgCpuUsage || "",
    browser_memory_usage: session.memoryUsage || "",
    browser_keep_alive: session.keepAlive || "",
    browser_context_id: session.contextId || "",
    browser_region: session.region || "",
    browser_connect_url: session.connectUrl || "",
    browser_selenium_remote_url: session.seleniumRemoteUrl || "",
    browser_signing_key: session.signingKey || "",
  };
}
