export type MenuItem = {
  id: string;
  name: string;
  path: string;
};

export type DepartmentMenu = {
  departmentId: number;
  code: string;
  name: string;
  items: MenuItem[];
};

/* =========================================================
   QUẢN TRỊ HỆ THỐNG
========================================================= */

export const systemMenu: MenuItem[] = [
  {
    id: "user",
    name: "Thông tin người dùng",
    path: "/system/user",
  },
  {
    id: "factory",
    name: "Thông tin nhà máy",
    path: "/system/factories",
  },
  {
    id: "department",
    name: "Thông tin phòng ban",
    path: "/system/departments",
  },
  {
    id: "production-line",
    name: "Thông tin chuyền sản xuất",
    path: "/system/production-lines",
  },
  {
    id: "user-production-line",
    name: "Phân công người dùng - chuyền",
    path: "/system/user-production-lines",
  },
  {
    id: "report",
    name: "Danh sách báo cáo",
    path: "/system/reports",
  },
  {
    id: "factory-reports",
    name: "Phân quyền báo cáo cho nhà máy",
    path: "/system/factory-reports",
  },
  {
    id: "department-reports",
    name: "Phân quyền báo cáo cho phòng ban",
    path: "/system/department-reports",
  },
];

/* =========================================================
   CÁC PHÒNG BAN WEB
========================================================= */

export const departments: DepartmentMenu[] = [
  /* =======================================================
     1. KẾ HOẠCH ĐƠN HÀNG
     ĐÃ CÓ MENU
  ======================================================= */
  {
    departmentId: 1,
    code: "KHDH",
    name: "KẾ HOẠCH ĐƠN HÀNG",

    items: [
      {
        id: "customer",
        name: "Thông tin khách hàng",
        path: "/planning/customer",
      },
      {
        id: "supplier",
        name: "Thông tin nhà cung cấp",
        path: "/planning/supplier",
      },
      {
        id: "item",
        name: "Tạo mã hàng, mã nguyên phụ liệu",
        path: "/planning/item",
      },
      {
        id: "material",
        name: "Bảng tập hợp nguyên phụ liệu",
        path: "/planning/material",
      },
      {
        id: "price-list",
        name: "Bảng giá",
        path: "/planning/price_list",
      },
      {
        id: "contract",
        name: "Thông tin hợp đồng/mùa hàng",
        path: "/planning/contract",
      },      
      {
        id: "sale-order",
        name: "Kế hoạch sản xuất",
        path: "/planning/sale_order",
      },
      {
        id: "packing",
        name: "Thông tin Packing list",
        path: "/planning/packing",
      },      
    ],
  },

  /* =======================================================
     2. KỸ THUẬT
     ĐÃ CÓ MENU
  ======================================================= */
  {
    departmentId: 2,
    code: "KT",
    name: "KỸ THUẬT",

    items: [
      {
        id: "color",
        name: "Bảng phối màu",
        path: "/technical/color",
      },
      {
        id: "bom",
        name: "Cập nhật định mức",
        path: "/technical/bom",
      },
      {
        id: "cutting",
        name: "Tác nghiệp cắt",
        path: "/technical/cutting",
      },
    ],
  },

  /* =======================================================
     3. KHO NGUYÊN PHỤ LIỆU
  ======================================================= */
  {
    departmentId: 3,
    code: "KHONPL",
    name: "KHO NGUYÊN PHỤ LIỆU",

    items: [
      {
        id: "receipt",
        name: "Chứng từ nhập kho",
        path: "/khonpl/receipt",
      },
    ],
  },

  /* =======================================================
     4. TỔ CẮT
  ======================================================= */
  {
    departmentId: 4,
    code: "TC",
    name: "TỔ CẮT",

    items: [],
  },

  /* =======================================================
     5. PHÂN XƯỞNG
  ======================================================= */
  {
    departmentId: 5,
    code: "PX",
    name: "PHÂN XƯỞNG",

    items: [],
  },

  /* =======================================================
     6. HOÀN THIỆN
  ======================================================= */
  {
    departmentId: 6,
    code: "HT",
    name: "HOÀN THIỆN",

    items: [],
  },

  /* =======================================================
     7. KẾ TOÁN TÀI CHÍNH
  ======================================================= */
  {
    departmentId: 7,
    code: "KTTC",
    name: "KẾ TOÁN TÀI CHÍNH",

    items: [],
  },

  /* =======================================================
     8. IE
  ======================================================= */
  {
    departmentId: 8,
    code: "IE",
    name: "IE",

    items: [],
  },

  /* =======================================================
     9. QUẢN LÝ THIẾT BỊ
  ======================================================= */
  {
    departmentId: 9,
    code: "QLTB",
    name: "QUẢN LÝ THIẾT BỊ",

    items: [],
  },

  /* =======================================================
     10. HÀNH CHÍNH NHÂN SỰ
  ======================================================= */
  {
    departmentId: 10,
    code: "HCNS",
    name: "HÀNH CHÍNH NHÂN SỰ",

    items: [],
  },

  /* =======================================================
     11. QA
  ======================================================= */
  {
    departmentId: 11,
    code: "QA",
    name: "QA",

    items: [],
  },

  /* =======================================================
     12. BAN GIÁM ĐỐC
  ======================================================= */
  {
    departmentId: 12,
    code: "BGD",
    name: "BAN GIÁM ĐỐC",

    items: [],
  },

  /* =======================================================
     13. CÔNG NGHỆ THÔNG TIN
     IT
  ======================================================= */
  {
    departmentId: 13,
    code: "IT",
    name: "CÔNG NGHỆ THÔNG TIN",

    items: [],
  },
  /*{
    departmentId: 99,
    code: "REPORT",
    name: "DANH MỤC BÁO CÁO",

    items: [
      {
        id: "export-production-line",
        name: "Xuất báo cáo chuyền sản xuất",
        path: "/report/production_line",
      },
    ],
  },*/
];
