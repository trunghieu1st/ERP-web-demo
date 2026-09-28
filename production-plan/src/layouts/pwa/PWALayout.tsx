import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

export default function PWALayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6f8",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================================
          HEADER PWA
         ================================= */}
      <header
        style={{
          height: "60px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            ERP
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#666",
            }}
          >
            {user?.departmentName}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Đăng xuất
        </button>
      </header>

      {/* ================================
          NỘI DUNG PWA
         ================================= */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}