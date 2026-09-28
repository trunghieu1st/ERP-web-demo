import { useEffect, useMemo, useState } from "react";
import "./FactoryReportPage.css";
import { apiFetch } from "../../../api/apiClient";

type TabType = "bulk" | "factory" | "report";

interface Factory {
  factoryId: number;
  factoryCode: string;
  factoryName: string;
}

interface Report {
  reportId: number;
  reportCode: string;
  reportName: string;
  reportPath: string;
  icon?: string | null;
  sortOrder: number;
  isActive?: boolean;
  description?: string | null;
}

interface FactoryReportItem extends Report {
  isAssigned: boolean;
}

interface FactoryReportResponse {
  factory: Factory;
  reports: FactoryReportItem[];
}

interface ReportFactoryItem extends Factory {
  isAssigned: boolean;
}

interface ReportFactoriesResponse {
  report: Report;
  factories: ReportFactoryItem[];
}

function FactoryReportPage() {
  // =========================================================
  // TAB
  // =========================================================

  const [activeTab, setActiveTab] =
    useState<TabType>("bulk");

  // =========================================================
  // MASTER DATA
  // =========================================================

  const [factories, setFactories] =
    useState<Factory[]>([]);

  const [reports, setReports] =
    useState<Report[]>([]);

  // =========================================================
  // TAB 1 - BULK
  // =========================================================

  const [
    bulkSelectedReportIds,
    setBulkSelectedReportIds,
  ] = useState<Set<number>>(new Set());

  const [
    bulkSelectedFactoryIds,
    setBulkSelectedFactoryIds,
  ] = useState<Set<number>>(new Set());

  const [
    factoryModalOpen,
    setFactoryModalOpen,
  ] = useState(false);

  const [
    factoryModalSearch,
    setFactoryModalSearch,
  ] = useState("");

  // =========================================================
  // TAB 2 - BY FACTORY
  // =========================================================

  const [factoryId, setFactoryId] =
    useState(0);

  const [
    factoryReportItems,
    setFactoryReportItems,
  ] = useState<FactoryReportItem[]>([]);

  const [
    selectedFactoryReportIds,
    setSelectedFactoryReportIds,
  ] = useState<Set<number>>(new Set());

  // =========================================================
  // TAB 3 - BY REPORT
  // =========================================================

  const [reportId, setReportId] =
    useState(0);

  const [
    reportFactoryItems,
    setReportFactoryItems,
  ] = useState<ReportFactoryItem[]>([]);

  const [
    selectedReportFactoryIds,
    setSelectedReportFactoryIds,
  ] = useState<Set<number>>(new Set());

  // =========================================================
  // UI
  // =========================================================

  const [searchText, setSearchText] =
    useState("");

  const [loadingMaster, setLoadingMaster] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // LOAD FACTORIES + REPORTS
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadMaster = async () => {
      try {
        setLoadingMaster(true);
        setError("");

        const [
          factoryResponse,
          reportResponse,
        ] = await Promise.all([
          apiFetch("/api/factories"),
          apiFetch("/api/reports"),
        ]);

        const factoryData =
          await factoryResponse
            .json()
            .catch(() => null);

        const reportData =
          await reportResponse
            .json()
            .catch(() => null);

        if (!factoryResponse.ok) {
          throw new Error(
            factoryData?.message ||
              "Không thể tải danh sách nhà máy.",
          );
        }

        if (!reportResponse.ok) {
          throw new Error(
            reportData?.message ||
              "Không thể tải danh sách báo cáo.",
          );
        }

        if (cancelled) {
          return;
        }

        const factoryList: Factory[] =
          Array.isArray(factoryData)
            ? factoryData
            : [];

        const reportList: Report[] =
          Array.isArray(reportData)
            ? reportData
            : [];

        // Chỉ dùng báo cáo đang hoạt động.
        // Nếu API /api/reports không trả isActive
        // thì vẫn giữ report đó.
        const activeReports =
          reportList
            .filter(
              (report) =>
                report.isActive !== false,
            )
            .sort((a, b) => {
              if (
                a.sortOrder !== b.sortOrder
              ) {
                return (
                  a.sortOrder -
                  b.sortOrder
                );
              }

              return a.reportName.localeCompare(
                b.reportName,
                "vi",
              );
            });

        setFactories(factoryList);
        setReports(activeReports);

        if (factoryList.length > 0) {
          setFactoryId(
            factoryList[0].factoryId,
          );
        }

        if (activeReports.length > 0) {
          setReportId(
            activeReports[0].reportId,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải dữ liệu.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMaster(false);
        }
      }
    };

    void loadMaster();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // TAB 2
  // LOAD REPORTS BY FACTORY
  // =========================================================

  useEffect(() => {
    if (
      activeTab !== "factory" ||
      factoryId <= 0
    ) {
      return;
    }

    let cancelled = false;

    const loadByFactory = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await apiFetch(
          `/api/factory-reports?factoryId=${factoryId}`,
        );

        const data: FactoryReportResponse | null =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { message?: string } | null)
              ?.message ||
              "Không thể tải phân quyền nhà máy.",
          );
        }

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(data?.reports)
            ? data.reports
            : [];

        setFactoryReportItems(list);

        setSelectedFactoryReportIds(
          new Set(
            list
              .filter(
                (report) =>
                  report.isAssigned,
              )
              .map(
                (report) =>
                  report.reportId,
              ),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setFactoryReportItems([]);

          setSelectedFactoryReportIds(
            new Set(),
          );

          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải phân quyền nhà máy.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadByFactory();

    return () => {
      cancelled = true;
    };
  }, [activeTab, factoryId]);

  // =========================================================
  // TAB 3
  // LOAD FACTORIES BY REPORT
  // =========================================================

  useEffect(() => {
    if (
      activeTab !== "report" ||
      reportId <= 0
    ) {
      return;
    }

    let cancelled = false;

    const loadByReport = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await apiFetch(
          `/api/factory-reports/by-report?reportId=${reportId}`,
        );

        const data: ReportFactoriesResponse | null =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { message?: string } | null)
              ?.message ||
              "Không thể tải danh sách nhà máy.",
          );
        }

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(data?.factories)
            ? data.factories
            : [];

        setReportFactoryItems(list);

        setSelectedReportFactoryIds(
          new Set(
            list
              .filter(
                (factory) =>
                  factory.isAssigned,
              )
              .map(
                (factory) =>
                  factory.factoryId,
              ),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setReportFactoryItems([]);

          setSelectedReportFactoryIds(
            new Set(),
          );

          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách nhà máy.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadByReport();

    return () => {
      cancelled = true;
    };
  }, [activeTab, reportId]);

  // =========================================================
  // FILTER - TAB 1
  // =========================================================

  const filteredBulkReports =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return reports;
      }

      return reports.filter(
        (report) =>
          report.reportCode
            .toLowerCase()
            .includes(keyword) ||
          report.reportName
            .toLowerCase()
            .includes(keyword) ||
          report.reportPath
            .toLowerCase()
            .includes(keyword),
      );
    }, [reports, searchText]);

  // =========================================================
  // FILTER - TAB 2
  // =========================================================

  const filteredFactoryReports =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return factoryReportItems;
      }

      return factoryReportItems.filter(
        (report) =>
          report.reportCode
            .toLowerCase()
            .includes(keyword) ||
          report.reportName
            .toLowerCase()
            .includes(keyword) ||
          report.reportPath
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      factoryReportItems,
      searchText,
    ]);

  // =========================================================
  // FILTER - TAB 3
  // =========================================================

  const filteredReportFactories =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return reportFactoryItems;
      }

      return reportFactoryItems.filter(
        (factory) =>
          factory.factoryCode
            .toLowerCase()
            .includes(keyword) ||
          factory.factoryName
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      reportFactoryItems,
      searchText,
    ]);

  // =========================================================
  // FILTER FACTORY MODAL
  // =========================================================

  const filteredModalFactories =
    useMemo(() => {
      const keyword =
        factoryModalSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return factories;
      }

      return factories.filter(
        (factory) =>
          factory.factoryCode
            .toLowerCase()
            .includes(keyword) ||
          factory.factoryName
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      factories,
      factoryModalSearch,
    ]);

  // =========================================================
  // TAB 1 - TOGGLE REPORT
  // =========================================================

  const toggleBulkReport = (
    id: number,
  ) => {
    setBulkSelectedReportIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      },
    );
  };

  const allBulkReportsSelected =
    filteredBulkReports.length > 0 &&
    filteredBulkReports.every(
      (report) =>
        bulkSelectedReportIds.has(
          report.reportId,
        ),
    );

  const toggleAllBulkReports =
    () => {
      setBulkSelectedReportIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredBulkReports.every(
              (report) =>
                next.has(
                  report.reportId,
                ),
            );

          filteredBulkReports.forEach(
            (report) => {
              if (shouldSelect) {
                next.add(
                  report.reportId,
                );
              } else {
                next.delete(
                  report.reportId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  // =========================================================
  // TAB 1 - FACTORY MODAL
  // =========================================================

  const openFactoryModal = () => {
    setError("");
    setSuccess("");

    if (
      bulkSelectedReportIds.size === 0
    ) {
      setError(
        "Vui lòng chọn ít nhất một báo cáo.",
      );
      return;
    }

    setBulkSelectedFactoryIds(
      new Set(),
    );

    setFactoryModalSearch("");

    setFactoryModalOpen(true);
  };

  const closeFactoryModal = () => {
    if (saving) {
      return;
    }

    setFactoryModalOpen(false);

    setBulkSelectedFactoryIds(
      new Set(),
    );

    setFactoryModalSearch("");
  };

  const toggleBulkFactory = (
    id: number,
  ) => {
    setBulkSelectedFactoryIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      },
    );
  };

  const allModalFactoriesSelected =
    filteredModalFactories.length > 0 &&
    filteredModalFactories.every(
      (factory) =>
        bulkSelectedFactoryIds.has(
          factory.factoryId,
        ),
    );

  const toggleAllModalFactories =
    () => {
      setBulkSelectedFactoryIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredModalFactories.every(
              (factory) =>
                next.has(
                  factory.factoryId,
                ),
            );

          filteredModalFactories.forEach(
            (factory) => {
              if (shouldSelect) {
                next.add(
                  factory.factoryId,
                );
              } else {
                next.delete(
                  factory.factoryId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  // =========================================================
  // TAB 1 - BULK ASSIGN
  // =========================================================

  const assignBulk = async () => {
    if (
      bulkSelectedReportIds.size === 0
    ) {
      setError(
        "Vui lòng chọn ít nhất một báo cáo.",
      );
      return;
    }

    if (
      bulkSelectedFactoryIds.size === 0
    ) {
      setError(
        "Vui lòng chọn ít nhất một nhà máy.",
      );
      return;
    }

    const reportCount =
      bulkSelectedReportIds.size;

    const factoryCount =
      bulkSelectedFactoryIds.size;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          "/api/factory-reports/assign",
          {
            method: "POST",

            body: JSON.stringify({
              reportIds:
                Array.from(
                  bulkSelectedReportIds,
                ),

              factoryIds:
                Array.from(
                  bulkSelectedFactoryIds,
                ),
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Không thể phân quyền báo cáo.",
        );
      }

      setFactoryModalOpen(false);

      setBulkSelectedReportIds(
        new Set(),
      );

      setBulkSelectedFactoryIds(
        new Set(),
      );

      setFactoryModalSearch("");

      setSuccess(
        `Đã cấp ${reportCount} báo cáo cho ${factoryCount} nhà máy thành công.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể phân quyền báo cáo.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TAB 2 - TOGGLE REPORT
  // =========================================================

  const toggleFactoryReport = (
    id: number,
  ) => {
    setSelectedFactoryReportIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      },
    );
  };

  const allFactoryReportsSelected =
    filteredFactoryReports.length >
      0 &&
    filteredFactoryReports.every(
      (report) =>
        selectedFactoryReportIds.has(
          report.reportId,
        ),
    );

  const toggleAllFactoryReports =
    () => {
      setSelectedFactoryReportIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredFactoryReports.every(
              (report) =>
                next.has(
                  report.reportId,
                ),
            );

          filteredFactoryReports.forEach(
            (report) => {
              if (shouldSelect) {
                next.add(
                  report.reportId,
                );
              } else {
                next.delete(
                  report.reportId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  // =========================================================
  // TAB 2 - SAVE
  // =========================================================

  const saveByFactory = async () => {
    if (factoryId <= 0) {
      setError(
        "Vui lòng chọn nhà máy.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          "/api/factory-reports",
          {
            method: "PUT",

            body: JSON.stringify({
              factoryId,

              reportIds:
                Array.from(
                  selectedFactoryReportIds,
                ),
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Không thể lưu phân quyền.",
        );
      }

      setSuccess(
        "Lưu phân quyền theo nhà máy thành công.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu phân quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TAB 3 - TOGGLE FACTORY
  // =========================================================

  const toggleReportFactory = (
    id: number,
  ) => {
    setSelectedReportFactoryIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      },
    );
  };

  const allReportFactoriesSelected =
    filteredReportFactories.length >
      0 &&
    filteredReportFactories.every(
      (factory) =>
        selectedReportFactoryIds.has(
          factory.factoryId,
        ),
    );

  const toggleAllReportFactories =
    () => {
      setSelectedReportFactoryIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredReportFactories.every(
              (factory) =>
                next.has(
                  factory.factoryId,
                ),
            );

          filteredReportFactories.forEach(
            (factory) => {
              if (shouldSelect) {
                next.add(
                  factory.factoryId,
                );
              } else {
                next.delete(
                  factory.factoryId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  // =========================================================
  // TAB 3 - SAVE
  // =========================================================

  const saveByReport = async () => {
    if (reportId <= 0) {
      setError(
        "Vui lòng chọn báo cáo.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          "/api/factory-reports/by-report",
          {
            method: "PUT",

            body: JSON.stringify({
              reportId,

              factoryIds:
                Array.from(
                  selectedReportFactoryIds,
                ),
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Không thể lưu phân quyền.",
        );
      }

      setSuccess(
        "Lưu phân quyền theo báo cáo thành công.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu phân quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TAB CHANGE
  // =========================================================

  const changeTab = (
    tab: TabType,
  ) => {
    setActiveTab(tab);

    setSearchText("");
    setError("");
    setSuccess("");
  };

  // =========================================================
  // CURRENT FACTORY / REPORT
  // =========================================================

  const currentFactory =
    factories.find(
      (factory) =>
        factory.factoryId === factoryId,
    );

  const currentReport =
    reports.find(
      (report) =>
        report.reportId === reportId,
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="factory-report-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="factory-report-page-header">
        <h1>
          Phân quyền báo cáo cho nhà máy
        </h1>

        <p>
          Cấp quyền hàng loạt hoặc quản lý
          quyền báo cáo theo nhà máy và báo cáo.
        </p>
      </div>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="factory-report-tabs">
        <button
          type="button"
          className={
            activeTab === "bulk"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("bulk")
          }
        >
          Cấp quyền hàng loạt
        </button>

        <button
          type="button"
          className={
            activeTab === "factory"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("factory")
          }
        >
          Theo nhà máy
        </button>

        <button
          type="button"
          className={
            activeTab === "report"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("report")
          }
        >
          Theo báo cáo
        </button>
      </div>

      {/* =====================================================
          FILTER
      ====================================================== */}

      <section className="factory-report-filter-card">
        <div
          className={`factory-report-filter-grid ${
            activeTab === "bulk"
              ? "bulk"
              : ""
          }`}
        >
          {/* TAB 2 - FACTORY */}

          {activeTab === "factory" && (
            <div className="factory-report-field">
              <label>Nhà máy</label>

              <select
                value={factoryId}
                disabled={loadingMaster}
                onChange={(event) => {
                  setFactoryId(
                    Number(
                      event.target.value,
                    ),
                  );

                  setSearchText("");
                  setError("");
                  setSuccess("");
                }}
              >
                {factories.length ===
                  0 && (
                  <option value={0}>
                    Chưa có nhà máy
                  </option>
                )}

                {factories.map(
                  (factory) => (
                    <option
                      key={
                        factory.factoryId
                      }
                      value={
                        factory.factoryId
                      }
                    >
                      {
                        factory.factoryCode
                      }{" "}
                      -{" "}
                      {
                        factory.factoryName
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {/* TAB 3 - REPORT */}

          {activeTab === "report" && (
            <div className="factory-report-field">
              <label>Báo cáo</label>

              <select
                value={reportId}
                disabled={
                  loadingMaster ||
                  reports.length === 0
                }
                onChange={(event) => {
                  setReportId(
                    Number(
                      event.target.value,
                    ),
                  );

                  setSearchText("");
                  setError("");
                  setSuccess("");
                }}
              >
                {reports.length === 0 && (
                  <option value={0}>
                    Chưa có báo cáo
                  </option>
                )}

                {reports.map(
                  (report) => (
                    <option
                      key={
                        report.reportId
                      }
                      value={
                        report.reportId
                      }
                    >
                      {
                        report.reportCode
                      }{" "}
                      -{" "}
                      {
                        report.reportName
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {/* SEARCH */}

          <div className="factory-report-field">
            <label>
              {activeTab === "report"
                ? "Tìm nhà máy"
                : "Tìm báo cáo"}
            </label>

            <input
              type="text"
              value={searchText}
              placeholder={
                activeTab === "report"
                  ? "Nhập mã hoặc tên nhà máy..."
                  : "Nhập mã, tên hoặc đường dẫn báo cáo..."
              }
              onChange={(event) =>
                setSearchText(
                  event.target.value,
                )
              }
            />
          </div>
        </div>

        {/* INFO TAB 2 */}

        {activeTab === "factory" && (
          <div className="factory-report-current-info">
            Đang phân quyền cho:{" "}
            <strong>
              {currentFactory
                ? `${currentFactory.factoryCode} - ${currentFactory.factoryName}`
                : "-"}
            </strong>
          </div>
        )}

        {/* INFO TAB 3 */}

        {activeTab === "report" && (
          <div className="factory-report-current-info">
            Đang xem báo cáo:{" "}
            <strong>
              {currentReport
                ? `${currentReport.reportCode} - ${currentReport.reportName}`
                : "-"}
            </strong>
          </div>
        )}

        {/* INFO TAB 1 */}

        {activeTab === "bulk" && (
          <div className="factory-report-current-info">
            Chọn một hoặc nhiều báo cáo,
            sau đó nhấn{" "}
            <strong>Chọn nhà máy</strong>{" "}
            để cấp quyền hàng loạt.
          </div>
        )}
      </section>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {error && (
        <div className="factory-report-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="factory-report-message success">
          {success}
        </div>
      )}

      {/* =====================================================
          TAB 1 - BULK
      ====================================================== */}

      {activeTab === "bulk" && (
        <section className="factory-report-list-card">
          <div className="factory-report-list-header">
            <div>
              <h2>
                Danh sách báo cáo
              </h2>

              <span>
                Đã chọn{" "}
                {
                  bulkSelectedReportIds.size
                }{" "}
                / {reports.length} báo cáo
              </span>
            </div>

            <button
              type="button"
              className="factory-report-primary-button"
              disabled={
                loadingMaster ||
                bulkSelectedReportIds.size ===
                  0
              }
              onClick={openFactoryModal}
            >
              Chọn nhà máy
            </button>
          </div>

          <div className="factory-report-table-wrapper">
            <table className="factory-report-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allBulkReportsSelected
                      }
                      disabled={
                        filteredBulkReports.length ===
                        0
                      }
                      onChange={
                        toggleAllBulkReports
                      }
                    />
                  </th>

                  <th className="stt-column">
                    STT
                  </th>

                  <th>Mã báo cáo</th>

                  <th>Tên báo cáo</th>

                  <th>Đường dẫn</th>
                </tr>
              </thead>

              <tbody>
                {loadingMaster ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="factory-report-empty"
                    >
                      Đang tải báo cáo...
                    </td>
                  </tr>
                ) : filteredBulkReports.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="factory-report-empty"
                    >
                      Không có báo cáo.
                    </td>
                  </tr>
                ) : (
                  filteredBulkReports.map(
                    (report, index) => {
                      const checked =
                        bulkSelectedReportIds.has(
                          report.reportId,
                        );

                      return (
                        <tr
                          key={
                            report.reportId
                          }
                          className={
                            checked
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            toggleBulkReport(
                              report.reportId,
                            )
                          }
                        >
                          <td
                            className="checkbox-column"
                            onClick={(
                              event,
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleBulkReport(
                                  report.reportId,
                                )
                              }
                            />
                          </td>

                          <td className="stt-column">
                            {index + 1}
                          </td>

                          <td>
                            <span className="factory-report-code">
                              {
                                report.reportCode
                              }
                            </span>
                          </td>

                          <td>
                            {
                              report.reportName
                            }
                          </td>

                          <td>
                            <span className="factory-report-path">
                              {
                                report.reportPath
                              }
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="factory-report-footer">
            Hiển thị{" "}
            {filteredBulkReports.length} /{" "}
            {reports.length} báo cáo
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 2 - BY FACTORY
      ====================================================== */}

      {activeTab === "factory" && (
        <section className="factory-report-list-card">
          <div className="factory-report-list-header">
            <div>
              <h2>
                Báo cáo của nhà máy
              </h2>

              <span>
                Đã cấp{" "}
                {
                  selectedFactoryReportIds.size
                }{" "}
                /{" "}
                {
                  factoryReportItems.length
                }{" "}
                báo cáo
              </span>
            </div>

            <button
              type="button"
              className="factory-report-primary-button"
              disabled={
                saving ||
                loading ||
                factoryId <= 0
              }
              onClick={() =>
                void saveByFactory()
              }
            >
              {saving
                ? "Đang lưu..."
                : "Lưu phân quyền"}
            </button>
          </div>

          <div className="factory-report-table-wrapper">
            <table className="factory-report-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allFactoryReportsSelected
                      }
                      disabled={
                        filteredFactoryReports.length ===
                        0
                      }
                      onChange={
                        toggleAllFactoryReports
                      }
                    />
                  </th>

                  <th className="stt-column">
                    STT
                  </th>

                  <th>Mã báo cáo</th>
                  <th>Tên báo cáo</th>
                  <th>Đường dẫn</th>

                  <th className="status-column">
                    Trạng thái quyền
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="factory-report-empty"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredFactoryReports.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="factory-report-empty"
                    >
                      Không có báo cáo.
                    </td>
                  </tr>
                ) : (
                  filteredFactoryReports.map(
                    (report, index) => {
                      const checked =
                        selectedFactoryReportIds.has(
                          report.reportId,
                        );

                      return (
                        <tr
                          key={
                            report.reportId
                          }
                          className={
                            checked
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            toggleFactoryReport(
                              report.reportId,
                            )
                          }
                        >
                          <td
                            className="checkbox-column"
                            onClick={(
                              event,
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleFactoryReport(
                                  report.reportId,
                                )
                              }
                            />
                          </td>

                          <td className="stt-column">
                            {index + 1}
                          </td>

                          <td>
                            <span className="factory-report-code">
                              {
                                report.reportCode
                              }
                            </span>
                          </td>

                          <td>
                            {
                              report.reportName
                            }
                          </td>

                          <td>
                            <span className="factory-report-path">
                              {
                                report.reportPath
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                checked
                                  ? "factory-report-status active"
                                  : "factory-report-status inactive"
                              }
                            >
                              {checked
                                ? "Đã cấp quyền"
                                : "Chưa cấp quyền"}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="factory-report-footer">
            Hiển thị{" "}
            {
              filteredFactoryReports.length
            }{" "}
            /{" "}
            {factoryReportItems.length} báo cáo
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 3 - BY REPORT
      ====================================================== */}

      {activeTab === "report" && (
        <section className="factory-report-list-card">
          <div className="factory-report-list-header">
            <div>
              <h2>
                Nhà máy sử dụng báo cáo
              </h2>

              <span>
                Đã cấp{" "}
                {
                  selectedReportFactoryIds.size
                }{" "}
                /{" "}
                {
                  reportFactoryItems.length
                }{" "}
                nhà máy
              </span>
            </div>

            <button
              type="button"
              className="factory-report-primary-button"
              disabled={
                saving ||
                loading ||
                reportId <= 0
              }
              onClick={() =>
                void saveByReport()
              }
            >
              {saving
                ? "Đang lưu..."
                : "Lưu phân quyền"}
            </button>
          </div>

          <div className="factory-report-table-wrapper">
            <table className="factory-report-table factory-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allReportFactoriesSelected
                      }
                      disabled={
                        filteredReportFactories.length ===
                        0
                      }
                      onChange={
                        toggleAllReportFactories
                      }
                    />
                  </th>

                  <th className="stt-column">
                    STT
                  </th>

                  <th>Mã nhà máy</th>

                  <th>Tên nhà máy</th>

                  <th className="status-column">
                    Trạng thái quyền
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="factory-report-empty"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredReportFactories.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="factory-report-empty"
                    >
                      Không có nhà máy.
                    </td>
                  </tr>
                ) : (
                  filteredReportFactories.map(
                    (factory, index) => {
                      const checked =
                        selectedReportFactoryIds.has(
                          factory.factoryId,
                        );

                      return (
                        <tr
                          key={
                            factory.factoryId
                          }
                          className={
                            checked
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            toggleReportFactory(
                              factory.factoryId,
                            )
                          }
                        >
                          <td
                            className="checkbox-column"
                            onClick={(
                              event,
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleReportFactory(
                                  factory.factoryId,
                                )
                              }
                            />
                          </td>

                          <td className="stt-column">
                            {index + 1}
                          </td>

                          <td>
                            <span className="factory-report-code">
                              {
                                factory.factoryCode
                              }
                            </span>
                          </td>

                          <td>
                            {
                              factory.factoryName
                            }
                          </td>

                          <td>
                            <span
                              className={
                                checked
                                  ? "factory-report-status active"
                                  : "factory-report-status inactive"
                              }
                            >
                              {checked
                                ? "Đã cấp quyền"
                                : "Chưa cấp quyền"}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="factory-report-footer">
            Hiển thị{" "}
            {
              filteredReportFactories.length
            }{" "}
            /{" "}
            {reportFactoryItems.length} nhà máy
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 1 - FACTORY MODAL
      ====================================================== */}

      {factoryModalOpen && (
        <div
          className="factory-report-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeFactoryModal();
            }
          }}
        >
          <div className="factory-report-modal">
            {/* HEADER */}

            <div className="factory-report-modal-header">
              <div>
                <h2>Chọn nhà máy</h2>

                <p>
                  Chọn các nhà máy được sử dụng
                  những báo cáo đã chọn.
                </p>
              </div>

              <button
                type="button"
                className="factory-report-modal-close"
                disabled={saving}
                onClick={closeFactoryModal}
              >
                ×
              </button>
            </div>

            {/* SUMMARY */}

            <div className="factory-report-modal-summary">
              <div>
                <span>
                  Báo cáo đã chọn
                </span>

                <strong>
                  {
                    bulkSelectedReportIds.size
                  }
                </strong>
              </div>

              <div>
                <span>
                  Nhà máy đã chọn
                </span>

                <strong>
                  {
                    bulkSelectedFactoryIds.size
                  }
                </strong>
              </div>
            </div>

            {/* SEARCH */}

            <div className="factory-report-modal-search">
              <input
                type="text"
                value={factoryModalSearch}
                placeholder="Tìm mã hoặc tên nhà máy..."
                onChange={(event) =>
                  setFactoryModalSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            {/* SELECT ALL */}

            <label className="factory-report-modal-select-all">
              <input
                type="checkbox"
                checked={
                  allModalFactoriesSelected
                }
                disabled={
                  filteredModalFactories.length ===
                  0
                }
                onChange={
                  toggleAllModalFactories
                }
              />

              <span>
                Chọn tất cả nhà máy đang
                hiển thị
              </span>
            </label>

            {/* FACTORY LIST */}

            <div className="factory-report-modal-list">
              {filteredModalFactories.length ===
              0 ? (
                <div className="factory-report-modal-empty">
                  Không có nhà máy.
                </div>
              ) : (
                filteredModalFactories.map(
                  (factory) => {
                    const checked =
                      bulkSelectedFactoryIds.has(
                        factory.factoryId,
                      );

                    return (
                      <label
                        key={
                          factory.factoryId
                        }
                        className={`factory-report-modal-item ${
                          checked
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleBulkFactory(
                              factory.factoryId,
                            )
                          }
                        />

                        <div>
                          <strong>
                            {
                              factory.factoryCode
                            }
                          </strong>

                          <span>
                            {
                              factory.factoryName
                            }
                          </span>
                        </div>
                      </label>
                    );
                  },
                )
              )}
            </div>

            {/* ACTIONS */}

            <div className="factory-report-modal-actions">
              <button
                type="button"
                className="factory-report-cancel-button"
                disabled={saving}
                onClick={closeFactoryModal}
              >
                Hủy
              </button>

              <button
                type="button"
                className="factory-report-primary-button"
                disabled={
                  saving ||
                  bulkSelectedFactoryIds.size ===
                    0
                }
                onClick={() =>
                  void assignBulk()
                }
              >
                {saving
                  ? "Đang phân quyền..."
                  : "Phân quyền"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactoryReportPage;