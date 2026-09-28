import { useEffect, useState } from "react";

import { useAuth } from "../../../auth/AuthContext";

import { apiFetch } from "../../../api/apiClient";

type User = {
  userId: number;

  username: string;

  fullName: string;

  factoryId: number | null;

  factoryName: string;

  departmentId: number | null;

  departmentName: string;

  interfaceType: "WEB" | "PWA";

  role: string;

  roleName: string;

  isActive: boolean;
};

type Factory = {
  factoryId: number;

  factoryCode: string;

  factoryName: string;
};

type Department = {
  departmentId: number;

  departmentCode: string;

  departmentName: string;

  interfaceType: "WEB" | "PWA";
};

type Role = {
  roleCode: string;

  roleName: string;
};

type UserForm = {
  username: string;

  password: string;

  fullName: string;

  factoryId: string;

  departmentId: string;

  roleCode: string;

  isActive: boolean;
};

const emptyForm: UserForm = {
  username: "",

  password: "",

  fullName: "",

  factoryId: "",

  departmentId: "",

  roleCode: "",

  isActive: true,
};

function UserPage() {
  const { user: currentUser, updateUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);

  const [factories, setFactories] = useState<Factory[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<UserForm>(emptyForm);

  const isEditing = editingId !== null;

  // =====================================================

  // LOAD USERS

  // =====================================================

  const loadUsers = async (): Promise<User[]> => {
    const response = await apiFetch("/api/users");

    if (!response.ok) {
      throw new Error(
        `Không thể tải danh sách người dùng. HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    setUsers(data);

    return data;
  };

  // =====================================================

  // LOAD FACTORIES

  // =====================================================

  const loadFactories = async () => {
    const response = await apiFetch("/api/factories");

    if (!response.ok) {
      throw new Error(
        `Không thể tải danh sách Factory. HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    setFactories(data);
  };

  // =====================================================

  // LOAD DEPARTMENTS

  // =====================================================

  const loadDepartments = async () => {
    const response = await apiFetch("/api/departments");

    if (!response.ok) {
      throw new Error(
        `Không thể tải danh sách Department. HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    setDepartments(data);
  };

  // =====================================================

  // LOAD ROLES

  // =====================================================

  const loadRoles = async () => {
    const response = await apiFetch("/api/roles");

    if (!response.ok) {
      throw new Error(`Không thể tải danh sách Role. HTTP ${response.status}`);
    }

    const data = await response.json();

    setRoles(data);
  };

  // =====================================================

  // LOAD ALL DATA

  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);

      setError("");

      await Promise.all([
        loadUsers(),

        loadFactories(),

        loadDepartments(),

        loadRoles(),
      ]);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================

  // OPEN CREATE

  // =====================================================

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,

      factoryId: factories.length > 0 ? String(factories[0].factoryId) : "",

      departmentId:
        departments.length > 0 ? String(departments[0].departmentId) : "",

      roleCode: roles.length > 0 ? roles[0].roleCode : "",
    });

    setError("");

    setShowForm(true);
  };

  // =====================================================

  // OPEN EDIT

  // =====================================================

  const handleEdit = (user: User) => {
    setEditingId(user.userId);

    setForm({
      username: user.username,

      password: "",

      fullName: user.fullName,

      factoryId: user.factoryId !== null ? String(user.factoryId) : "",

      departmentId: user.departmentId !== null ? String(user.departmentId) : "",

      roleCode: user.role ?? "",

      isActive: user.isActive,
    });

    setError("");

    setShowForm(true);
  };

  // =====================================================

  // CLOSE FORM

  // =====================================================

  const handleCancel = () => {
    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingId(null);

    setForm(emptyForm);

    setError("");
  };

  // =====================================================

  // FORM CHANGE

  // =====================================================

  const updateForm = (field: keyof UserForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  };

  // =====================================================

  // SAVE

  // =====================================================

  const handleSave = async () => {
    setError("");

    if (!form.username.trim()) {
      setError("Username không được để trống.");

      return;
    }

    if (!isEditing && !form.password.trim()) {
      setError("Password không được để trống khi tạo người dùng.");

      return;
    }

    if (form.password && form.password.length < 6) {
      setError("Password mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Họ tên không được để trống.");

      return;
    }

    if (!form.factoryId) {
      setError("Phải chọn Factory.");

      return;
    }

    if (!form.departmentId) {
      setError("Phải chọn Department.");

      return;
    }

    if (!form.roleCode) {
      setError("Phải chọn Role.");

      return;
    }

    try {
      setSaving(true);

      let response: Response;

      // =================================================

      // UPDATE

      // =================================================

      if (isEditing) {
        response = await apiFetch(`/api/users/${editingId}`, {
          method: "PUT",

          body: JSON.stringify({
            password: form.password.trim() || null,

            fullName: form.fullName.trim(),

            factoryId: Number(form.factoryId),

            departmentId: Number(form.departmentId),

            roleCode: form.roleCode,

            isActive: form.isActive,
          }),
        });
      }

      // =================================================

      // CREATE

      // =================================================
      else {
        response = await apiFetch("/api/users", {
          method: "POST",

          body: JSON.stringify({
            username: form.username.trim(),

            password: form.password,

            fullName: form.fullName.trim(),

            factoryId: Number(form.factoryId),

            departmentId: Number(form.departmentId),

            roleCode: form.roleCode,

            isActive: form.isActive,
          }),
        });
      }

      // =================================================

      // API RESULT

      // =================================================

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ?? `Lưu người dùng thất bại. HTTP ${response.status}`,
        );
      }

      // =================================================

      // ĐỌC LẠI DANH SÁCH USER

      // =================================================

      const updatedUsers = await loadUsers();

      // =================================================

      // CẬP NHẬT AUTH CONTEXT

      // =================================================

      /*

       \* Chỉ cập nhật AuthContext nếu user vừa sửa

       \* chính là user đang đăng nhập.

       */

      if (isEditing && editingId === currentUser?.userId) {
        const updatedCurrentUser = updatedUsers.find(
          (item) => item.userId === currentUser.userId,
        );

        if (updatedCurrentUser) {
          /*

           \* Chuyển dữ liệu API User

           \* sang đúng kiểu User của AuthContext.

           */

          if (
            updatedCurrentUser.factoryId !== null &&
            updatedCurrentUser.departmentId !== null
          ) {
            updateUser({
              userId: updatedCurrentUser.userId,

              username: updatedCurrentUser.username,

              fullName: updatedCurrentUser.fullName,

              factoryId: updatedCurrentUser.factoryId,

              factoryName: updatedCurrentUser.factoryName,

              departmentId: updatedCurrentUser.departmentId,

              departmentName: updatedCurrentUser.departmentName,

              /*

               \* InterfaceType lấy từ API User

               \* nếu API đã trả về.

               \*

               \* Nếu API users hiện tại chưa trả

               \* interfaceType thì giữ nguyên

               \* interfaceType của user đang đăng nhập.

               */

              interfaceType:
                updatedCurrentUser.interfaceType ?? currentUser.interfaceType,

              role: updatedCurrentUser.role as typeof currentUser.role,

              roleName: updatedCurrentUser.roleName,
            });
          }
        }
      }

      // =================================================

      // CLOSE FORM

      // =================================================

      setShowForm(false);

      setEditingId(null);

      setForm(emptyForm);

      alert(
        isEditing
          ? "Cập nhật người dùng thành công."
          : "Tạo người dùng thành công.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Không thể lưu người dùng.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================

  // DELETE

  // =====================================================

  const handleDelete = async (user: User) => {
    if (user.username === "admin") {
      alert("Không được xóa tài khoản admin.");

      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa người dùng "${user.username}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await apiFetch(`/api/users/${user.userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ?? `Xóa người dùng thất bại. HTTP ${response.status}`,
        );
      }

      await loadUsers();

      alert("Xóa người dùng thành công.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Không thể xóa người dùng.",
      );
    }
  };

  // =====================================================

  // RENDER

  // =====================================================

  return (
    <div
      style={{
        padding: "24px",

        minWidth: "900px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,

              fontSize: "24px",
            }}
          >
            Quản lý người dùng
          </h1>

          <div
            style={{
              marginTop: "6px",

              color: "#6b7280",

              fontSize: "14px",
            }}
          >
            Quản lý tài khoản người dùng trong hệ thống ERP
          </div>
        </div>

        <button
          onClick={handleAdd}
          style={{
            padding: "10px 16px",

            backgroundColor: "#2563eb",

            color: "white",

            border: "none",

            borderRadius: "6px",

            cursor: "pointer",

            fontSize: "14px",

            fontWeight: 600,
          }}
        >
          + Thêm người dùng
        </button>
      </div>

      {/* ERROR */}

      {error && !showForm && (
        <div
          style={{
            marginBottom: "16px",

            padding: "12px 14px",

            backgroundColor: "#fee2e2",

            color: "#991b1b",

            border: "1px solid #fecaca",

            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div
          style={{
            padding: "30px",

            textAlign: "center",
          }}
        >
          Đang tải dữ liệu...
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",

            borderRadius: "8px",

            overflow: "hidden",

            border: "1px solid #e5e7eb",
          }}
        >
          <table
            style={{
              width: "100%",

              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                }}
              >
                <th style={thStyle}>STT</th>

                <th style={thStyle}>Username</th>

                <th style={thStyle}>Họ tên</th>

                <th style={thStyle}>Factory</th>

                <th style={thStyle}>Department</th>

                <th style={thStyle}>Role</th>

                <th style={thStyle}>Trạng thái</th>

                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "30px",

                      textAlign: "center",

                      color: "#6b7280",
                    }}
                  >
                    Chưa có người dùng.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.userId}
                    style={{
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <td style={tdStyle}>{index + 1}</td>

                    <td style={tdStyle}>
                      <strong>{user.username}</strong>
                    </td>

                    <td style={tdStyle}>{user.fullName}</td>

                    <td style={tdStyle}>{user.factoryName}</td>

                    <td style={tdStyle}>{user.departmentName}</td>

                    <td style={tdStyle}>{user.roleName}</td>

                    <td style={tdStyle}>
                      {user.isActive ? (
                        <span
                          style={{
                            color: "#166534",

                            fontWeight: 600,
                          }}
                        >
                          Đang hoạt động
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#991b1b",

                            fontWeight: 600,
                          }}
                        >
                          Khóa
                        </span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",

                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleEdit(user)}
                          style={editButtonStyle}
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          disabled={user.username === "admin"}
                          style={{
                            ...deleteButtonStyle,

                            opacity: user.username === "admin" ? 0.4 : 1,

                            cursor:
                              user.username === "admin"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            backgroundColor: "rgba(0, 0, 0, 0.45)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "520px",

              maxWidth: "calc(100vw - 40px)",

              backgroundColor: "white",

              borderRadius: "10px",

              padding: "24px",

              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                marginTop: 0,

                marginBottom: "20px",
              }}
            >
              {isEditing ? "Sửa người dùng" : "Thêm người dùng"}
            </h2>

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px 12px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* USERNAME */}

            <label style={labelStyle}>Username</label>

            <input
              value={form.username}
              disabled={isEditing}
              onChange={(e) => updateForm("username", e.target.value)}
              style={{
                ...inputStyle,

                backgroundColor: isEditing ? "#f3f4f6" : "white",
              }}
            />

            {/* PASSWORD */}

            <label style={labelStyle}>
              Password
              {isEditing && " (để trống nếu không đổi)"}
            </label>

            <input
              type="password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              style={inputStyle}
            />

            {/* FULL NAME */}

            <label style={labelStyle}>Họ tên</label>

            <input
              value={form.fullName}
              onChange={(e) => updateForm("fullName", e.target.value)}
              style={inputStyle}
            />

            {/* FACTORY */}

            <label style={labelStyle}>Factory</label>

            <select
              value={form.factoryId}
              onChange={(e) => updateForm("factoryId", e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Chọn Factory --</option>

              {factories.map((factory) => (
                <option key={factory.factoryId} value={factory.factoryId}>
                  {factory.factoryCode} - {factory.factoryName}
                </option>
              ))}
            </select>

            {/* DEPARTMENT */}

            <label style={labelStyle}>Department</label>

            <select
              value={form.departmentId}
              onChange={(e) => updateForm("departmentId", e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Chọn Department --</option>

              {departments.map((department) => (
                <option
                  key={department.departmentId}
                  value={department.departmentId}
                >
                  {department.departmentCode} - {department.departmentName}
                </option>
              ))}
            </select>

            {/* ROLE */}

            <label style={labelStyle}>Role</label>

            <select
              value={form.roleCode}
              onChange={(e) => updateForm("roleCode", e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Chọn Role --</option>

              {roles.map((role) => (
                <option key={role.roleCode} value={role.roleCode}>
                  {role.roleCode} - {role.roleName}
                </option>
              ))}
            </select>

            {/* ACTIVE */}

            <label
              style={{
                display: "flex",

                alignItems: "center",

                gap: "8px",

                marginTop: "16px",

                marginBottom: "20px",

                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateForm("isActive", e.target.checked)}
              />
              Đang hoạt động
            </label>

            {/* BUTTONS */}

            <div
              style={{
                display: "flex",

                justifyContent: "flex-end",

                gap: "10px",
              }}
            >
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: "10px 16px",

                  border: "1px solid #d1d5db",

                  backgroundColor: "white",

                  borderRadius: "6px",

                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Hủy
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 18px",

                  border: "none",

                  backgroundColor: "#2563eb",

                  color: "white",

                  borderRadius: "6px",

                  cursor: saving ? "not-allowed" : "pointer",

                  fontWeight: 600,
                }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =======================================================

// STYLES

// =======================================================

const thStyle: React.CSSProperties = {
  padding: "12px 14px",

  textAlign: "left",

  fontSize: "13px",

  fontWeight: 700,

  color: "#374151",

  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",

  fontSize: "14px",

  color: "#111827",

  verticalAlign: "middle",
};

const labelStyle: React.CSSProperties = {
  display: "block",

  marginBottom: "6px",

  marginTop: "12px",

  fontSize: "14px",

  fontWeight: 600,

  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",

  boxSizing: "border-box",

  padding: "9px 10px",

  border: "1px solid #d1d5db",

  borderRadius: "6px",

  fontSize: "14px",
};

const editButtonStyle: React.CSSProperties = {
  padding: "6px 10px",

  border: "1px solid #2563eb",

  backgroundColor: "white",

  color: "#2563eb",

  borderRadius: "5px",

  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "6px 10px",

  border: "1px solid #dc2626",

  backgroundColor: "white",

  color: "#dc2626",

  borderRadius: "5px",
};

export default UserPage;
