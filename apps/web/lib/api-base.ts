export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}
