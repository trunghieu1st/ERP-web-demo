// ============================================================
// PERMISSION CONFIGURATION
// ============================================================

// Danh sách các quyền trong hệ thống ERP
export type PermissionCode =
  // ----------------------------------------------------------
  // CUSTOMER
  // ----------------------------------------------------------
  | "CUSTOMER_VIEW"
  | "CUSTOMER_CREATE"
  | "CUSTOMER_EDIT"
  | "CUSTOMER_DELETE"

  // ----------------------------------------------------------
  // SUPPLIER
  // ----------------------------------------------------------
  | "SUPPLIER_VIEW"
  | "SUPPLIER_CREATE"
  | "SUPPLIER_EDIT"
  | "SUPPLIER_DELETE"

  // ----------------------------------------------------------
  // ITEM
  // ----------------------------------------------------------
  | "ITEM_VIEW"
  | "ITEM_CREATE"
  | "ITEM_EDIT"
  | "ITEM_DELETE"

  // ----------------------------------------------------------
  // CONTRACT
  // ----------------------------------------------------------
  | "CONTRACT_VIEW"
  | "CONTRACT_CREATE"
  | "CONTRACT_EDIT"
  | "CONTRACT_DELETE"

  // ----------------------------------------------------------
  // MATERIAL
  // ----------------------------------------------------------
  | "MATERIAL_VIEW"
  | "MATERIAL_CREATE"
  | "MATERIAL_EDIT"
  | "MATERIAL_DELETE"

  // ----------------------------------------------------------
  // PRODUCTION PLAN
  // ----------------------------------------------------------
  | "PRODUCTION_VIEW"
  | "PRODUCTION_CREATE"
  | "PRODUCTION_EDIT"
  | "PRODUCTION_DELETE"

  // ----------------------------------------------------------
  // PACKING LIST
  // ----------------------------------------------------------
  | "PACKING_VIEW"
  | "PACKING_CREATE"
  | "PACKING_EDIT"
  | "PACKING_DELETE"

  // ----------------------------------------------------------
  // TECHNICAL - COLOR
  // ----------------------------------------------------------
  | "COLOR_VIEW"
  | "COLOR_CREATE"
  | "COLOR_EDIT"
  | "COLOR_DELETE"

  // ----------------------------------------------------------
  // TECHNICAL - BOM
  // ----------------------------------------------------------
  | "BOM_VIEW"
  | "BOM_CREATE"
  | "BOM_EDIT"
  | "BOM_DELETE"

  // ----------------------------------------------------------
  // TECHNICAL - CUTTING
  // ----------------------------------------------------------
  | "CUTTING_VIEW"
  | "CUTTING_CREATE"
  | "CUTTING_EDIT"
  | "CUTTING_DELETE";


// ============================================================
// ROLE
// ============================================================

export type RoleCode =
  | "ADMIN"
  | "PLANNING_MANAGER"
  | "PLANNING_USER"
  | "TECHNICAL_MANAGER"
  | "TECHNICAL_USER";


// ============================================================
// DEPARTMENT PERMISSIONS
// ============================================================
//
// Giai đoạn hiện tại:
// User thuộc Department nào thì mặc định có toàn bộ
// quyền của Department đó.
//
// Department:
// 1 = Kế hoạch đơn hàng
// 2 = Kỹ thuật
//
// Sau này nếu User có cấu hình quyền riêng,
// usePermission sẽ ưu tiên quyền riêng của User.
//

export const departmentPermissions: Record<
  number,
  PermissionCode[]
> = {
  // ----------------------------------------------------------
  // DEPARTMENT 1 - KẾ HOẠCH ĐƠN HÀNG
  // ----------------------------------------------------------

  1: [
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",
    "CUSTOMER_DELETE",

    "SUPPLIER_VIEW",
    "SUPPLIER_CREATE",
    "SUPPLIER_EDIT",
    "SUPPLIER_DELETE",

    "ITEM_VIEW",
    "ITEM_CREATE",
    "ITEM_EDIT",
    "ITEM_DELETE",

    "CONTRACT_VIEW",
    "CONTRACT_CREATE",
    "CONTRACT_EDIT",
    "CONTRACT_DELETE",

    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_EDIT",
    "MATERIAL_DELETE",

    "PRODUCTION_VIEW",
    "PRODUCTION_CREATE",
    "PRODUCTION_EDIT",
    "PRODUCTION_DELETE",

    "PACKING_VIEW",
    "PACKING_CREATE",
    "PACKING_EDIT",
    "PACKING_DELETE",
  ],

  // ----------------------------------------------------------
  // DEPARTMENT 2 - KỸ THUẬT
  // ----------------------------------------------------------

  2: [
    "COLOR_VIEW",
    "COLOR_CREATE",
    "COLOR_EDIT",
    "COLOR_DELETE",

    "BOM_VIEW",
    "BOM_CREATE",
    "BOM_EDIT",
    "BOM_DELETE",

    "CUTTING_VIEW",
    "CUTTING_CREATE",
    "CUTTING_EDIT",
    "CUTTING_DELETE",
  ],
};


// ============================================================
// ROLE PERMISSIONS
// ============================================================
//
// Giữ lại kiến trúc Role để sử dụng ở giai đoạn sau.
//
// Hiện tại Role chưa quyết định quyền mặc định.
// Quyền mặc định được xác định theo Department.
//

export const rolePermissions: Record<
  RoleCode,
  PermissionCode[]
> = {
  ADMIN: [
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",
    "CUSTOMER_DELETE",

    "SUPPLIER_VIEW",
    "SUPPLIER_CREATE",
    "SUPPLIER_EDIT",
    "SUPPLIER_DELETE",

    "ITEM_VIEW",
    "ITEM_CREATE",
    "ITEM_EDIT",
    "ITEM_DELETE",

    "CONTRACT_VIEW",
    "CONTRACT_CREATE",
    "CONTRACT_EDIT",
    "CONTRACT_DELETE",

    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_EDIT",
    "MATERIAL_DELETE",

    "PRODUCTION_VIEW",
    "PRODUCTION_CREATE",
    "PRODUCTION_EDIT",
    "PRODUCTION_DELETE",

    "PACKING_VIEW",
    "PACKING_CREATE",
    "PACKING_EDIT",
    "PACKING_DELETE",

    "COLOR_VIEW",
    "COLOR_CREATE",
    "COLOR_EDIT",
    "COLOR_DELETE",

    "BOM_VIEW",
    "BOM_CREATE",
    "BOM_EDIT",
    "BOM_DELETE",

    "CUTTING_VIEW",
    "CUTTING_CREATE",
    "CUTTING_EDIT",
    "CUTTING_DELETE",
  ],

  PLANNING_MANAGER: [
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",
    "CUSTOMER_DELETE",

    "SUPPLIER_VIEW",
    "SUPPLIER_CREATE",
    "SUPPLIER_EDIT",
    "SUPPLIER_DELETE",

    "ITEM_VIEW",
    "ITEM_CREATE",
    "ITEM_EDIT",
    "ITEM_DELETE",

    "CONTRACT_VIEW",
    "CONTRACT_CREATE",
    "CONTRACT_EDIT",
    "CONTRACT_DELETE",

    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_EDIT",
    "MATERIAL_DELETE",

    "PRODUCTION_VIEW",
    "PRODUCTION_CREATE",
    "PRODUCTION_EDIT",
    "PRODUCTION_DELETE",

    "PACKING_VIEW",
    "PACKING_CREATE",
    "PACKING_EDIT",
    "PACKING_DELETE",
  ],

  PLANNING_USER: [
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",

    "SUPPLIER_VIEW",
    "SUPPLIER_CREATE",
    "SUPPLIER_EDIT",

    "ITEM_VIEW",
    "ITEM_CREATE",
    "ITEM_EDIT",

    "CONTRACT_VIEW",
    "CONTRACT_CREATE",
    "CONTRACT_EDIT",

    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_EDIT",

    "PRODUCTION_VIEW",
    "PRODUCTION_CREATE",
    "PRODUCTION_EDIT",

    "PACKING_VIEW",
    "PACKING_CREATE",
    "PACKING_EDIT",
  ],

  TECHNICAL_MANAGER: [
    "COLOR_VIEW",
    "COLOR_CREATE",
    "COLOR_EDIT",
    "COLOR_DELETE",

    "BOM_VIEW",
    "BOM_CREATE",
    "BOM_EDIT",
    "BOM_DELETE",

    "CUTTING_VIEW",
    "CUTTING_CREATE",
    "CUTTING_EDIT",
    "CUTTING_DELETE",
  ],

  TECHNICAL_USER: [
    "COLOR_VIEW",
    "COLOR_CREATE",
    "COLOR_EDIT",

    "BOM_VIEW",
    "BOM_CREATE",
    "BOM_EDIT",

    "CUTTING_VIEW",
    "CUTTING_CREATE",
    "CUTTING_EDIT",
  ],
};


// ============================================================
// CHECK PERMISSION
// ============================================================
//
// Hiện tại:
//   Department quyết định quyền mặc định.
//
// Sau này:
//   Nếu User có quyền riêng -> hàm này sẽ kiểm tra quyền riêng
//   trước, không cần sửa Sidebar hoặc ProtectedRoute.
//

export function hasPermission(
  role: RoleCode,
  permission: PermissionCode,
  departmentId?: number
): boolean {

  // ----------------------------------------------------------
  // Giai đoạn hiện tại: ưu tiên Department
  // ----------------------------------------------------------

  if (departmentId !== undefined) {
    return (
      departmentPermissions[departmentId]?.includes(
        permission
      ) ?? false
    );
  }

  // ----------------------------------------------------------
  // Fallback theo Role
  // ----------------------------------------------------------

  return (
    rolePermissions[role]?.includes(permission) ??
    false
  );
}