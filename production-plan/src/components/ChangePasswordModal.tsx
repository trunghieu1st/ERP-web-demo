import { useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../api/apiClient";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user, accessToken } = useAuth();

  // =====================================================
  // FORM
  // =====================================================

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  // =====================================================
  // SHOW / HIDE PASSWORD
  // =====================================================

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =====================================================
  // STATE
  // =====================================================

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =====================================================
  // RESET KHI MỞ POPUP
  // =====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setError("");
    setSuccess("");
    setSaving(false);
  }, [open]);

  // =====================================================
  // ESC ĐỂ ĐÓNG
  // =====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!saving) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  // =====================================================
  // KHÔNG RENDER KHI ĐÓNG
  // =====================================================

  if (!open) {
    return null;
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // ===================================================
    // VALIDATE FRONTEND
    // ===================================================

    if (!currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");

      return;
    }

    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");

      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");

      return;
    }

    if (!confirmPassword.trim()) {
      setError("Vui lòng xác nhận mật khẩu mới.");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");

      return;
    }

    if (currentPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");

      return;
    }

    if (!user?.userId) {
      setError("Không xác định được người dùng đang đăng nhập.");

      return;
    }

    // ===================================================
    // CALL API
    // ===================================================

    try {
      setSaving(true);

      const response = await apiFetch("/api/users/change-password", {
        method: "PUT",

        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      // =================================================
      // RESPONSE BODY
      // =================================================

      let data: {
        message?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // =================================================
      // ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu.");
      }

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(data.message || "Đổi mật khẩu thành công.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Tự đóng sau một chút
      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ENTER ĐỂ SUBMIT
  // =====================================================

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !saving) {
      void handleSubmit();
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      onMouseDown={(event) => {
        /*
         * Click vùng tối bên ngoài popup
         * thì đóng.
         */

        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
      style={{
        position: "fixed",

        inset: 0,

        backgroundColor: "rgba(15, 23, 42, 0.55)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "20px",

        boxSizing: "border-box",

        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "460px",

          backgroundColor: "#ffffff",

          borderRadius: "10px",

          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",

          overflow: "hidden",

          color: "#111827",
        }}
      >
        {/* =============================================
            HEADER
        ============================================== */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            padding: "16px 18px",

            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "17px",

                fontWeight: 700,

                color: "#111827",
              }}
            >
              🔑 Đổi mật khẩu
            </div>

            <div
              style={{
                marginTop: "3px",

                fontSize: "12px",

                color: "#6b7280",
              }}
            >
              {user?.fullName || user?.username}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            title="Đóng"
            style={{
              width: "32px",

              height: "32px",

              border: "none",

              borderRadius: "6px",

              backgroundColor: "transparent",

              color: "#6b7280",

              fontSize: "22px",

              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* =============================================
            BODY
        ============================================== */}

        <div
          style={{
            padding: "18px",
          }}
        >
          {/* ERROR */}

          {error && (
            <div
              style={{
                marginBottom: "14px",

                padding: "10px 12px",

                border: "1px solid #fecaca",

                borderRadius: "6px",

                backgroundColor: "#fef2f2",

                color: "#dc2626",

                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              style={{
                marginBottom: "14px",

                padding: "10px 12px",

                border: "1px solid #bbf7d0",

                borderRadius: "6px",

                backgroundColor: "#f0fdf4",

                color: "#15803d",

                fontSize: "13px",
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* =========================================
              CURRENT PASSWORD
          ========================================== */}

          <PasswordField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            show={showCurrentPassword}
            disabled={saving}
            autoFocus
            onChange={setCurrentPassword}
            onToggle={() => setShowCurrentPassword((prev) => !prev)}
            onKeyDown={handleKeyDown}
          />

          {/* =========================================
              NEW PASSWORD
          ========================================== */}

          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            show={showNewPassword}
            disabled={saving}
            onChange={setNewPassword}
            onToggle={() => setShowNewPassword((prev) => !prev)}
            onKeyDown={handleKeyDown}
          />

          {/* =========================================
              CONFIRM PASSWORD
          ========================================== */}

          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            show={showConfirmPassword}
            disabled={saving}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
            onKeyDown={handleKeyDown}
          />

          <div
            style={{
              marginTop: "-4px",

              fontSize: "12px",

              color: "#6b7280",
            }}
          >
            Mật khẩu mới phải có ít nhất 6 ký tự.
          </div>
        </div>

        {/* =============================================
            FOOTER
        ============================================== */}

        <div
          style={{
            display: "flex",

            justifyContent: "flex-end",

            gap: "8px",

            padding: "14px 18px",

            borderTop: "1px solid #e5e7eb",

            backgroundColor: "#f9fafb",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 16px",

              border: "1px solid #d1d5db",

              borderRadius: "6px",

              backgroundColor: "#ffffff",

              color: "#374151",

              fontWeight: 600,

              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || Boolean(success)}
            style={{
              minWidth: "135px",

              padding: "9px 16px",

              border: "none",

              borderRadius: "6px",

              backgroundColor:
                saving || Boolean(success) ? "#93c5fd" : "#2563eb",

              color: "#ffffff",

              fontWeight: 700,

              cursor: saving || Boolean(success) ? "not-allowed" : "pointer",
            }}
          >
            {saving
              ? "Đang lưu..."
              : success
                ? "Đã đổi mật khẩu"
                : "Đổi mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================================================
// PASSWORD FIELD
// =======================================================

interface PasswordFieldProps {
  label: string;

  value: string;

  show: boolean;

  disabled: boolean;

  autoFocus?: boolean;

  onChange: (value: string) => void;

  onToggle: () => void;

  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function PasswordField({
  label,
  value,
  show,
  disabled,
  autoFocus = false,
  onChange,
  onToggle,
  onKeyDown,
}: PasswordFieldProps) {
  return (
    <div
      style={{
        marginBottom: "16px",
      }}
    >
      <label
        style={{
          display: "block",

          marginBottom: "6px",

          fontSize: "13px",

          fontWeight: 600,

          color: "#374151",
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: "flex",

          alignItems: "center",

          border: "1px solid #d1d5db",

          borderRadius: "6px",

          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",

          overflow: "hidden",
        }}
      >
        <input
          type={show ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,

            minWidth: 0,

            padding: "10px 12px",

            border: "none",

            outline: "none",

            backgroundColor: "transparent",

            color: "#111827",

            fontSize: "14px",
          }}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          title={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          style={{
            width: "44px",

            alignSelf: "stretch",

            border: "none",

            borderLeft: "1px solid #e5e7eb",

            backgroundColor: "#f9fafb",

            cursor: disabled ? "not-allowed" : "pointer",

            fontSize: "16px",
          }}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
