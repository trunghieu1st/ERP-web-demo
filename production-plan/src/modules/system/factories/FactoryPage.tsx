import { useEffect, useState } from "react";
import "./FactoryPage.css";
import { API_BASE_URL } from "../../../api/apiConfig";

import { apiFetch } from "../../../api/apiClient";

interface Factory {
  factoryId: number;
  factoryCode: string;
  factoryName: string;
  isActive: boolean;
}

interface FactoryForm {
  factoryCode: string;
  factoryName: string;
}

type PageTab = "LIST" | "FORM";

export default function FactoryPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<PageTab>("LIST");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [forms, setForms] = useState<FactoryForm[]>([
    {
      factoryCode: "",
      factoryName: "",
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadFactories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/api/factories");
      if (!response.ok) {
        throw new Error("Không thể tải danh sách nhà máy.");
      }

      const data = await response.json();

      setFactories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactories();
  }, []);

  // =========================================================
  // OPEN ADD
  // =========================================================

  const handleAdd = () => {
    setEditingId(null);

    setForms([
      {
        factoryCode: "",
        factoryName: "",
      },
    ]);

    setError("");
    setActiveTab("FORM");
  };

  // =========================================================
  // ADD ROW
  // =========================================================

  const handleAddRow = () => {
    setForms((prev) => [
      ...prev,
      {
        factoryCode: "",
        factoryName: "",
      },
    ]);
  };

  // =========================================================
  // REMOVE ROW
  // =========================================================

  const handleRemoveRow = (index: number) => {
    if (forms.length === 1) {
      return;
    }

    setForms((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================
  // CHANGE ROW
  // =========================================================

  const handleChangeRow = (
    index: number,
    field: keyof FactoryForm,
    value: string,
  ) => {
    setForms((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const handleEdit = (factory: Factory) => {
    setEditingId(factory.factoryId);

    setForms([
      {
        factoryCode: factory.factoryCode,
        factoryName: factory.factoryName,
      },
    ]);

    setError("");
    setActiveTab("FORM");
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    // ---------------------------------------------------------
    // EDIT SINGLE FACTORY
    // ---------------------------------------------------------

    if (editingId !== null) {
      const form = forms[0];

      if (!form.factoryCode.trim()) {
        setError("Vui lòng nhập mã nhà máy.");
        return;
      }

      if (!form.factoryName.trim()) {
        setError("Vui lòng nhập tên nhà máy.");
        return;
      }

      try {
        setSaving(true);
        setError("");

        const response = await apiFetch(
  `/api/factories/${editingId}`,
  {
    method: "PUT",

    body: JSON.stringify({
      factoryCode: form.factoryCode.trim(),
      factoryName: form.factoryName.trim(),
    }),
  },
);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Không thể cập nhật nhà máy.");
        }

        setEditingId(null);

        setForms([
          {
            factoryCode: "",
            factoryName: "",
          },
        ]);

        setActiveTab("LIST");

        await loadFactories();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi cập nhật dữ liệu.",
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    // ---------------------------------------------------------
    // ADD MULTIPLE FACTORIES
    // ---------------------------------------------------------

    for (let i = 0; i < forms.length; i++) {
      if (!forms[i].factoryCode.trim()) {
        setError(`Dòng ${i + 1}: Vui lòng nhập mã nhà máy.`);
        return;
      }

      if (!forms[i].factoryName.trim()) {
        setError(`Dòng ${i + 1}: Vui lòng nhập tên nhà máy.`);
        return;
      }
    }

    // ---------------------------------------------------------
    // CHECK DUPLICATE CODES
    // ---------------------------------------------------------

    const codes = forms.map((item) => item.factoryCode.trim().toUpperCase());

    const duplicateCodes = codes.filter(
      (code, index) => codes.indexOf(code) !== index,
    );

    if (duplicateCodes.length > 0) {
      setError(
        `Mã nhà máy bị trùng trong danh sách: ${[
          ...new Set(duplicateCodes),
        ].join(", ")}`,
      );
      return;
    }

    // ---------------------------------------------------------
    // SAVE
    // ---------------------------------------------------------

    try {
      setSaving(true);
      setError("");

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];

        const response = await apiFetch(
  "/api/factories",
  {
    method: "POST",

    body: JSON.stringify({
      factoryCode: form.factoryCode.trim(),
      factoryName: form.factoryName.trim(),
    }),
  },
);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || `Không thể lưu nhà máy ở dòng ${i + 1}.`,
          );
        }
      }

      setEditingId(null);

      setForms([
        {
          factoryCode: "",
          factoryName: "",
        },
      ]);

      setActiveTab("LIST");

      await loadFactories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu dữ liệu.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE / DEACTIVATE
  // =========================================================

  const handleDelete = async (factory: Factory) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn khóa nhà máy "${factory.factoryName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await apiFetch(
  `/api/factories/${factory.factoryId}`,
  {
    method: "DELETE",
  },
);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Không thể khóa nhà máy.");
      }

      await loadFactories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi khóa nhà máy.",
      );
    }
  };

  // =========================================================
  // BACK TO LIST
  // =========================================================

  const handleBackToList = () => {
    if (saving) {
      return;
    }

    setActiveTab("LIST");
    setEditingId(null);

    setForms([
      {
        factoryCode: "",
        factoryName: "",
      },
    ]);

    setError("");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="factory-page">
      {/* =====================================================
          TOP HEADER - KHÔNG BỊ CUỘN
          ===================================================== */}

      <div className="factory-top">
        <div className="factory-header">
          <div>
            <h1>Thông tin nhà máy</h1>

            <div className="factory-subtitle">Quản lý danh sách nhà máy</div>
          </div>

          {activeTab === "LIST" && (
            <button
              className="factory-btn factory-btn-primary"
              onClick={handleAdd}
              disabled={saving}
            >
              + Thêm nhà máy
            </button>
          )}
        </div>

        {/* =================================================
            INTERNAL TABS
            ================================================= */}

        <div className="factory-tabs">
          <button
            type="button"
            className={`factory-tab ${activeTab === "LIST" ? "active" : ""}`}
            onClick={() => {
              if (!saving) {
                handleBackToList();
              }
            }}
          >
            Danh sách nhà máy
          </button>

          {activeTab === "FORM" && (
            <button type="button" className="factory-tab active">
              {editingId === null ? "Thêm nhà máy" : "Cập nhật nhà máy"}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && <div className="factory-error">{error}</div>}

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="factory-content">
        {/* ===================================================
            LIST TAB
            =================================================== */}

        {activeTab === "LIST" && (
          <div className="factory-table-card">
            <div className="factory-list-header">
              <div className="factory-list-title">Danh sách nhà máy</div>

              <div className="factory-list-count">Tổng: {factories.length}</div>
            </div>

            <div className="factory-table-scroll">
              {loading ? (
                <div className="factory-loading">Đang tải dữ liệu...</div>
              ) : factories.length === 0 ? (
                <div className="factory-empty">Chưa có nhà máy nào.</div>
              ) : (
                <table className="factory-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã nhà máy</th>
                      <th>Tên nhà máy</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {factories.map((factory, index) => (
                      <tr key={factory.factoryId}>
                        <td>{index + 1}</td>

                        <td className="factory-code">{factory.factoryCode}</td>

                        <td>{factory.factoryName}</td>

                        <td>
                          <span className="factory-status">
                            {factory.isActive
                              ? "Đang hoạt động"
                              : "Ngừng hoạt động"}
                          </span>
                        </td>

                        <td>
                          <div className="factory-actions">
                            <button
                              className="factory-action-edit"
                              onClick={() => handleEdit(factory)}
                              disabled={saving}
                            >
                              Sửa
                            </button>

                            {factory.isActive && (
                              <button
                                className="factory-action-delete"
                                onClick={() => handleDelete(factory)}
                                disabled={saving}
                              >
                                Khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            FORM TAB
            =================================================== */}

        {activeTab === "FORM" && (
          <div className="factory-form-card">
            <div className="factory-form-header">
              <div>
                <h2>
                  {editingId === null ? "Thêm nhà máy" : "Cập nhật nhà máy"}
                </h2>

                <div className="factory-form-subtitle">
                  {editingId === null
                    ? "Nhập thông tin nhà máy mới"
                    : "Cập nhật thông tin nhà máy"}
                </div>
              </div>

              <button
                type="button"
                className="factory-btn factory-btn-secondary"
                onClick={handleBackToList}
                disabled={saving}
              >
                ← Danh sách
              </button>
            </div>

            {/* =================================================
                ADD MULTIPLE
                ================================================= */}

            {editingId === null ? (
              <>
                <div className="factory-form-table-wrapper">
                  <table className="factory-form-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>STT</th>

                        <th>Mã nhà máy</th>

                        <th>Tên nhà máy</th>

                        <th
                          style={{
                            width: 90,
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
                          <td className="text-center">{index + 1}</td>

                          <td>
                            <input
                              type="text"
                              value={form.factoryCode}
                              onChange={(e) =>
                                handleChangeRow(
                                  index,
                                  "factoryCode",
                                  e.target.value,
                                )
                              }
                              placeholder="VD: FACTORY_HN"
                              disabled={saving}
                              autoFocus={index === 0}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              value={form.factoryName}
                              onChange={(e) =>
                                handleChangeRow(
                                  index,
                                  "factoryName",
                                  e.target.value,
                                )
                              }
                              placeholder="VD: Nhà máy Hà Nội"
                              disabled={saving}
                            />
                          </td>

                          <td className="text-center">
                            <button
                              type="button"
                              className="factory-action-delete"
                              onClick={() => handleRemoveRow(index)}
                              disabled={saving || forms.length === 1}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="factory-add-row">
                  <button
                    type="button"
                    className="factory-btn factory-btn-secondary"
                    onClick={handleAddRow}
                    disabled={saving}
                  >
                    + Thêm dòng
                  </button>
                </div>
              </>
            ) : (
              /* =================================================
                 EDIT
                 ================================================= */

              <div className="factory-form-grid">
                <div className="factory-field">
                  <label>Mã nhà máy</label>

                  <input
                    type="text"
                    value={forms[0]?.factoryCode ?? ""}
                    onChange={(e) =>
                      handleChangeRow(0, "factoryCode", e.target.value)
                    }
                    placeholder="VD: FACTORY_HN"
                    disabled={saving}
                    autoFocus
                  />
                </div>

                <div className="factory-field">
                  <label>Tên nhà máy</label>

                  <input
                    type="text"
                    value={forms[0]?.factoryName ?? ""}
                    onChange={(e) =>
                      handleChangeRow(0, "factoryName", e.target.value)
                    }
                    placeholder="VD: Nhà máy Hà Nội"
                    disabled={saving}
                  />
                </div>
              </div>
            )}

            {/* =================================================
                FORM FOOTER
                ================================================= */}

            <div className="factory-form-footer">
              <button
                type="button"
                className="factory-btn factory-btn-secondary"
                onClick={handleBackToList}
                disabled={saving}
              >
                Hủy
              </button>

              <button
                type="button"
                className="factory-btn factory-btn-primary"
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
