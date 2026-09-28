export const USER_STORAGE_KEY = "erp_current_user";
export const TOKEN_STORAGE_KEY = "erp_access_token";
export const AUTH_SYNC_STORAGE_KEY = "erp_auth_sync";
export const AUTH_SESSION_CHANGED_EVENT = "erp-auth-session-changed";

export type AuthSyncReason = "LOGIN" | "LOGOUT" | "TOKEN_INVALID" | "USER_UPDATED";

export function notifyAuthSessionChanged(reason: AuthSyncReason): void {
  const detail = {
    reason,
    at: Date.now(),
    nonce: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  };

  // Same tab: storage event does not fire in the tab that made the change.
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_CHANGED_EVENT, { detail }),
  );

  // Other tabs: writing one sync key gives them one atomic "reload auth" signal.
  localStorage.setItem(AUTH_SYNC_STORAGE_KEY, JSON.stringify(detail));
}

export function clearAuthStorage(reason: AuthSyncReason = "LOGOUT"): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  notifyAuthSessionChanged(reason);
}
