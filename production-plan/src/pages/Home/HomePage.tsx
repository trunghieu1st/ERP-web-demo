import { useAuth } from "../../auth/AuthContext";

function HomePage() {
  const { user } = useAuth();

  return (
    <div
      style={{
        padding: "30px",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
        background: "#f5f6f8",
      }}
    >
      {/* Tiêu đề */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            margin: "0 0 10px 0",
            fontSize: "26px",
          }}
        >
          Hệ thống ERP
        </h1>

        <div
          style={{
            fontSize: "16px",
            color: "#555",
          }}
        >
          Chào mừng{" "}
          <strong>
            {user?.fullName || user?.username}
          </strong>
        </div>
      </div>

      {/* Thông tin người dùng */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#777", marginBottom: "8px" }}>
            Nhà máy
          </div>

          <strong>
            {user?.factoryName || "-"}
          </strong>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#777", marginBottom: "8px" }}>
            Phòng ban
          </div>

          <strong>
            {user?.departmentName || "-"}
          </strong>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#777", marginBottom: "8px" }}>
            Vai trò
          </div>

          <strong>
            {user?.roleName || user?.role || "-"}
          </strong>
        </div>
      </div>

      {/* Khu vực hướng dẫn */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "20px",
          }}
        >
          Chức năng hệ thống
        </h2>

        <p
          style={{
            marginBottom: 0,
            color: "#666",
            lineHeight: 1.6,
          }}
        >
        Vui lòng chọn chức năng trên thanh menu bên trái
          để bắt đầu làm việc.
        </p>
      </div>
    </div>
  );
}

export default HomePage;