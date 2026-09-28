import { useAuth } from "./AuthContext";
import { hasPermission as checkPermission } from "./permissionConfig";
import type { PermissionCode } from "./permissionConfig";

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (
    permission: PermissionCode
  ): boolean => {
    if (!user) {
      return false;
    }

    return checkPermission(
      user.role,
      permission,
      user.departmentId
    );
  };

  return {
    hasPermission,
  };
}