const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();

if (!configuredBaseUrl) {
  throw new Error("VITE_API_BASE_URL chưa được cấu hình.");
}

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");
