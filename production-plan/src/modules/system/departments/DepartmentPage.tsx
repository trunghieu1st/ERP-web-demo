import { useEffect, useState } from "react";
import "./DepartmentPage.css";
import { API_BASE_URL } from "../../../api/apiConfig";

import { apiFetch } from "../../../api/apiClient";


interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  interfaceType: "WEB" | "PWA";
  isActive: boolean;
}

interface DepartmentForm {
  departmentCode: string;
  departmentName: string;
  interfaceType: "WEB" | "PWA";
}

const emptyForm: DepartmentForm = {
  departmentCode: "",
  departmentName: "",
  interfaceType: "WEB",
};

type PageTab = "LIST" | "FORM";

function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<PageTab>("LIST");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [forms, setForms] = useState<DepartmentForm[]>([
    { ...emptyForm },
  ]);

  const [error, setError] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
  "/api/departments"
);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách phòng ban");
      }

      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // =========================
  // THÊM PHÒNG BAN
  // =========================
  const handleNew = () => {
    setEditingId(null);
    setForms([{ ...emptyForm }]);
    setError("");
    setActiveTab("FORM");
  };

  // =========================
  // SỬA PHÒNG BAN
  // =========================
  const handleEdit = (department: Department) => {
    setEditingId(department.departmentId);

    setForms([
      {
        departmentCode: department.departmentCode,
        departmentName: department.departmentName,
        interfaceType: department.interfaceType,
      },
    ]);

    setError("");
    setActiveTab("FORM");
  };

  // =========================
  // THAY ĐỔI FORM
  // =========================
  const handleChange = (
    index: number,
    field: keyof DepartmentForm,
    value: string
  ) => {
    setForms((prev) =>
      prev.map((form, i) =>
        i === index
          ? {
              ...form,
              [field]: value,
            }
          : form
      )
    );
  };

  // =========================
  // THÊM DÒNG
  // =========================
  const handleAddRow = () => {
    setForms((prev) => [
      ...prev,
      {
        ...emptyForm,
      },
    ]);
  };

  // =========================
  // XÓA DÒNG
  // =========================
  const handleRemoveRow = (index: number) => {
    setForms((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  // =========================
  // LƯU
  // =========================
  const handleSave = async () => {
    setError("");

    if (forms.length === 0) {
      setError("Chưa có dữ liệu phòng ban");
      return;
    }

    for (const form of forms) {
      if (!form.departmentCode.trim()) {
        setError("Mã phòng ban không được để trống");
        return;
      }

      if (!form.departmentName.trim()) {
        setError("Tên phòng ban không được để trống");
        return;
      }
    }

    try {
      setSaving(true);

      // =========================
      // CẬP NHẬT
      // =========================
      if (editingId !== null) {
        const form = forms[0];

        const response = await apiFetch(
  `/api/departments/${editingId}`,
  {
    method: "PUT",

    body: JSON.stringify({
      departmentCode: form.departmentCode.trim(),
      departmentName: form.departmentName.trim(),
      interfaceType: form.interfaceType,
    }),
  }
);

        if (!response.ok) {
          const message = await response.text();

          throw new Error(
            message || "Không thể cập nhật phòng ban"
          );
        }
      }

      // =========================
      // THÊM MỚI
      // =========================
      else {
        for (const form of forms) {
          const response = await apiFetch(
  "/api/departments",
  {
    method: "POST",

    body: JSON.stringify({
      departmentCode:
        form.departmentCode.trim(),

      departmentName:
        form.departmentName.trim(),

      interfaceType:
        form.interfaceType,
    }),
  }
);

          if (!response.ok) {
            const message = await response.text();

            throw new Error(
              message || "Không thể thêm phòng ban"
            );
          }
        }
      }

      await loadDepartments();

      setForms([{ ...emptyForm }]);
      setEditingId(null);
      setActiveTab("LIST");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi lưu dữ liệu"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // XÓA
  // =========================
  const handleDelete = async (
    department: Department
  ) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phòng ban "${department.departmentName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await apiFetch(
  `/api/departments/${department.departmentId}`,
  {
    method: "DELETE",
  }
);

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Không thể xóa phòng ban"
        );
      }

      await loadDepartments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi xóa phòng ban"
      );
    }
  };

  // =========================
  // QUAY LẠI DANH SÁCH
  // =========================
  const handleBackToList = () => {
    if (saving) {
      return;
    }

    setActiveTab("LIST");
    setEditingId(null);
    setForms([{ ...emptyForm }]);
    setError("");
  };

  // =========================
  // RETURN
  // =========================
  return (
    <div className="department-page">
      {/* =========================
          TOP HEADER - KHÔNG CUỘN
          ========================= */}
      <div className="department-top">
        <div className="department-header">
          <div>
            <h1>Thông tin phòng ban</h1>

            <div className="department-subtitle">
              Quản lý phòng ban và loại giao diện WEB / PWA
            </div>
          </div>

          {activeTab === "LIST" && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNew}
            >
              + Thêm phòng ban
            </button>
          )}
        </div>

        {/* =========================
            TAB
            ========================= */}
        <div className="department-tabs">
          <button
            type="button"
            className={`department-tab ${
              activeTab === "LIST" ? "active" : ""
            }`}
            onClick={() => {
              if (!saving) {
                handleBackToList();
              }
            }}
          >
            Danh sách phòng ban
          </button>

          {activeTab === "FORM" && (
            <button
              type="button"
              className="department-tab active"
            >
              {editingId === null
                ? "Thêm phòng ban"
                : "Cập nhật phòng ban"}
            </button>
          )}
        </div>
      </div>

      {/* =========================
          ERROR
          ========================= */}
      {error && (
        <div className="department-error">
          {error}
        </div>
      )}

      {/* =========================
          CONTENT
          ========================= */}
      <div className="department-content">
        {/* =================================================
            TAB DANH SÁCH
            ================================================= */}
        {activeTab === "LIST" && (
          <div className="department-list-card">
            <div className="list-header">
              <div className="list-title">
                Danh sách phòng ban
              </div>

              <div className="list-count">
                Tổng: {departments.length}
              </div>
            </div>

            <div className="department-table-scroll">
              {loading ? (
                <div className="loading">
                  Đang tải dữ liệu...
                </div>
              ) : departments.length === 0 ? (
                <div className="empty">
                  Chưa có phòng ban
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>
                          STT
                        </th>

                        <th>
                          Mã phòng ban
                        </th>

                        <th>
                          Tên phòng ban
                        </th>

                        <th>
                          Giao diện
                        </th>

                        <th>
                          Trạng thái
                        </th>

                        <th
                          style={{
                            width: 150,
                            textAlign: "center",
                          }}
                        >
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {departments.map(
                        (department, index) => (
                          <tr
                            key={
                              department.departmentId
                            }
                          >
                            <td className="text-center">
                              {index + 1}
                            </td>

                            <td>
                              {
                                department.departmentCode
                              }
                            </td>

                            <td>
                              {
                                department.departmentName
                              }
                            </td>

                            <td>
                              <span
                                className={`interface-badge ${
                                  department.interfaceType ===
                                  "WEB"
                                    ? "web"
                                    : "pwa"
                                }`}
                              >
                                {
                                  department.interfaceType
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={`status-badge ${
                                  department.isActive
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                {department.isActive
                                  ? "Đang hoạt động"
                                  : "Ngừng hoạt động"}
                              </span>
                            </td>

                            <td>
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="btn-edit"
                                  onClick={() =>
                                    handleEdit(
                                      department
                                    )
                                  }
                                >
                                  Sửa
                                </button>

                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() =>
                                    handleDelete(
                                      department
                                    )
                                  }
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            TAB THÊM / CẬP NHẬT
            ================================================= */}
        {activeTab === "FORM" && (
          <div className="department-form-card">
            <div className="department-form-header">
              <div>
                <h2>
                  {editingId === null
                    ? "Thêm phòng ban"
                    : "Cập nhật phòng ban"}
                </h2>

                <div className="department-form-subtitle">
                  {editingId === null
                    ? "Nhập thông tin phòng ban mới"
                    : "Cập nhật thông tin phòng ban"}
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleBackToList}
                disabled={saving}
              >
                ← Danh sách
              </button>
            </div>

            {/* =========================
                THÊM MỚI
                ========================= */}
            {editingId === null ? (
              <>
                <div className="department-form-table-wrapper">
                  <table className="department-form-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>
                          STT
                        </th>

                        <th>
                          Mã phòng ban
                        </th>

                        <th>
                          Tên phòng ban
                        </th>

                        <th>
                          Giao diện
                        </th>

                        <th
                          style={{
                            width: 70,
                            textAlign: "center",
                          }}
                        >
                          Xóa
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {forms.map((form, index) => (
                        <tr key={index}>
                          <td className="text-center">
                            {index + 1}
                          </td>

                          <td>
                            <input
                              type="text"
                              value={
                                form.departmentCode
                              }
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "departmentCode",
                                  e.target.value
                                )
                              }
                              placeholder="VD: KHDH"
                              disabled={saving}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              value={
                                form.departmentName
                              }
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "departmentName",
                                  e.target.value
                                )
                              }
                              placeholder="Tên phòng ban"
                              disabled={saving}
                            />
                          </td>

                          <td>
                            <select
                              value={
                                form.interfaceType
                              }
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "interfaceType",
                                  e.target.value
                                )
                              }
                              disabled={saving}
                            >
                              <option value="WEB">
                                WEB
                              </option>

                              <option value="PWA">
                                PWA
                              </option>
                            </select>
                          </td>

                          <td className="text-center">
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() =>
                                handleRemoveRow(
                                  index
                                )
                              }
                              disabled={
                                saving ||
                                forms.length === 1
                              }
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="department-add-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddRow}
                    disabled={saving}
                  >
                    + Thêm dòng
                  </button>
                </div>
              </>
            ) : (
              /* =========================
                 CẬP NHẬT
                 ========================= */
              <div className="department-edit-form">
                <div className="form-group">
                  <label>
                    Mã phòng ban
                  </label>

                  <input
                    type="text"
                    value={
                      forms[0]?.departmentCode ?? ""
                    }
                    onChange={(e) =>
                      handleChange(
                        0,
                        "departmentCode",
                        e.target.value
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Tên phòng ban
                  </label>

                  <input
                    type="text"
                    value={
                      forms[0]?.departmentName ?? ""
                    }
                    onChange={(e) =>
                      handleChange(
                        0,
                        "departmentName",
                        e.target.value
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Giao diện
                  </label>

                  <select
                    value={
                      forms[0]?.interfaceType ?? "WEB"
                    }
                    onChange={(e) =>
                      handleChange(
                        0,
                        "interfaceType",
                        e.target.value
                      )
                    }
                    disabled={saving}
                  >
                    <option value="WEB">
                      WEB
                    </option>

                    <option value="PWA">
                      PWA
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* =========================
                FORM FOOTER
                ========================= */}
            <div className="department-form-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBackToList}
                disabled={saving}
              >
                Hủy
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId === null
                  ? `Lưu tất cả (${forms.length})`
                  : "Lưu"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentPage;
