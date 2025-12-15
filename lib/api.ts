export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_API_URL
  if (envUrl) return envUrl

  // Fallbacks for local development when env is missing
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location
    if (port === "3000") {
      return `${protocol}//${hostname}:5000`
    }
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`
  }

  return "http://localhost:5000"
}

export function getClientBaseUrl() {
  const envClient = process.env.NEXT_PUBLIC_CLIENT_URL
  if (envClient) return envClient

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return "http://localhost:3000"
}

