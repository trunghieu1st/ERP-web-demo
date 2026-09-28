export type PwaDepartmentConfig = {
  departmentId: number;
  code: string;
  name: string;
  path: string;
};

export const pwaDepartments: PwaDepartmentConfig[] = [
  {
    departmentId: 14,
    code: "KHDH.PWA",
    name: "KẾ HOẠCH ĐƠN HÀNG",
    path: "/pwa/khdh",
  },
  {
    departmentId: 15,
    code: "KT.PWA",
    name: "KỸ THUẬT",
    path: "/pwa/kt",
  },
  {
    departmentId: 16,
    code: "KHONPL.PWA",
    name: "KHO NGUYÊN PHỤ LIỆU",
    path: "/pwa/khonpl",
  },
  {
    departmentId: 17,
    code: "TC.PWA",
    name: "TỔ CẮT",
    path: "/pwa/tc",
  },
  {
    departmentId: 18,
    code: "PX.PWA",
    name: "PHÂN XƯỞNG",
    path: "/pwa/px",
  },
  {
    departmentId: 19,
    code: "HT.PWA",
    name: "HOÀN THIỆN",
    path: "/pwa/ht",
  },
  {
    departmentId: 20,
    code: "KTTC.PWA",
    name: "KẾ TOÁN TÀI CHÍNH",
    path: "/pwa/kttc",
  },
  {
    departmentId: 21,
    code: "IE.PWA",
    name: "IE",
    path: "/pwa/ie",
  },
  {
    departmentId: 22,
    code: "QLTB.PWA",
    name: "QUẢN LÝ THIẾT BỊ",
    path: "/pwa/qltb",
  },
  {
    departmentId: 23,
    code: "HCNS.PWA",
    name: "HÀNH CHÍNH NHÂN SỰ",
    path: "/pwa/hcns",
  },
  {
    departmentId: 24,
    code: "QA.PWA",
    name: "QA",
    path: "/pwa/qa",
  },
  {
    departmentId: 25,
    code: "BGD.PWA",
    name: "BAN GIÁM ĐỐC",
    path: "/pwa/bgd",
  },
  {
    departmentId: 26,
    code: "IT.PWA",
    name: "CÔNG NGHỆ THÔNG TIN",
    path: "/pwa/it",
  },
];

export function getPwaDepartment(
  departmentId: number
): PwaDepartmentConfig | undefined {
  return pwaDepartments.find(
    (department) =>
      department.departmentId === departmentId
  );
}