import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  getPwaDepartment,
} from "../../config/pwaConfig";

type PwaFunction = {
  id: string;
  name: string;
  path: string;
};

const pwaFunctions: Record<number, PwaFunction[]> = {
  // ==========================================================
  // KẾ HOẠCH ĐƠN HÀNG
  // Department ID = 14
  // ==========================================================
  14: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/khdh/scan",
    },
    {
      id: "order",
      name: "Đơn hàng",
      path: "/pwa/khdh/order",
    },
  ],

  // ==========================================================
  // KỸ THUẬT
  // Department ID = 15
  // ==========================================================
  15: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/kt/scan",
    },
    {
      id: "technical",
      name: "Thông tin kỹ thuật",
      path: "/pwa/kt/technical",
    },
  ],

  // ==========================================================
  // KHO NGUYÊN PHỤ LIỆU
  // Department ID = 16
  // ==========================================================
  16: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/khonpl/scan",
    },
    {
      id: "receipt",
      name: "Nhập kho",
      path: "/pwa/khonpl/receipt",
    },
    {
      id: "issue",
      name: "Xuất kho",
      path: "/pwa/khonpl/issue",
    },
    {
      id: "search",
      name: "Tra cứu",
      path: "/pwa/khonpl/search",
    },
  ],

  // ==========================================================
  // TỔ CẮT
  // Department ID = 17
  // ==========================================================
  17: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/tc/scan",
    },
    {
      id: "cutting",
      name: "Tác nghiệp cắt",
      path: "/pwa/tc/cutting",
    },
    {
      id: "bundle",
      name: "Đóng bó",
      path: "/pwa/tc/bundle",
    },
  ],

  // ==========================================================
  // PHÂN XƯỞNG
  // Department ID = 18
  // ==========================================================
  18: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/px/scan",
    },
    {
      id: "production",
      name: "Sản xuất",
      path: "/pwa/px/production",
    },
  ],

  // ==========================================================
  // HOÀN THIỆN
  // Department ID = 19
  // ==========================================================
  19: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/ht/scan",
    },
    {
      id: "finishing",
      name: "Hoàn thiện",
      path: "/pwa/ht/finishing",
    },
  ],

  // ==========================================================
  // KẾ TOÁN TÀI CHÍNH
  // Department ID = 20
  // ==========================================================
  20: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/kttc/scan",
    },
    {
      id: "report",
      name: "Báo cáo",
      path: "/pwa/kttc/report",
    },
  ],

  // ==========================================================
  // IE
  // Department ID = 21
  // ==========================================================
  21: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/ie/scan",
    },
    {
      id: "operation",
      name: "Tác nghiệp",
      path: "/pwa/ie/operation",
    },
  ],

  // ==========================================================
  // QUẢN LÝ THIẾT BỊ
  // Department ID = 22
  // ==========================================================
  22: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/qltb/scan",
    },
    {
      id: "equipment",
      name: "Thiết bị",
      path: "/pwa/qltb/equipment",
    },
  ],

  // ==========================================================
  // HÀNH CHÍNH NHÂN SỰ
  // Department ID = 23
  // ==========================================================
  23: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/hcns/scan",
    },
    {
      id: "employee",
      name: "Nhân sự",
      path: "/pwa/hcns/employee",
    },
  ],

  // ==========================================================
  // QA
  // Department ID = 24
  // ==========================================================
  24: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/qa/scan",
    },
    {
      id: "quality",
      name: "Kiểm tra chất lượng",
      path: "/pwa/qa/quality",
    },
  ],

  // ==========================================================
  // BAN GIÁM ĐỐC
  // Department ID = 25
  // ==========================================================
  25: [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/pwa/bgd/dashboard",
    },
    {
      id: "report",
      name: "Báo cáo",
      path: "/pwa/bgd/report",
    },
  ],

  // ==========================================================
  // CÔNG NGHỆ THÔNG TIN
  // Department ID = 26
  // ==========================================================
  26: [
    {
      id: "scan",
      name: "Quét QR",
      path: "/pwa/it/scan",
    },
    {
      id: "system",
      name: "Quản trị hệ thống",
      path: "/pwa/it/system",
    },
  ],
};

function PwaDepartmentPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const departmentId = Number(
    user.departmentId
  );

  const department =
    getPwaDepartment(departmentId);

  if (!department) {
    return (
      <div
        style={{
          padding: "20px",
        }}
      >
        Không xác định được phòng ban PWA.
      </div>
    );
  }

  const functions =
    pwaFunctions[departmentId] ?? [];

  return (
    <div
      style={{
        padding: "16px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* ==================================================
          HEADER
         ================================================== */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "4px",
          }}
        >
          {department.code}
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "22px",
          }}
        >
          {department.name}
        </h2>
      </div>

      {/* ==================================================
          USER
         ================================================== */}

      <div
        style={{
          padding: "12px",
          marginBottom: "16px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          backgroundColor: "#f8f8f8",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {user.fullName}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#666",
            marginTop: "4px",
          }}
        >
          {user.factoryName}
        </div>
      </div>

      {/* ==================================================
          CHỨC NĂNG
         ================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        {functions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              window.location.href =
                item.path;
            }}
            style={{
              minHeight: "100px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              padding: "12px",
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* ==================================================
          CHƯA CÓ CHỨC NĂNG
         ================================================== */}

      {functions.length === 0 && (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#666",
          }}
        >
          Phòng ban chưa có chức năng PWA.
        </div>
      )}
    </div>
  );
}

export default PwaDepartmentPage;