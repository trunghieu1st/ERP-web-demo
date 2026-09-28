import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";
import { departments, systemMenu } from "../config/menuConfig";
import { apiFetch } from "../api/apiClient";

interface MyReport {
  reportId: number;
  reportCode: string;
  reportName: string;
  reportPath: string;
  icon?: string | null;
  sortOrder: number;
}

function Sidebar() {
  const { user, logout } = useAuth();

  // =========================================================
  // FULL ACCESS
  //
  // ADMIN hoặc phòng IT (DepartmentId = 13)
  // =========================================================

  const isFullAccess = user?.role === "ADMIN" || user?.departmentId === 13;

  // =========================================================
  // STATE
  // =========================================================

  // Thu gọn / mở Sidebar
  const [collapsed, setCollapsed] = useState(false);

  // Popup đổi mật khẩu
  const [openChangePassword, setOpenChangePassword] = useState(false);

  // Quản trị hệ thống
  const [openSystemMenu, setOpenSystemMenu] = useState(true);

  // Phòng ban
  const [openDepartments, setOpenDepartments] = useState<
    Record<string | number, boolean>
  >({});

  // Báo cáo của user hiện tại
  const [myReports, setMyReports] = useState<MyReport[]>([]);

  // Đóng / mở danh mục báo cáo
  const [openReports, setOpenReports] = useState(true);

  // Loading báo cáo
  const [loadingReports, setLoadingReports] = useState(false);

  // =========================================================
  // KHI USER THAY ĐỔI
  // =========================================================

  useEffect(() => {
    if (!user) {
      setOpenDepartments({});
      setOpenSystemMenu(true);
      return;
    }

    // ADMIN / IT:
    // mở quản trị hệ thống
    // các phòng ban mặc định đóng
    if (isFullAccess) {
      setOpenSystemMenu(true);
      setOpenDepartments({});
      return;
    }

    // User bình thường:
    // tự mở phòng ban của user
    const userDepartment = departments.find(
      (department) => department.departmentId === user.departmentId,
    );

    if (userDepartment) {
      setOpenDepartments({
        [userDepartment.departmentId]: true,
      });
    } else {
      setOpenDepartments({});
    }
  }, [user?.userId, user?.departmentId, user?.role, isFullAccess]);

  // =========================================================
  // LOAD REPORTS OF CURRENT USER
  //
  // Backend tự xử lý:
  //
  // ADMIN -> tất cả report active
  // IT    -> tất cả report active
  //
  // User thường:
  // FactoryReport
  // +
  // DepartmentReport
  // =========================================================

  useEffect(() => {
    if (!user) {
      setMyReports([]);
      return;
    }

    let cancelled = false;

    const loadMyReports = async () => {
      try {
        setLoadingReports(true);

        const response = await apiFetch("/api/reports/my-reports");

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Không thể tải danh sách báo cáo.");
        }

        if (!cancelled) {
          const reports: MyReport[] = Array.isArray(data) ? data : [];

          reports.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }

            return a.reportName.localeCompare(b.reportName, "vi");
          });

          setMyReports(reports);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách báo cáo:", error);

        if (!cancelled) {
          setMyReports([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingReports(false);
        }
      }
    };

    void loadMyReports();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, user?.factoryId, user?.departmentId, user?.role]);

  // =========================================================
  // QUAN TRỌNG:
  //
  // Tất cả Hook phải nằm TRÊN đoạn return này.
  // =========================================================

  if (!user) {
    return null;
  }

  // =========================================================
  // TOGGLE QUẢN TRỊ HỆ THỐNG
  // =========================================================

  const toggleSystemMenu = () => {
    setOpenSystemMenu((prev) => !prev);
  };

  // =========================================================
  // TOGGLE PHÒNG BAN
  // =========================================================

  const toggleDepartment = (departmentId: string | number) => {
    setOpenDepartments((prev) => ({
      ...prev,

      [departmentId]: !prev[departmentId],
    }));
  };

  // =========================================================
  // TOGGLE SIDEBAR
  // =========================================================

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <>
      <aside
        style={{
          position: "relative",

          width: collapsed ? "56px" : "300px",

          minWidth: collapsed ? "56px" : "300px",

          height: "100vh",
          minHeight: 0,

          overflow: "visible",

          backgroundColor: "#111827",

          color: "white",

          display: "flex",
          flexDirection: "column",

          boxSizing: "border-box",

          transition: "width 0.2s ease, min-width 0.2s ease",
        }}
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          style={{
            padding: collapsed ? "10px 8px" : "18px 15px",

            borderBottom: "1px solid #374151",

            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <>
              <div
                style={{
                  fontSize: "18px",

                  fontWeight: 700,

                  marginBottom: "5px",
                }}
              >
                ERP SYSTEM
              </div>

              <div
                style={{
                  fontSize: "13px",

                  color: "#d1d5db",

                  lineHeight: "18px",
                }}
              >
                {user.fullName || user.username}
              </div>

              <div
                style={{
                  fontSize: "12px",

                  color: "#9ca3af",

                  marginTop: "3px",
                }}
              >
                {user.factoryName || "-"}
              </div>

              <button
                type="button"
                onClick={() => setOpenChangePassword(true)}
                style={{
                  marginTop: "9px",

                  padding: 0,

                  border: "none",

                  backgroundColor: "transparent",

                  color: "#60a5fa",

                  fontSize: "12px",

                  fontWeight: 600,

                  cursor: "pointer",

                  textDecoration: "underline",

                  textUnderlineOffset: "3px",
                }}
              >
                🔑 Đổi mật khẩu
              </button>
            </>
          )}
        </div>

        {/* =================================================
            NÚT THU GỌN / MỞ SIDEBAR
        ================================================== */}

        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Mở menu" : "Thu gọn menu"}
          style={{
            position: "absolute",

            top: "50%",

            right: "-14px",

            transform: "translateY(-50%)",

            width: "28px",

            height: "56px",

            border: "none",

            borderRadius: "0 8px 8px 0",

            backgroundColor: "#374151",

            color: "#ffffff",

            cursor: "pointer",

            fontSize: "22px",

            fontWeight: 700,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            zIndex: 100,

            boxShadow: "2px 0 5px rgba(0,0,0,0.25)",
          }}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* =================================================
            MENU
        ================================================== */}

        <nav
          style={{
            flex: 1,

            minHeight: 0,

            overflowY: "auto",

            overflowX: "hidden",

            padding: collapsed ? "10px 6px" : "10px",

            boxSizing: "border-box",
          }}
        >
          {/* ===============================================
              TRANG CHỦ
          ================================================ */}

          <NavLink
            to="/home"
            title={collapsed ? "Trang chủ" : undefined}
            style={({ isActive }) => ({
              display: "block",

              padding: collapsed ? "10px 5px" : "10px 12px",

              marginBottom: "10px",

              borderRadius: "5px",

              textDecoration: "none",

              color: "white",

              fontSize: "14px",

              fontWeight: 600,

              backgroundColor: isActive ? "#2563eb" : "#1f2937",

              boxSizing: "border-box",

              textAlign: collapsed ? "center" : "left",

              whiteSpace: "nowrap",

              overflow: "hidden",
            })}
          >
            {collapsed ? "⌂" : "🏠 TRANG CHỦ"}
          </NavLink>

          {/* ===============================================
              QUẢN TRỊ HỆ THỐNG
          ================================================ */}

          {isFullAccess && (
            <div
              style={{
                marginBottom: "10px",
              }}
            >
              {!collapsed && (
                <>
                  {/* HEADER QUẢN TRỊ HỆ THỐNG */}

                  <button
                    type="button"
                    onClick={toggleSystemMenu}
                    style={{
                      width: "100%",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      padding: "8px 12px",

                      marginBottom: openSystemMenu ? "5px" : "0",

                      border: "none",

                      borderRadius: "5px",

                      fontSize: "12px",

                      fontWeight: 700,

                      color: "#b91c1c",

                      backgroundColor: "#fef08a",

                      letterSpacing: "0.3px",

                      boxSizing: "border-box",

                      textAlign: "left",

                      cursor: "pointer",
                    }}
                  >
                    <span>QUẢN TRỊ HỆ THỐNG</span>

                    <span
                      style={{
                        fontSize: "17px",

                        lineHeight: "12px",

                        fontWeight: 700,

                        marginLeft: "10px",
                      }}
                    >
                      {openSystemMenu ? "−" : "+"}
                    </span>
                  </button>

                  {/* DANH SÁCH CHỨC NĂNG */}

                  {openSystemMenu && (
                    <div>
                      {systemMenu.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          title={item.name}
                          style={({ isActive }) => ({
                            display: "block",

                            padding: "9px 12px 9px 22px",

                            marginBottom: "3px",

                            borderRadius: "5px",

                            textDecoration: "none",

                            color: isActive ? "#ffffff" : "#d1d5db",

                            backgroundColor: isActive
                              ? "#2563eb"
                              : "transparent",

                            fontSize: "14px",

                            boxSizing: "border-box",

                            whiteSpace: "nowrap",

                            overflow: "hidden",

                            textOverflow: "ellipsis",
                          })}
                        >
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Sidebar thu gọn */}

              {collapsed && (
                <div>
                  <button
                    type="button"
                    title="Quản trị hệ thống"
                    onClick={() => {
                      setCollapsed(false);

                      setOpenSystemMenu(true);
                    }}
                    style={{
                      width: "100%",

                      padding: "10px 5px",

                      marginBottom: "3px",

                      border: "none",

                      borderRadius: "5px",

                      backgroundColor: "#fef08a",

                      color: "#b91c1c",

                      fontSize: "16px",

                      fontWeight: 700,

                      cursor: "pointer",
                    }}
                  >
                    ⚙
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===============================================
              CÁC PHÒNG BAN
          ================================================ */}

          {departments.map((department) => {
            // User thường:
            // chỉ xem phòng ban của mình.
            //
            // ADMIN / IT:
            // xem tất cả phòng ban.

            if (
              !isFullAccess &&
              department.departmentId !== user.departmentId
            ) {
              return null;
            }

            const visibleItems = department.items;

            const isOpen = openDepartments[department.departmentId] === true;

            return (
              <div
                key={department.departmentId}
                style={{
                  marginBottom: "8px",
                }}
              >
                {/* HEADER PHÒNG BAN */}

                <button
                  type="button"
                  onClick={() => toggleDepartment(department.departmentId)}
                  title={collapsed ? department.name : undefined}
                  style={{
                    width: "100%",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: collapsed ? "center" : "space-between",

                    padding: collapsed ? "9px 5px" : "8px 12px",

                    marginBottom: collapsed ? "3px" : isOpen ? "5px" : "0",

                    border: "none",

                    borderRadius: "5px",

                    fontSize: collapsed ? "16px" : "12px",

                    fontWeight: 700,

                    color: "#b91c1c",

                    backgroundColor: "#fef08a",

                    letterSpacing: "0.3px",

                    textAlign: "left",

                    cursor: "pointer",

                    boxSizing: "border-box",

                    whiteSpace: "nowrap",

                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",

                      textOverflow: "ellipsis",
                    }}
                  >
                    {collapsed ? "▣" : department.name}
                  </span>

                  {!collapsed && (
                    <span
                      style={{
                        fontSize: "17px",

                        lineHeight: "12px",

                        fontWeight: 700,

                        marginLeft: "10px",
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  )}
                </button>

                {/* CHỨC NĂNG PHÒNG BAN */}

                {!collapsed && isOpen && (
                  <div>
                    {visibleItems.length > 0 ? (
                      visibleItems.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          style={({ isActive }) => ({
                            display: "block",

                            padding: "9px 12px 9px 22px",

                            marginBottom: "3px",

                            borderRadius: "5px",

                            textDecoration: "none",

                            color: isActive ? "#ffffff" : "#d1d5db",

                            backgroundColor: isActive
                              ? "#2563eb"
                              : "transparent",

                            fontSize: "14px",

                            boxSizing: "border-box",
                          })}
                        >
                          {item.name}
                        </NavLink>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "7px 12px 8px 22px",

                          color: "#6b7280",

                          fontSize: "12px",

                          fontStyle: "italic",
                        }}
                      >
                        Chưa có chức năng
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* =================================================
              DANH MỤC BÁO CÁO

              Menu này KHÔNG lấy từ menuConfig.

              Dữ liệu được lấy từ:
              GET /api/reports/my-reports
          ================================================== */}

          {(loadingReports || myReports.length > 0) && (
            <div
              style={{
                marginBottom: "8px",
              }}
            >
              {/* =============================================
                  SIDEBAR ĐANG MỞ
              ============================================== */}

              {!collapsed && (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenReports((prev) => !prev)}
                    style={{
                      width: "100%",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      padding: "8px 12px",

                      marginBottom: openReports ? "5px" : "0",

                      border: "none",

                      borderRadius: "5px",

                      fontSize: "12px",

                      fontWeight: 700,

                      color: "#b91c1c",

                      backgroundColor: "#fef08a",

                      letterSpacing: "0.3px",

                      boxSizing: "border-box",

                      textAlign: "left",

                      cursor: "pointer",
                    }}
                  >
                    <span>DANH MỤC BÁO CÁO</span>

                    <span
                      style={{
                        fontSize: "17px",

                        lineHeight: "12px",

                        fontWeight: 700,

                        marginLeft: "10px",
                      }}
                    >
                      {openReports ? "−" : "+"}
                    </span>
                  </button>

                  {openReports && (
                    <div>
                      {loadingReports ? (
                        <div
                          style={{
                            padding: "7px 12px 8px 22px",

                            color: "#9ca3af",

                            fontSize: "12px",

                            fontStyle: "italic",
                          }}
                        >
                          Đang tải báo cáo...
                        </div>
                      ) : (
                        myReports.map((report) => (
                          <NavLink
                            key={report.reportId}
                            to={report.reportPath}
                            title={report.reportName}
                            style={({ isActive }) => ({
                              display: "block",

                              padding: "9px 12px 9px 22px",

                              marginBottom: "3px",

                              borderRadius: "5px",

                              textDecoration: "none",

                              color: isActive ? "#ffffff" : "#d1d5db",

                              backgroundColor: isActive
                                ? "#2563eb"
                                : "transparent",

                              fontSize: "14px",

                              boxSizing: "border-box",

                              whiteSpace: "nowrap",

                              overflow: "hidden",

                              textOverflow: "ellipsis",
                            })}
                          >
                            {report.reportName}
                          </NavLink>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* =============================================
                  SIDEBAR THU GỌN
              ============================================== */}

              {collapsed && (
                <button
                  type="button"
                  title="Danh mục báo cáo"
                  onClick={() => {
                    setCollapsed(false);
                    setOpenReports(true);
                  }}
                  style={{
                    width: "100%",

                    padding: "10px 5px",

                    marginBottom: "3px",

                    border: "none",

                    borderRadius: "5px",

                    backgroundColor: "#fef08a",

                    color: "#b91c1c",

                    fontSize: "16px",

                    fontWeight: 700,

                    cursor: "pointer",
                  }}
                >
                  ▤
                </button>
              )}
            </div>
          )}
        </nav>

        {/* =================================================
            USER + LOGOUT
        ================================================== */}

        <div
          style={{
            borderTop: "1px solid #374151",

            padding: collapsed ? "8px" : "10px",

            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontSize: "12px",

                color: "#9ca3af",

                marginBottom: "8px",

                padding: "0 5px",
              }}
            >
              {user.departmentName || "-"}
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Đăng xuất" : undefined}
            style={{
              width: "100%",

              padding: collapsed ? "9px 5px" : "9px 12px",

              border: "none",

              borderRadius: "5px",

              backgroundColor: "#dc2626",

              color: "#ffffff",

              fontSize: "14px",

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            {collapsed ? "↪" : "Đăng xuất"}
          </button>
        </div>
      </aside>

      <ChangePasswordModal
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
      />
    </>
  );
}

export default Sidebar;
