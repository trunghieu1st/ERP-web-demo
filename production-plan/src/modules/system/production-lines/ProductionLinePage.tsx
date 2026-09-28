import { useEffect, useState } from "react";

import "./ProductionLinePage.css";

import { apiFetch } from "../../../api/apiClient";
import { useDataScopeData } from "../../../auth/useDataScope";

// =========================================================
// PRODUCTION LINE
// =========================================================

interface ProductionLine {
  productionLineId: number;
  factoryId: number;
  lineCode: string;
  lineName: string;
  isActive: boolean;
  sortOrder: number;
}

// =========================================================
// FORM
// =========================================================

interface ProductionLineForm {
  factoryId: number;
  lineCode: string;
  lineName: string;
  sortOrder: number;
}

type PageTab = "LIST" | "FORM";

// =========================================================
// PAGE
// =========================================================

function ProductionLinePage() {
  const { scope } = useDataScopeData();

  const [productionLines, setProductionLines] = useState<
    ProductionLine[]
  >([]);

  // Form nhập nhiều chuyền
  const [forms, setForms] = useState<ProductionLineForm[]>([]);

  // Khi sửa vẫn chỉ sửa 1 chuyền
  const [editingId, setEditingId] = useState<number | null>(null);

  // Tab hiện tại
  const [activeTab, setActiveTab] =
    useState<PageTab>("LIST");

  const [loading, setLoading] = useState(false);

  // =========================================================
  // CURRENT FACTORY
  //
  // Factory chỉ lấy từ DataScope/JWT.
  // Frontend không cho người dùng tự chọn Factory.
  // Backend vẫn là nơi enforce DataScope thực sự.
  // =========================================================

  const currentFactoryId = scope.factoryId;

  // =========================================================
  // LOAD PRODUCTION LINES
  // =========================================================

  const loadProductionLines = async () => {
    try {
      setLoading(true);

      const response = await apiFetch(
        "/api/production-lines",
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ??
            "Không thể lấy danh sách chuyền.",
        );
      }

      const data = await response.json();

      setProductionLines(data);
    } catch (error) {
      console.error(
        "LOAD PRODUCTION LINES ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách chuyền sản xuất.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProductionLines();
  }, []);

  // =========================================================
  // LẤY SORT ORDER TIẾP THEO
  // =========================================================

  const getNextSortOrder = () => {
    if (productionLines.length === 0) {
      return 1;
    }

    return (
      Math.max(
        ...productionLines.map(
          (line) => line.sortOrder,
        ),
      ) + 1
    );
  };

  // =========================================================
  // LẤY SỐ CHUYỀN TIẾP THEO
  // =========================================================

  const getNextLineNumber = () => {
    let maxLineNumber = 0;

    productionLines.forEach((line) => {
      const match = line.lineCode
        .trim()
        .toUpperCase()
        .match(/^C(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (number > maxLineNumber) {
          maxLineNumber = number;
        }
      }
    });

    forms.forEach((form) => {
      const match = form.lineCode
        .trim()
        .toUpperCase()
        .match(/^C(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (number > maxLineNumber) {
          maxLineNumber = number;
        }
      }
    });

    return maxLineNumber + 1;
  };

  // =========================================================
  // NEW
  // =========================================================

  const handleNew = () => {
    if (!currentFactoryId) {
      alert(
        "Không xác định được nhà máy của người dùng đăng nhập.",
      );

      return;
    }

    const nextLineNumber = getNextLineNumber();

    const lineCode =
      `C${String(nextLineNumber).padStart(2, "0")}`;

    const lineName =
      `Chuyền ${String(nextLineNumber).padStart(2, "0")}`;

    const nextSortOrder = getNextSortOrder();

    setEditingId(null);

    setForms([
      {
        factoryId: currentFactoryId,
        lineCode,
        lineName,
        sortOrder: nextSortOrder,
      },
    ]);

    setActiveTab("FORM");
  };

  // =========================================================
  // THÊM DÒNG
  // =========================================================

  const handleAddRow = () => {
    if (!currentFactoryId) {
      alert(
        "Không xác định được nhà máy của người dùng đăng nhập.",
      );

      return;
    }

    setForms((current) => {
      let maxLineNumber = 0;

      productionLines.forEach((line) => {
        const match = line.lineCode
          .trim()
          .toUpperCase()
          .match(/^C(\d+)$/);

        if (match) {
          const number = Number(match[1]);

          if (number > maxLineNumber) {
            maxLineNumber = number;
          }
        }
      });

      current.forEach((form) => {
        const match = form.lineCode
          .trim()
          .toUpperCase()
          .match(/^C(\d+)$/);

        if (match) {
          const number = Number(match[1]);

          if (number > maxLineNumber) {
            maxLineNumber = number;
          }
        }
      });

      const nextLineNumber =
        maxLineNumber + 1;

      const lineCode =
        `C${String(nextLineNumber).padStart(2, "0")}`;

      const lineName =
        `Chuyền ${String(nextLineNumber).padStart(2, "0")}`;

      const existingNextSortOrder =
        getNextSortOrder();

      const currentMaxSortOrder =
        current.length > 0
          ? Math.max(
              ...current.map(
                (item) => item.sortOrder,
              ),
            )
          : existingNextSortOrder - 1;

      const nextSortOrder = Math.max(
        existingNextSortOrder,
        currentMaxSortOrder + 1,
      );

      return [
        ...current,
        {
          factoryId: currentFactoryId,
          lineCode,
          lineName,
          sortOrder: nextSortOrder,
        },
      ];
    });
  };

  // =========================================================
  // XÓA DÒNG
  // =========================================================

  const handleRemoveRow = (index: number) => {
    if (forms.length === 1) {
      return;
    }

    setForms((current) =>
      current.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    );
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEdit = (
    productionLine: ProductionLine,
  ) => {
    if (!currentFactoryId) {
      alert(
        "Không xác định được nhà máy của người dùng đăng nhập.",
      );

      return;
    }

    setEditingId(
      productionLine.productionLineId,
    );

    setForms([
      {
        // Không lấy Factory để cho phép thay đổi.
        // Factory hiện tại luôn lấy từ DataScope.
        factoryId: currentFactoryId,
        lineCode: productionLine.lineCode,
        lineName: productionLine.lineName,
        sortOrder: productionLine.sortOrder,
      },
    ]);

    setActiveTab("FORM");
  };

  // =========================================================
  // CHANGE FORM
  // =========================================================

  const handleChange = (
    index: number,
    field: "lineCode" | "lineName" | "sortOrder",
    value: string,
  ) => {
    setForms((current) =>
      current.map((item, rowIndex) => {
        if (rowIndex !== index) {
          return item;
        }

        return {
          ...item,

          [field]:
            field === "sortOrder"
              ? value === ""
                ? 0
                : Number(value)
              : value,
        };
      }),
    );
  };

  // =========================================================
  // VALIDATE FORM
  // =========================================================

  const validateForms = () => {
    if (!currentFactoryId) {
      alert(
        "Không xác định được nhà máy của người dùng đăng nhập.",
      );

      return false;
    }

    if (forms.length === 0) {
      alert("Không có dữ liệu để lưu.");

      return false;
    }

    for (
      let index = 0;
      index < forms.length;
      index++
    ) {
      const form = forms[index];

      if (!form.lineCode.trim()) {
        alert(
          `Dòng ${index + 1}: Vui lòng nhập mã chuyền.`,
        );

        return false;
      }

      if (!form.lineName.trim()) {
        alert(
          `Dòng ${index + 1}: Vui lòng nhập tên chuyền.`,
        );

        return false;
      }

      if (form.sortOrder < 1) {
        alert(
          `Dòng ${index + 1}: Thứ tự phải lớn hơn hoặc bằng 1.`,
        );

        return false;
      }
    }

    const codes = forms.map((form) =>
      form.lineCode.trim().toUpperCase(),
    );

    const duplicateCodes = codes.filter(
      (code, index) =>
        codes.indexOf(code) !== index,
    );

    if (duplicateCodes.length > 0) {
      alert(
        `Mã chuyền bị trùng trong danh sách nhập: ${[
          ...new Set(duplicateCodes),
        ].join(", ")}`,
      );

      return false;
    }

    return true;
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    if (!validateForms()) {
      return;
    }

    if (!currentFactoryId) {
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // EDIT - chỉ sửa 1 chuyền
      // =====================================================

      if (editingId !== null) {
        const form = forms[0];

        const response = await apiFetch(
          `/api/production-lines/${editingId}`,
          {
            method: "PUT",

            body: JSON.stringify({
              // Tạm giữ để tương thích DTO backend.
              // Backend không được tin giá trị này.
              factoryId: currentFactoryId,

              lineCode: form.lineCode.trim(),

              lineName: form.lineName.trim(),

              sortOrder: form.sortOrder,
            }),
          },
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          alert(
            data?.message ??
              "Cập nhật chuyền sản xuất thất bại.",
          );

          return;
        }

        alert(
          "Đã cập nhật chuyền sản xuất.",
        );

        setActiveTab("LIST");

        setEditingId(null);

        setForms([]);

        await loadProductionLines();

        return;
      }

      // =====================================================
      // ADD - LƯU NHIỀU CHUYỀN
      // =====================================================

      let successCount = 0;

      for (const form of forms) {
        const response = await apiFetch(
          "/api/production-lines",
          {
            method: "POST",

            body: JSON.stringify({
              // Tạm giữ để tương thích DTO backend.
              // Backend lấy Factory thực từ JWT.
              factoryId: currentFactoryId,

              lineCode: form.lineCode.trim(),

              lineName: form.lineName.trim(),

              sortOrder: form.sortOrder,
            }),
          },
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          alert(
            `Lưu thất bại ở mã chuyền "${form.lineCode}".\n\n${
              data?.message ??
              "Không thể lưu chuyền sản xuất."
            }`,
          );

          if (successCount > 0) {
            alert(
              `Đã lưu thành công ${successCount}/${forms.length} chuyền.`,
            );
          }

          return;
        }

        successCount++;
      }

      alert(
        `Đã lưu thành công ${successCount} chuyền sản xuất.`,
      );

      setActiveTab("LIST");

      setEditingId(null);

      setForms([]);

      await loadProductionLines();
    } catch (error) {
      console.error(
        "SAVE PRODUCTION LINE ERROR:",
        error,
      );

      alert(
        "Có lỗi xảy ra khi lưu chuyền sản xuất.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE / SOFT DELETE
  // =========================================================

  const handleDelete = async (
    productionLine: ProductionLine,
  ) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn ngừng sử dụng chuyền "${productionLine.lineName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiFetch(
        `/api/production-lines/${productionLine.productionLineId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ??
            "Không thể ngừng sử dụng chuyền.",
        );

        return;
      }

      alert("Đã ngừng sử dụng chuyền.");

      await loadProductionLines();
    } catch (error) {
      console.error(
        "DELETE PRODUCTION LINE ERROR:",
        error,
      );

      alert("Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CANCEL / BACK TO LIST
  // =========================================================

  const handleCancel = () => {
    setActiveTab("LIST");

    setEditingId(null);

    setForms([]);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="production-line-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="production-line-top">
        <div className="production-line-header">
          <div>
            <h1>Thông tin chuyền sản xuất</h1>

            <div className="production-line-subtitle">
              Quản lý chuyền sản xuất theo nhà máy
            </div>
          </div>

          {activeTab === "LIST" && (
            <button
              className="btn-primary"
              onClick={handleNew}
              disabled={
                loading || !currentFactoryId
              }
            >
              + Thêm chuyền
            </button>
          )}
        </div>

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="production-line-tabs">
          <button
            type="button"
            className={
              activeTab === "LIST"
                ? "production-line-tab active"
                : "production-line-tab"
            }
            onClick={() => {
              setActiveTab("LIST");
              setEditingId(null);
              setForms([]);
            }}
          >
            Danh sách chuyền
          </button>

          {activeTab === "FORM" && (
            <button
              type="button"
              className="production-line-tab active"
            >
              {editingId === null
                ? "Thêm chuyền"
                : "Cập nhật chuyền"}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="production-line-content">
        {/* ===================================================
            LIST TAB
        ==================================================== */}

        {activeTab === "LIST" && (
          <>
            {/* CURRENT FACTORY */}

            <div className="production-line-filter">
              <label>Nhà máy</label>

              <strong>
                {scope.factoryName ??
                  "Không xác định"}
              </strong>
            </div>

            {/* LIST */}

            <div className="production-line-list-card">
              <div className="list-header">
                <div className="list-title">
                  Danh sách chuyền
                </div>

                <div className="list-count">
                  {productionLines.length} chuyền
                </div>
              </div>

              {loading && (
                <div className="loading">
                  Đang tải dữ liệu...
                </div>
              )}

              {!loading &&
                productionLines.length === 0 && (
                  <div className="empty">
                    Chưa có chuyền sản xuất.
                  </div>
                )}

              {!loading &&
                productionLines.length > 0 && (
                  <div className="table-wrapper">
                    <table className="production-line-table">
                      <thead>
                        <tr>
                          <th>STT</th>

                          <th>Mã chuyền</th>

                          <th>Tên chuyền</th>

                          <th>Thứ tự</th>

                          <th>Trạng thái</th>

                          <th>Thao tác</th>
                        </tr>
                      </thead>

                      <tbody>
                        {productionLines.map(
                          (line, index) => (
                            <tr
                              key={
                                line.productionLineId
                              }
                            >
                              <td className="text-center">
                                {index + 1}
                              </td>

                              <td>
                                <strong>
                                  {line.lineCode}
                                </strong>
                              </td>

                              <td>
                                {line.lineName}
                              </td>

                              <td className="text-center">
                                {line.sortOrder}
                              </td>

                              <td>
                                <span
                                  className={
                                    line.isActive
                                      ? "status-badge active"
                                      : "status-badge inactive"
                                  }
                                >
                                  {line.isActive
                                    ? "Đang sử dụng"
                                    : "Ngừng sử dụng"}
                                </span>
                              </td>

                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-edit"
                                    onClick={() =>
                                      handleEdit(
                                        line,
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                  >
                                    Sửa
                                  </button>

                                  {line.isActive && (
                                    <button
                                      className="btn-delete"
                                      onClick={() =>
                                        handleDelete(
                                          line,
                                        )
                                      }
                                      disabled={
                                        loading
                                      }
                                    >
                                      Khóa
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

        {/* ===================================================
            FORM TAB
        ==================================================== */}

        {activeTab === "FORM" && (
          <div className="production-line-form-card">
            <div className="form-title">
              {editingId === null
                ? "Thêm chuyền sản xuất"
                : "Cập nhật chuyền sản xuất"}
            </div>

            {/* FACTORY READ ONLY */}

            <div
              className="form-group"
              style={{
                padding: "16px 16px 0 16px",
              }}
            >
              <label>Nhà máy</label>

              <input
                type="text"
                value={
                  scope.factoryName ??
                  "Không xác định"
                }
                disabled
              />
            </div>

            {/* =================================================
                THÊM NHIỀU CHUYỀN
            ================================================= */}

            {editingId === null ? (
              <div className="production-line-form-body">
                <div className="production-line-form-table-wrapper">
                  <table className="production-line-form-table">
                    <thead>
                      <tr>
                        <th>STT</th>

                        <th>Mã chuyền</th>

                        <th>Tên chuyền</th>

                        <th>Thứ tự</th>

                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {forms.map(
                        (form, index) => (
                          <tr key={index}>
                            <td className="text-center row-number">
                              {index + 1}
                            </td>

                            <td>
                              <input
                                type="text"
                                value={
                                  form.lineCode
                                }
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "lineCode",
                                    e.target
                                      .value,
                                  )
                                }
                                placeholder="C01"
                              />
                            </td>

                            <td>
                              <input
                                type="text"
                                value={
                                  form.lineName
                                }
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "lineName",
                                    e.target
                                      .value,
                                  )
                                }
                                placeholder="Chuyền 01"
                              />
                            </td>

                            <td className="sort-order-cell">
                              <input
                                type="number"
                                min={1}
                                value={
                                  form.sortOrder
                                }
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "sortOrder",
                                    e.target
                                      .value,
                                  )
                                }
                              />
                            </td>

                            <td className="remove-cell">
                              {forms.length >
                                1 && (
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() =>
                                    handleRemoveRow(
                                      index,
                                    )
                                  }
                                  disabled={
                                    loading
                                  }
                                >
                                  Xóa
                                </button>
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="production-line-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddRow}
                    disabled={loading}
                  >
                    + Thêm dòng
                  </button>

                  <div className="production-line-form-action-right">
                    <button
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading
                        ? "Đang lưu..."
                        : `Lưu tất cả (${forms.length})`}
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* =================================================
                 EDIT 1 CHUYỀN
              ================================================= */

              <div className="production-line-form-body">
                <div className="form-grid">
                  {/* LINE CODE */}

                  <div className="form-group">
                    <label>Mã chuyền</label>

                    <input
                      type="text"
                      value={
                        forms[0]?.lineCode ??
                        ""
                      }
                      onChange={(e) =>
                        handleChange(
                          0,
                          "lineCode",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: C01"
                    />
                  </div>

                  {/* LINE NAME */}

                  <div className="form-group">
                    <label>Tên chuyền</label>

                    <input
                      type="text"
                      value={
                        forms[0]?.lineName ??
                        ""
                      }
                      onChange={(e) =>
                        handleChange(
                          0,
                          "lineName",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: Chuyền 01"
                    />
                  </div>

                  {/* SORT ORDER */}

                  <div className="form-group">
                    <label>Thứ tự</label>

                    <input
                      type="number"
                      min={1}
                      value={
                        forms[0]?.sortOrder ??
                        1
                      }
                      onChange={(e) =>
                        handleChange(
                          0,
                          "sortOrder",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading
                      ? "Đang lưu..."
                      : "Lưu"}
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductionLinePage;
