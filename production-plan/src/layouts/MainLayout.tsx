import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";

function MainLayout() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* MENU BÊN TRÁI - KHÔNG CUỘN THEO NỘI DUNG */}
      <Sidebar />

      {/* NỘI DUNG BÊN PHẢI - CUỘN RIÊNG */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "auto",
          backgroundColor: "#f3f4f6",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
