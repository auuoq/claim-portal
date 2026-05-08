export function getApiBaseUrl(): string {
  const envUrl = (
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_TEST_URL
  )?.trim();

  if (envUrl) return envUrl;
  return "http://localhost:8008/api";
}
