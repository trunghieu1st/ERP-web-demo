export type DataScopeType =
  | "FACTORY"
  | "ALL";

export interface DataScope {
  scopeType: DataScopeType;

  factoryId: number | null;
  factoryName: string | null;
}

/*
 * Interface chung cho các dữ liệu
 * có phạm vi theo nhà máy.
 *
 * Ví dụ:
 * Customer
 * Supplier
 * Item
 * Contract
 * Production Plan
 * ...
 */
export interface FactoryScopedData {
  factoryId: number;
}

/*
 * Kiểm tra một record có thuộc
 * Data Scope hiện tại hay không.
 */
export function isInDataScope<
  T extends FactoryScopedData
>(
  record: T,
  scope: DataScope
): boolean {
  /*
   * ADMIN / người có quyền ALL
   */
  if (scope.scopeType === "ALL") {
    return true;
  }

  /*
   * Không có factoryId
   */
  if (scope.factoryId === null) {
    return false;
  }

  /*
   * Chỉ cho phép record
   * thuộc đúng nhà máy.
   */
  return (
    record.factoryId ===
    scope.factoryId
  );
}

/*
 * Lọc danh sách theo Data Scope.
 *
 * Đây là hàm quan trọng nhất của 7.8.
 *
 * Module nào cũng có thể dùng:
 *
 * const data = filterByDataScope(
 *   customers,
 *   scope
 * );
 */
export function filterByDataScope<
  T extends FactoryScopedData
>(
  records: T[],
  scope: DataScope
): T[] {
  /*
   * ALL → trả toàn bộ dữ liệu
   */
  if (scope.scopeType === "ALL") {
    return records;
  }

  /*
   * Không có factory → không có dữ liệu
   */
  if (scope.factoryId === null) {
    return [];
  }

  /*
   * FACTORY → lọc theo factoryId
   */
  return records.filter(
    (record) =>
      record.factoryId ===
      scope.factoryId
  );
}