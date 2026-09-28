import { useEffect, useState } from "react";
import "./ReportPage.css";
import { apiFetch } from "../../../api/apiClient";

interface Report {
  reportId: number;
  reportCode: string;
  reportName: string;
  reportPath: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  description?: string | null;
}

interface ReportForm {
  reportCode: string;
  reportName: string;
  reportPath: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  description: string;
}

type PageTab = "LIST" | "FORM";

const emptyForm: ReportForm = {
  reportCode: "",
  reportName: "",
  reportPath: "",
  icon: "",
  sortOrder: 1,
  isActive: true,
  description: "",
};

function ReportPage() {
  const [reports, setReports] = useState<Report[]>([]);

  const [form, setForm] = useState<ReportForm>({
    ...emptyForm,
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<PageTab>("LIST");

  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  // =========================================================
  // LOAD REPORTS
  // =========================================================

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await apiFetch("/api/reports");

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách báo cáo.");
      }

      const data: Report[] = await response.json();

      setReports(data);
    } catch (error) {
      console.error(error);

      alert("Không thể tải danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    void loadReports();
  }, []);

  // =========================================================
  // NEXT SORT ORDER
  // =========================================================

  const getNextSortOrder = () => {
    if (reports.length === 0) {
      return 1;
    }

    return Math.max(...reports.map((x) => x.sortOrder)) + 1;
  };

  // =========================================================
  // NEW
  // =========================================================

  const handleNew = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      sortOrder: getNextSortOrder(),
    });

    setActiveTab("FORM");
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEdit = (report: Report) => {
    setEditingId(report.reportId);

    setForm({
      reportCode: report.reportCode,
      reportName: report.reportName,
      reportPath: report.reportPath,
      icon: report.icon ?? "",
      sortOrder: report.sortOrder,
      isActive: report.isActive,
      description: report.description ?? "",
    });

    setActiveTab("FORM");
  };

  // =========================================================
  // CHANGE FORM
  // =========================================================

  const handleChange = (field: keyof ReportForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,

      [field]:
        field === "sortOrder" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  // =========================================================
  // VALIDATE
  // =========================================================

  const validateForm = () => {
    if (!form.reportCode.trim()) {
      alert("Vui lòng nhập mã báo cáo.");
      return false;
    }

    if (!form.reportName.trim()) {
      alert("Vui lòng nhập tên báo cáo.");
      return false;
    }

    if (!form.reportPath.trim()) {
      alert("Vui lòng nhập đường dẫn báo cáo.");
      return false;
    }

    if (!form.reportPath.trim().startsWith("/")) {
      alert('Đường dẫn báo cáo phải bắt đầu bằng "/".');
      return false;
    }

    if (form.sortOrder < 0) {
      alert("Thứ tự không được nhỏ hơn 0.");
      return false;
    }

    return true;
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const body = {
        reportCode: form.reportCode.trim(),
        reportName: form.reportName.trim(),
        reportPath: form.reportPath.trim(),
        icon: form.icon.trim() || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        description: form.description.trim() || null,
      };

      let response: Response;

      if (editingId === null) {
        response = await apiFetch("/api/reports", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else {
        response = await apiFetch(`/api/reports/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể lưu báo cáo.");
        return;
      }

      alert(
        editingId === null
          ? "Đã tạo báo cáo thành công."
          : "Đã cập nhật báo cáo thành công.",
      );

      setEditingId(null);

      setForm({
        ...emptyForm,
      });

      setActiveTab("LIST");

      await loadReports();
    } catch (error) {
      console.error(error);

      alert("Có lỗi xảy ra khi lưu báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOCK / OPEN
  // =========================================================

  const handleStatus = async (report: Report) => {
    const newStatus = !report.isActive;

    const confirmed = window.confirm(
      newStatus
        ? `Bạn có chắc muốn mở lại báo cáo "${report.reportName}"?`
        : `Bạn có chắc muốn khóa báo cáo "${report.reportName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiFetch(
        `/api/reports/${report.reportId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể cập nhật trạng thái báo cáo.");
        return;
      }

      await loadReports();
    } catch (error) {
      console.error(error);

      alert("Có lỗi xảy ra khi cập nhật trạng thái báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (report: Report) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn XÓA báo cáo "${report.reportName}"?\n\n` +
        "Nếu báo cáo đã được phân quyền cho nhà máy hoặc phòng ban thì hệ thống sẽ không cho xóa.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiFetch(`/api/reports/${report.reportId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể xóa báo cáo.");
        return;
      }

      alert("Đã xóa báo cáo thành công.");

      await loadReports();
    } catch (error) {
      console.error(error);

      alert("Có lỗi xảy ra khi xóa báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setActiveTab("LIST");
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredReports = reports.filter((report) => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      report.reportCode.toLowerCase().includes(keyword) ||
      report.reportName.toLowerCase().includes(keyword) ||
      report.reportPath.toLowerCase().includes(keyword) ||
      (report.description ?? "").toLowerCase().includes(keyword)
    );
  });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="report-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="report-top">
        <div className="report-header">
          <div>
            <h1>Thông tin báo cáo</h1>

            <div className="report-subtitle">
              Quản lý danh mục báo cáo trong hệ thống
            </div>
          </div>

          {activeTab === "LIST" && (
            <button
              type="button"
              className="report-btn-primary"
              onClick={handleNew}
              disabled={loading}
            >
              + Thêm báo cáo
            </button>
          )}
        </div>

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="report-tabs">
          <button
            type="button"
            className={
              activeTab === "LIST" ? "report-tab active" : "report-tab"
            }
            onClick={() => {
              setEditingId(null);

              setForm({
                ...emptyForm,
              });

              setActiveTab("LIST");
            }}
          >
            Danh sách báo cáo
          </button>

          {activeTab === "FORM" && (
            <button type="button" className="report-tab active">
              {editingId === null ? "Thêm báo cáo" : "Cập nhật báo cáo"}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="report-content">
        {/* ===================================================
            LIST
        ==================================================== */}

        {activeTab === "LIST" && (
          <>
            {/* SEARCH */}

            <div className="report-filter">
              <label>Tìm kiếm</label>

              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập mã, tên hoặc đường dẫn báo cáo..."
              />
            </div>

            {/* TABLE CARD */}

            <div className="report-list-card">
              <div className="report-list-header">
                <div className="report-list-title">Danh sách báo cáo</div>

                <div className="report-list-count">
                  {filteredReports.length} báo cáo
                </div>
              </div>

              {loading && (
                <div className="report-loading">Đang tải dữ liệu...</div>
              )}

              {!loading && filteredReports.length === 0 && (
                <div className="report-empty">
                  {searchText.trim()
                    ? "Không tìm thấy báo cáo phù hợp."
                    : "Chưa có báo cáo."}
                </div>
              )}

              {!loading && filteredReports.length > 0 && (
                <div className="report-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>STT</th>

                        <th>Mã báo cáo</th>

                        <th>Tên báo cáo</th>

                        <th>Đường dẫn</th>

                        <th>Icon</th>

                        <th>Thứ tự</th>

                        <th>Trạng thái</th>

                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredReports.map((report, index) => (
                        <tr key={report.reportId}>
                          <td className="report-text-center">{index + 1}</td>

                          <td>
                            <button
                              type="button"
                              className="report-code-link"
                              onClick={() => handleEdit(report)}
                              title="Nhấn để sửa báo cáo"
                            >
                              {report.reportCode}
                            </button>
                          </td>

                          <td>{report.reportName}</td>

                          <td>
                            <code className="report-path">
                              {report.reportPath}
                            </code>
                          </td>

                          <td className="report-icon-cell">
                            {report.icon || "-"}
                          </td>

                          <td className="report-text-center">
                            {report.sortOrder}
                          </td>

                          <td>
                            <span
                              className={
                                report.isActive
                                  ? "report-status active"
                                  : "report-status inactive"
                              }
                            >
                              {report.isActive
                                ? "Đang sử dụng"
                                : "Ngừng sử dụng"}
                            </span>
                          </td>

                          <td>
                            <div className="report-actions">
                              <button
                                type="button"
                                className="report-btn-edit"
                                onClick={() => handleEdit(report)}
                                disabled={loading}
                              >
                                Sửa
                              </button>

                              <button
                                type="button"
                                className={
                                  report.isActive
                                    ? "report-btn-lock"
                                    : "report-btn-open"
                                }
                                onClick={() => void handleStatus(report)}
                                disabled={loading}
                              >
                                {report.isActive ? "Khóa" : "Mở"}
                              </button>

                              <button
                                type="button"
                                className="report-btn-delete"
                                onClick={() => void handleDelete(report)}
                                disabled={loading}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================================================
            FORM
        ==================================================== */}

        {activeTab === "FORM" && (
          <div className="report-form-card">
            <div className="report-form-title">
              {editingId === null ? "Thêm báo cáo" : "Cập nhật báo cáo"}
            </div>

            <div className="report-form-grid">
              {/* REPORT CODE */}

              <div className="report-form-group">
                <label>
                  Mã báo cáo <span>*</span>
                </label>

                <input
                  type="text"
                  value={form.reportCode}
                  onChange={(e) => handleChange("reportCode", e.target.value)}
                  placeholder="Ví dụ: PRODUCTION_PLAN"
                  maxLength={50}
                />
              </div>

              {/* REPORT NAME */}

              <div className="report-form-group">
                <label>
                  Tên báo cáo <span>*</span>
                </label>

                <input
                  type="text"
                  value={form.reportName}
                  onChange={(e) => handleChange("reportName", e.target.value)}
                  placeholder="Ví dụ: Báo cáo kế hoạch sản xuất"
                  maxLength={200}
                />
              </div>

              {/* PATH */}

              <div className="report-form-group">
                <label>
                  Đường dẫn <span>*</span>
                </label>

                <input
                  type="text"
                  value={form.reportPath}
                  onChange={(e) => handleChange("reportPath", e.target.value)}
                  placeholder="/reports/production-plan"
                  maxLength={300}
                />

                <div className="report-field-hint">
                  Đường dẫn trang frontend của báo cáo.
                </div>
              </div>

              {/* ICON */}

              <div className="report-form-group">
                <label>Icon</label>

                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => handleChange("icon", e.target.value)}
                  placeholder="Ví dụ: 📊"
                  maxLength={100}
                />

                <div className="report-field-hint">
                  Có thể nhập emoji hoặc tên icon.
                </div>
              </div>

              {/* SORT ORDER */}

              <div className="report-form-group">
                <label>Thứ tự</label>

                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => handleChange("sortOrder", e.target.value)}
                />
              </div>

              {/* STATUS */}

              <div className="report-form-group">
                <label>Trạng thái</label>

                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    handleChange("isActive", e.target.value === "true")
                  }
                >
                  <option value="true">Đang sử dụng</option>

                  <option value="false">Ngừng sử dụng</option>
                </select>
              </div>

              {/* DESCRIPTION */}

              <div className="report-form-group report-form-group-full">
                <label>Mô tả</label>

                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Nhập mô tả báo cáo..."
                  rows={5}
                  maxLength={500}
                />
              </div>
            </div>

            {/* =================================================
                FORM ACTION
            ================================================== */}

            <div className="report-form-actions">
              <button
                type="button"
                className="report-btn-primary"
                onClick={() => void handleSave()}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>

              <button
                type="button"
                className="report-btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportPage;
