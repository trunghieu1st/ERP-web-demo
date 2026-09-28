import { useCallback } from "react";

import { useAuth } from "./AuthContext";

import {
  filterByDataScope,
} from "./dataScope";

import type {
  DataScope,
  FactoryScopedData,
} from "./dataScope";

export function useDataScope(): DataScope {
  const { user } = useAuth();

  /*
   * Chưa đăng nhập
   */
  if (!user) {
    return {
      scopeType: "FACTORY",
      factoryId: null,
      factoryName: null,
    };
  }

  /*
   * Data Scope hiện tại của user
   */
  return {
    scopeType: "FACTORY",
    factoryId: user.factoryId,
    factoryName: user.factoryName,
  };
}

/*
 * Hook dùng chung cho các module
 * có Data Scope theo nhà máy.
 */
export function useDataScopeData() {
  const scope = useDataScope();

  /*
   * Lọc dữ liệu theo Data Scope.
   *
   * Module chỉ cần:
   *
   * const { filterData } =
   *   useDataScopeData();
   *
   * const data =
   *   filterData(customers);
   */
  const filterData = useCallback(
    <T extends FactoryScopedData>(
      records: T[]
    ): T[] => {
      return filterByDataScope(
        records,
        scope
      );
    },
    [
      scope.scopeType,
      scope.factoryId,
    ]
  );

  return {
    scope,
    filterData,
  };
}