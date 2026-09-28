import { API_BASE_URL } from "./apiConfig";

const TOKEN_STORAGE_KEY =
  "erp_access_token";

const USER_STORAGE_KEY =
  "erp_current_user";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  // ==========================================
  // ACCESS TOKEN
  // ==========================================

  const accessToken =
    localStorage.getItem(
      TOKEN_STORAGE_KEY,
    );

  // ==========================================
  // HEADERS
  // ==========================================

  const headers =
    new Headers(options.headers);

  // Tự động set JSON nếu có body
  // nhưng không phải FormData
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  // ==========================================
  // AUTHORIZATION
  // ==========================================

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  // ==========================================
  // BUILD URL
  // ==========================================

  const isFullUrl =
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://");

  const url = isFullUrl
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // ==========================================
  // FETCH
  // ==========================================

  const response = await fetch(
    url,
    {
      ...options,
      headers,
    },
  );

  // ==========================================
  // TOKEN HẾT HẠN / KHÔNG HỢP LỆ
  // ==========================================

  if (response.status === 401) {
    localStorage.removeItem(
      TOKEN_STORAGE_KEY,
    );

    localStorage.removeItem(
      USER_STORAGE_KEY,
    );

    window.location.href =
      "/login";
  }

  return response;
}