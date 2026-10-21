export function mockApiEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";