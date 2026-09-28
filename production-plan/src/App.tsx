import PwaDepartmentPage from "./pages/PWA/PwaDepartmentPage";

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";

import ProtectedRoute from "./auth/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";
import PWALayout from "./layouts/pwa/PWALayout";

import LoginPage from "./pages/Login/LoginPage";
import HomePage from "./pages/Home/HomePage";

import CustomerPage from "./modules/planning/customer/CustomerPage";
import UserPage from "./modules/system/user/UserPage";
import FactoryPage from "./modules/system/factories/FactoryPage";
import DepartmentPage from "./modules/system/departments/DepartmentPage";
import ProductionLinePage from "./modules/system/production-lines/ProductionLinePage";
import UserProductionLinePage from "./modules/system/user-production-lines/UserProductionLinePage";
import ReportPage from "./modules/system/reports/ReportPage";

import FactoryReportPage from "./modules/system/factory-reports/FactoryReportPage";

import DepartmentReportPage from "./modules/system/department-reports/DepartmentReportPage";

import SupplierPage from "./modules/planning/supplier/SupplierPage";
import ItemPage from "./modules/planning/item/ItemPage";

import ExportProductionLinePage from "./modules/report/production_line/ExportProductionLinePage";

import { BackgroundQueryProvider } from "./background-query/BackgroundQueryContext";

import BackgroundQueryNotification from "./background-query/BackgroundQueryNotification";

import { ExportJobProvider } from "./export-jobs/ExportJobContext";

import ExportJobNotification from "./export-jobs/ExportJobNotification";

import SalesAgreementPage from "./modules/planning/contract/SalesAgreementPage";

import ProductionPlanningPage from "./modules/planning/sale_order/ProductionPlanningPage";

// ==========================================================
// UNAUTHORIZED
// ==========================================================

function UnauthorizedPage() {
  return (
    <div
      style={{
        padding: "40px",
        fontSize: "20px",
      }}
    >
      Bạn không có quyền truy cập chức năng này.
    </div>
  );
}

// ==========================================================
// PROTECTED ADMIN ROUTE
//
// ADMIN hoặc IT (DEPARTMENT_ID = 13)
// được truy cập khu vực Quản trị hệ thống.
// ==========================================================

function ProtectedAdminRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFullAccess =
    user.role?.trim().toUpperCase() === "ADMIN" ||
    Number(user.departmentId) === 13;

  if (!isFullAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// ==========================================================
// WEB LAYOUT
// ==========================================================

function WebLayoutRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu tài khoản là PWA mà cố truy cập
  // route WEB thì đưa về màn hình PWA.
  if (user.interfaceType === "PWA") {
    return <Navigate to="/pwa" replace />;
  }

  return <MainLayout />;
}

// ==========================================================
// PWA LAYOUT
// ==========================================================

function PwaLayoutRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu tài khoản là WEB mà cố truy cập PWA
  // thì đưa về màn hình WEB.
  if (user.interfaceType !== "PWA") {
    return <Navigate to="/home" replace />;
  }

  return <PWALayout />;
}

// ==========================================================
// APP
// ==========================================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BackgroundQueryProvider>
          <ExportJobProvider>
            <Routes>
              {/* ==================================================
              LOGIN
             ================================================== */}

              <Route path="/login" element={<LoginPage />} />

              {/* ==================================================
              ROOT
             ================================================== */}

              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ==================================================
              KHU VỰC ĐÃ ĐĂNG NHẬP
             ================================================== */}

              <Route element={<ProtectedRoute />}>
                {/* ==================================================
                WEB
               ================================================== */}

                <Route element={<WebLayoutRoute />}>
                  {/* ==================================================
                  MÀN HÌNH CHÍNH
                 ================================================== */}

                  <Route path="/home" element={<HomePage />} />

                  {/* ==================================================
                  QUẢN TRỊ HỆ THỐNG

                  ADMIN hoặc DEPARTMENT_ID = 13
                 ================================================== */}

                  <Route element={<ProtectedAdminRoute />}>
                    {/* =========================
                    QUẢN LÝ USER
                   ========================= */}

                    <Route path="/system/user" element={<UserPage />} />

                    {/* =========================
                    THÔNG TIN NHÀ MÁY
                   ========================= */}

                    <Route path="/system/factories" element={<FactoryPage />} />

                    {/* =========================
                    THÔNG TIN PHÒNG BAN
                   ========================= */}

                    <Route
                      path="/system/departments"
                      element={<DepartmentPage />}
                    />

                    {/* =========================
                    THÔNG TIN CHUYỀN SẢN XUẤT
                   ========================= */}

                    <Route
                      path="/system/production-lines"
                      element={<ProductionLinePage />}
                    />

                    {/* =========================
                    PHÂN CHUYỀN SX CHO USER
                   ========================= */}

                    <Route
                      path="/system/user-production-lines"
                      element={<UserProductionLinePage />}
                    />

                    <Route path="/system/reports" element={<ReportPage />} />

                    <Route
                      path="/system/factory-reports"
                      element={<FactoryReportPage />}
                    />

                    <Route
                      path="/system/department-reports"
                      element={<DepartmentReportPage />}
                    />
                  </Route>

                  {/* ==================================================
                  KẾ HOẠCH ĐƠN HÀNG
                  Department ID = 1
                 ================================================== */}

                  <Route element={<ProtectedRoute departmentId={1} />}>
                    {/* =========================
                    KHÁCH HÀNG
                   ========================= */}

                    <Route
                      path="/planning/customer"
                      element={<CustomerPage />}
                    />

                    <Route
                      path="/planning/contract"
                      element={<SalesAgreementPage />}
                    />

                    {/* =========================
                    NHÀ CUNG CẤP
                   ========================= */}

                    <Route
                      path="/planning/supplier"
                      element={<SupplierPage />}
                    />

                    {/* =========================
                    MÃ HÀNG / NPL
                   ========================= */}

                    <Route path="/planning/item" element={<ItemPage />} />

                    <Route
                      path="/planning/sale_order"
                      element={<ProductionPlanningPage />}
                    />

                    {/* =========================
                    HỢP ĐỒNG / MÙA HÀNG
                   ========================= */}

                    {/* 
                <Route
                  path="/planning/contract"
                  element={<ContractPage />}
                />
                */}

                    {/* =========================
                    NGUYÊN PHỤ LIỆU
                   ========================= */}

                    {/* 
                <Route
                  path="/planning/material"
                  element={<MaterialPage />}
                />
                */}

                    {/* =========================
                    KẾ HOẠCH SẢN XUẤT
                   ========================= */}

                    {/* 
                <Route
                  path="/planning/production"
                  element={<ProductionPage />}
                />
                */}

                    {/* =========================
                    PACKING LIST
                   ========================= */}

                    {/* 
                <Route
                  path="/planning/packing"
                  element={<PackingPage />}
                />
                */}
                  </Route>

                  {/* ==================================================
                  KỸ THUẬT
                  Department ID = 2
                 ================================================== */}

                  <Route element={<ProtectedRoute departmentId={2} />}>
                    {/* =========================
                    BẢNG PHỐI MÀU
                   ========================= */}

                    {/* 
                <Route
                  path="/technical/color"
                  element={<ColorPage />}
                />
                */}

                    {/* =========================
                    ĐỊNH MỨC
                   ========================= */}

                    {/* 
                <Route
                  path="/technical/bom"
                  element={<BomPage />}
                />
                */}

                    {/* =========================
                    TÁC NGHIỆP CẮT
                   ========================= */}

                    {/* 
                <Route
                  path="/technical/cutting"
                  element={<CuttingPage />}
                />
                */}
                  </Route>

                  {/* ==================================================
                  KHO NPL
                  Department ID = 3
                 ================================================== */}

                  <Route element={<ProtectedRoute departmentId={3} />}>
                    {/* =========================
                    CHỨNG TỪ NHẬP KHO
                   ========================= */}

                    {/* 
                <Route
                  path="/khonpl/receipt"
                  element={<receiptpage />}
                />
                */}
                  </Route>

                  {/* Muc Report*/}
                  <Route element={<ProtectedRoute departmentId={99} />}>
                    <Route
                      path="/report/production_line"
                      element={<ExportProductionLinePage />}
                    />
                  </Route>
                </Route>

                {/* ==================================================
                PWA
               ================================================== */}

                <Route element={<PwaLayoutRoute />}>
                  {/* =========================
                  PWA HOME
                 ========================= */}

                  <Route path="/pwa" element={<PwaDepartmentPage />} />
                </Route>
              </Route>

              {/* ==================================================
              KHÔNG CÓ QUYỀN
             ================================================== */}

              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* ==================================================
              ROUTE KHÔNG TỒN TẠI
             ================================================== */}

              <Route
                path="*"
                element={
                  <div
                    style={{
                      padding: "40px",
                      fontSize: "20px",
                    }}
                  >
                    Trang không tồn tại.
                  </div>
                }
              />
            </Routes>

            {/* Notification */}
            <BackgroundQueryNotification />
            <ExportJobNotification />
            {/* End Notification */}
          </ExportJobProvider>
        </BackgroundQueryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
