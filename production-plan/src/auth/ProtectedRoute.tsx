import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  departmentId?: number;
};

function ProtectedRoute({
  departmentId,
}: ProtectedRouteProps) {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  // =====================================================
  // CHƯA ĐĂNG NHẬP
  // =====================================================

  if (
    !isAuthenticated ||
    !user
  ) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // =====================================================
  // FULL ACCESS
  // =====================================================
  //
  // ADMIN:
  //   -> toàn bộ hệ thống
  //
  // IT - DEPARTMENT_ID = 13:
  //   -> toàn bộ hệ thống
  //
  // Không sử dụng Permission nữa.
  // =====================================================

  const isFullAccess =
    user.role?.trim().toUpperCase() ===
      "ADMIN" ||
    Number(user.departmentId) === 13;

  if (isFullAccess) {
    return <Outlet />;
  }

  // =====================================================
  // KIỂM TRA DEPARTMENT
  // =====================================================
  //
  // User bình thường chỉ được vào chức năng
  // thuộc Department của mình.
  // =====================================================

  if (
    departmentId !== undefined &&
    Number(user.departmentId) !==
      Number(departmentId)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  // =====================================================
  // ĐƯỢC PHÉP TRUY CẬP
  // =====================================================

  return <Outlet />;
}

export default ProtectedRoute;