import { useEffect, useMemo, useState } from "react";
import "./DepartmentReportPage.css";
import { apiFetch } from "../../../api/apiClient";

type TabType = "bulk" | "department" | "report";

interface Factory {
  factoryId: number;
  factoryCode: string;
  factoryName: string;
}

interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
}

interface Report {
  reportId: number;
  reportCode: string;
  reportName: string;
  reportPath: string;
  icon?: string | null;
  sortOrder: number;
}

interface DepartmentReportItem extends Report {
  isAssigned: boolean;
}

interface DepartmentReportResponse {
  factory: Factory;
  department: Department;
  reports: DepartmentReportItem[];
}

interface FactoryReportsResponse {
  factory: Factory;
  reports: Report[];
}

interface ReportDepartmentItem extends Department {
  isAssigned: boolean;
}

interface ReportDepartmentsResponse {
  factory: Factory;
  report: Report;
  departments: ReportDepartmentItem[];
}

function DepartmentReportPage() {
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

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [factoryReports, setFactoryReports] =
    useState<Report[]>([]);

  // =========================================================
  // COMMON SELECTED
  // =========================================================

  const [factoryId, setFactoryId] =
    useState(0);

  const [departmentId, setDepartmentId] =
    useState(0);

  const [reportId, setReportId] =
    useState(0);

  // =========================================================
  // TAB 1 - BULK
  // =========================================================

  const [
    bulkSelectedReportIds,
    setBulkSelectedReportIds,
  ] = useState<Set<number>>(new Set());

  const [
    bulkSelectedDepartmentIds,
    setBulkSelectedDepartmentIds,
  ] = useState<Set<number>>(new Set());

  const [
    departmentModalOpen,
    setDepartmentModalOpen,
  ] = useState(false);

  const [
    departmentModalSearch,
    setDepartmentModalSearch,
  ] = useState("");

  // =========================================================
  // TAB 2 - BY DEPARTMENT
  // =========================================================

  const [
    departmentReports,
    setDepartmentReports,
  ] = useState<DepartmentReportItem[]>([]);

  const [
    selectedDepartmentReportIds,
    setSelectedDepartmentReportIds,
  ] = useState<Set<number>>(new Set());

  // =========================================================
  // TAB 3 - BY REPORT
  // =========================================================

  const [
    reportDepartments,
    setReportDepartments,
  ] = useState<ReportDepartmentItem[]>([]);

  const [
    selectedReportDepartmentIds,
    setSelectedReportDepartmentIds,
  ] = useState<Set<number>>(new Set());

  // =========================================================
  // UI
  // =========================================================

  const [searchText, setSearchText] =
    useState("");

  const [loadingMaster, setLoadingMaster] =
    useState(false);

  const [loadingFactoryReports, setLoadingFactoryReports] =
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
  // LOAD MASTER
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadMaster = async () => {
      try {
        setLoadingMaster(true);
        setError("");

        const [
          factoryResponse,
          departmentResponse,
        ] = await Promise.all([
          apiFetch("/api/factories"),
          apiFetch("/api/departments"),
        ]);

        const factoryData =
          await factoryResponse
            .json()
            .catch(() => null);

        const departmentData =
          await departmentResponse
            .json()
            .catch(() => null);

        if (!factoryResponse.ok) {
          throw new Error(
            factoryData?.message ||
              "Không thể tải danh sách nhà máy.",
          );
        }

        if (!departmentResponse.ok) {
          throw new Error(
            departmentData?.message ||
              "Không thể tải danh sách phòng ban.",
          );
        }

        if (cancelled) {
          return;
        }

        const factoryList: Factory[] =
          Array.isArray(factoryData)
            ? factoryData
            : [];

        const departmentList: Department[] =
          Array.isArray(departmentData)
            ? departmentData
            : [];

        setFactories(factoryList);
        setDepartments(departmentList);

        if (factoryList.length > 0) {
          setFactoryId(
            factoryList[0].factoryId,
          );
        }

        if (departmentList.length > 0) {
          setDepartmentId(
            departmentList[0].departmentId,
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
  // LOAD FACTORY REPORTS
  //
  // Dùng cho:
  // - Tab 1: danh sách report để chọn hàng loạt
  // - Tab 3: dropdown chọn report
  // =========================================================

  useEffect(() => {
    if (factoryId <= 0) {
      setFactoryReports([]);
      setReportId(0);
      setBulkSelectedReportIds(new Set());
      return;
    }

    let cancelled = false;

    const loadFactoryReports = async () => {
      try {
        setLoadingFactoryReports(true);
        setError("");

        const response = await apiFetch(
          `/api/department-reports/factory-reports?factoryId=${factoryId}`,
        );

        const data: FactoryReportsResponse | null =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { message?: string } | null)
              ?.message ||
              "Không thể tải báo cáo của nhà máy.",
          );
        }

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(data?.reports)
            ? data.reports
            : [];

        setFactoryReports(list);

        // Khi đổi nhà máy:
        // bỏ lựa chọn hàng loạt cũ.
        setBulkSelectedReportIds(
          new Set(),
        );

        setBulkSelectedDepartmentIds(
          new Set(),
        );

        setReportId((current) => {
          if (
            current > 0 &&
            list.some(
              (report) =>
                report.reportId === current,
            )
          ) {
            return current;
          }

          return list.length > 0
            ? list[0].reportId
            : 0;
        });
      } catch (err) {
        if (!cancelled) {
          setFactoryReports([]);
          setReportId(0);
          setBulkSelectedReportIds(
            new Set(),
          );

          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải báo cáo.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFactoryReports(false);
        }
      }
    };

    void loadFactoryReports();

    return () => {
      cancelled = true;
    };
  }, [factoryId]);

  // =========================================================
  // TAB 2 - LOAD REPORTS BY DEPARTMENT
  // =========================================================

  useEffect(() => {
    if (
      activeTab !== "department" ||
      factoryId <= 0 ||
      departmentId <= 0
    ) {
      return;
    }

    let cancelled = false;

    const loadDepartmentReports = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await apiFetch(
          `/api/department-reports?factoryId=${factoryId}&departmentId=${departmentId}`,
        );

        const data: DepartmentReportResponse | null =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { message?: string } | null)
              ?.message ||
              "Không thể tải phân quyền phòng ban.",
          );
        }

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(data?.reports)
            ? data.reports
            : [];

        setDepartmentReports(list);

        setSelectedDepartmentReportIds(
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
          setDepartmentReports([]);

          setSelectedDepartmentReportIds(
            new Set(),
          );

          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải phân quyền.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDepartmentReports();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    factoryId,
    departmentId,
  ]);

  // =========================================================
  // TAB 3 - LOAD DEPARTMENTS BY REPORT
  // =========================================================

  useEffect(() => {
    if (
      activeTab !== "report" ||
      factoryId <= 0 ||
      reportId <= 0
    ) {
      return;
    }

    let cancelled = false;

    const loadReportDepartments = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await apiFetch(
          `/api/department-reports/by-report?factoryId=${factoryId}&reportId=${reportId}`,
        );

        const data: ReportDepartmentsResponse | null =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { message?: string } | null)
              ?.message ||
              "Không thể tải phòng ban.",
          );
        }

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(data?.departments)
            ? data.departments
            : [];

        setReportDepartments(list);

        setSelectedReportDepartmentIds(
          new Set(
            list
              .filter(
                (department) =>
                  department.isAssigned,
              )
              .map(
                (department) =>
                  department.departmentId,
              ),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setReportDepartments([]);

          setSelectedReportDepartmentIds(
            new Set(),
          );

          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải phòng ban.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReportDepartments();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    factoryId,
    reportId,
  ]);

  // =========================================================
  // FILTER REPORTS
  // =========================================================

  const filteredFactoryReports =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return factoryReports;
      }

      return factoryReports.filter(
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
      factoryReports,
      searchText,
    ]);

  const filteredDepartmentReports =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return departmentReports;
      }

      return departmentReports.filter(
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
      departmentReports,
      searchText,
    ]);

  const filteredReportDepartments =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      if (!keyword) {
        return reportDepartments;
      }

      return reportDepartments.filter(
        (department) =>
          department.departmentCode
            .toLowerCase()
            .includes(keyword) ||
          department.departmentName
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      reportDepartments,
      searchText,
    ]);

  const filteredModalDepartments =
    useMemo(() => {
      const keyword =
        departmentModalSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return departments;
      }

      return departments.filter(
        (department) =>
          department.departmentCode
            .toLowerCase()
            .includes(keyword) ||
          department.departmentName
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      departments,
      departmentModalSearch,
    ]);

  // =========================================================
  // TAB 1 - BULK REPORT TOGGLE
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
    filteredFactoryReports.length > 0 &&
    filteredFactoryReports.every(
      (report) =>
        bulkSelectedReportIds.has(
          report.reportId,
        ),
    );

  const toggleAllBulkReports = () => {
    setBulkSelectedReportIds(
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
  // BULK MODAL
  // =========================================================

  const openBulkDepartmentModal = () => {
    setError("");
    setSuccess("");

    if (factoryId <= 0) {
      setError(
        "Vui lòng chọn nhà máy.",
      );
      return;
    }

    if (
      bulkSelectedReportIds.size ===
      0
    ) {
      setError(
        "Vui lòng chọn ít nhất một báo cáo.",
      );
      return;
    }

    setBulkSelectedDepartmentIds(
      new Set(),
    );

    setDepartmentModalSearch("");

    setDepartmentModalOpen(true);
  };

  const closeBulkDepartmentModal =
    () => {
      if (saving) {
        return;
      }

      setDepartmentModalOpen(false);

      setBulkSelectedDepartmentIds(
        new Set(),
      );

      setDepartmentModalSearch("");
    };

  const toggleBulkDepartment = (
    id: number,
  ) => {
    setBulkSelectedDepartmentIds(
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

  const allModalDepartmentsSelected =
    filteredModalDepartments.length >
      0 &&
    filteredModalDepartments.every(
      (department) =>
        bulkSelectedDepartmentIds.has(
          department.departmentId,
        ),
    );

  const toggleAllModalDepartments =
    () => {
      setBulkSelectedDepartmentIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredModalDepartments.every(
              (department) =>
                next.has(
                  department.departmentId,
                ),
            );

          filteredModalDepartments.forEach(
            (department) => {
              if (shouldSelect) {
                next.add(
                  department.departmentId,
                );
              } else {
                next.delete(
                  department.departmentId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  // =========================================================
  // BULK ASSIGN
  // =========================================================

  const assignBulk = async () => {
    if (
      bulkSelectedReportIds.size ===
      0
    ) {
      setError(
        "Vui lòng chọn ít nhất một báo cáo.",
      );
      return;
    }

    if (
      bulkSelectedDepartmentIds.size ===
      0
    ) {
      setError(
        "Vui lòng chọn ít nhất một phòng ban.",
      );
      return;
    }

    const reportCount =
      bulkSelectedReportIds.size;

    const departmentCount =
      bulkSelectedDepartmentIds.size;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          "/api/department-reports/assign",
          {
            method: "POST",

            body: JSON.stringify({
              factoryId,

              reportIds:
                Array.from(
                  bulkSelectedReportIds,
                ),

              departmentIds:
                Array.from(
                  bulkSelectedDepartmentIds,
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
            "Không thể phân quyền.",
        );
      }

      setDepartmentModalOpen(false);

      setBulkSelectedReportIds(
        new Set(),
      );

      setBulkSelectedDepartmentIds(
        new Set(),
      );

      setDepartmentModalSearch("");

      setSuccess(
        `Đã cấp ${reportCount} báo cáo cho ${departmentCount} phòng ban thành công.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể phân quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TAB 2
  // =========================================================

  const toggleDepartmentReport = (
    id: number,
  ) => {
    setSelectedDepartmentReportIds(
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

  const allDepartmentReportsSelected =
    filteredDepartmentReports.length >
      0 &&
    filteredDepartmentReports.every(
      (report) =>
        selectedDepartmentReportIds.has(
          report.reportId,
        ),
    );

  const toggleAllDepartmentReports =
    () => {
      setSelectedDepartmentReportIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredDepartmentReports.every(
              (report) =>
                next.has(
                  report.reportId,
                ),
            );

          filteredDepartmentReports.forEach(
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

  const saveByDepartment =
    async () => {
      if (
        factoryId <= 0 ||
        departmentId <= 0
      ) {
        setError(
          "Vui lòng chọn nhà máy và phòng ban.",
        );
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await apiFetch(
            "/api/department-reports",
            {
              method: "PUT",

              body: JSON.stringify({
                factoryId,
                departmentId,

                reportIds:
                  Array.from(
                    selectedDepartmentReportIds,
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
          "Lưu phân quyền theo phòng ban thành công.",
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
  // TAB 3
  // =========================================================

  const toggleReportDepartment = (
    id: number,
  ) => {
    setSelectedReportDepartmentIds(
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

  const allReportDepartmentsSelected =
    filteredReportDepartments.length >
      0 &&
    filteredReportDepartments.every(
      (department) =>
        selectedReportDepartmentIds.has(
          department.departmentId,
        ),
    );

  const toggleAllReportDepartments =
    () => {
      setSelectedReportDepartmentIds(
        (current) => {
          const next =
            new Set(current);

          const shouldSelect =
            !filteredReportDepartments.every(
              (department) =>
                next.has(
                  department.departmentId,
                ),
            );

          filteredReportDepartments.forEach(
            (department) => {
              if (shouldSelect) {
                next.add(
                  department.departmentId,
                );
              } else {
                next.delete(
                  department.departmentId,
                );
              }
            },
          );

          return next;
        },
      );
    };

  const saveByReport = async () => {
    if (
      factoryId <= 0 ||
      reportId <= 0
    ) {
      setError(
        "Vui lòng chọn nhà máy và báo cáo.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          "/api/department-reports/by-report",
          {
            method: "PUT",

            body: JSON.stringify({
              factoryId,
              reportId,

              departmentIds:
                Array.from(
                  selectedReportDepartmentIds,
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
  // RENDER
  // =========================================================

  return (
    <div className="department-report-page">
      {/* HEADER */}

      <div className="department-report-page-header">
        <h1>
          Phân quyền báo cáo cho phòng ban
        </h1>

        <p>
          Cấp quyền hàng loạt hoặc quản lý
          quyền theo phòng ban và báo cáo.
        </p>
      </div>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="department-report-tabs">
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
            activeTab === "department"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab("department")
          }
        >
          Theo phòng ban
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

      <section className="department-report-filter-card">
        <div className="department-report-filter-grid">
          {/* FACTORY */}

          <div className="department-report-field">
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

          {/* TAB 2 DEPARTMENT */}

          {activeTab ===
            "department" && (
            <div className="department-report-field">
              <label>
                Phòng ban
              </label>

              <select
                value={departmentId}
                disabled={loadingMaster}
                onChange={(event) => {
                  setDepartmentId(
                    Number(
                      event.target.value,
                    ),
                  );

                  setSearchText("");
                  setError("");
                  setSuccess("");
                }}
              >
                {departments.length ===
                  0 && (
                  <option value={0}>
                    Chưa có phòng ban
                  </option>
                )}

                {departments.map(
                  (department) => (
                    <option
                      key={
                        department.departmentId
                      }
                      value={
                        department.departmentId
                      }
                    >
                      {
                        department.departmentCode
                      }{" "}
                      -{" "}
                      {
                        department.departmentName
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {/* TAB 3 REPORT */}

          {activeTab ===
            "report" && (
            <div className="department-report-field">
              <label>
                Báo cáo
              </label>

              <select
                value={reportId}
                disabled={
                  loadingFactoryReports ||
                  factoryReports.length ===
                    0
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
                {factoryReports.length ===
                  0 && (
                  <option value={0}>
                    Nhà máy chưa có báo cáo
                  </option>
                )}

                {factoryReports.map(
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

          <div className="department-report-field">
            <label>
              {activeTab === "report"
                ? "Tìm phòng ban"
                : "Tìm báo cáo"}
            </label>

            <input
              type="text"
              value={searchText}
              placeholder={
                activeTab === "report"
                  ? "Nhập mã hoặc tên phòng ban..."
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
      </section>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {error && (
        <div className="department-report-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="department-report-message success">
          {success}
        </div>
      )}

      {/* =====================================================
          TAB 1 - BULK
      ====================================================== */}

      {activeTab === "bulk" && (
        <section className="department-report-list-card">
          <div className="department-report-list-header">
            <div>
              <h2>
                Chọn báo cáo cần phân quyền
              </h2>

              <span>
                Đã chọn{" "}
                {
                  bulkSelectedReportIds.size
                }{" "}
                /{" "}
                {
                  factoryReports.length
                }{" "}
                báo cáo
              </span>
            </div>

            <button
              type="button"
              className="department-report-primary-button"
              disabled={
                loadingFactoryReports ||
                bulkSelectedReportIds.size ===
                  0
              }
              onClick={
                openBulkDepartmentModal
              }
            >
              Chọn phòng ban
            </button>
          </div>

          <div className="department-report-table-wrapper">
            <table className="department-report-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allBulkReportsSelected
                      }
                      disabled={
                        filteredFactoryReports.length ===
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
                {loadingFactoryReports ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="department-report-empty"
                    >
                      Đang tải báo cáo...
                    </td>
                  </tr>
                ) : filteredFactoryReports.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="department-report-empty"
                    >
                      Không có báo cáo.
                    </td>
                  </tr>
                ) : (
                  filteredFactoryReports.map(
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
                            <span className="department-report-code">
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
                            <span className="department-report-path">
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

          <div className="department-report-footer">
            Hiển thị{" "}
            {
              filteredFactoryReports.length
            }{" "}
            /{" "}
            {factoryReports.length} báo cáo
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 2 - BY DEPARTMENT
      ====================================================== */}

      {activeTab ===
        "department" && (
        <section className="department-report-list-card">
          <div className="department-report-list-header">
            <div>
              <h2>
                Báo cáo của phòng ban
              </h2>

              <span>
                Đã cấp{" "}
                {
                  selectedDepartmentReportIds.size
                }{" "}
                /{" "}
                {
                  departmentReports.length
                }{" "}
                báo cáo
              </span>
            </div>

            <button
              type="button"
              className="department-report-primary-button"
              disabled={
                saving ||
                loading ||
                departmentId <= 0
              }
              onClick={() =>
                void saveByDepartment()
              }
            >
              {saving
                ? "Đang lưu..."
                : "Lưu phân quyền"}
            </button>
          </div>

          <div className="department-report-table-wrapper">
            <table className="department-report-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allDepartmentReportsSelected
                      }
                      disabled={
                        filteredDepartmentReports.length ===
                        0
                      }
                      onChange={
                        toggleAllDepartmentReports
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="department-report-empty"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredDepartmentReports.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="department-report-empty"
                    >
                      Không có báo cáo.
                    </td>
                  </tr>
                ) : (
                  filteredDepartmentReports.map(
                    (report, index) => {
                      const checked =
                        selectedDepartmentReportIds.has(
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
                            toggleDepartmentReport(
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
                                toggleDepartmentReport(
                                  report.reportId,
                                )
                              }
                            />
                          </td>

                          <td className="stt-column">
                            {index + 1}
                          </td>

                          <td>
                            <span className="department-report-code">
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
                            <span className="department-report-path">
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

          <div className="department-report-footer">
            Hiển thị{" "}
            {
              filteredDepartmentReports.length
            }{" "}
            /{" "}
            {departmentReports.length} báo cáo
          </div>
        </section>
      )}

      {/* =====================================================
          TAB 3 - BY REPORT
      ====================================================== */}

      {activeTab === "report" && (
        <section className="department-report-list-card">
          <div className="department-report-list-header">
            <div>
              <h2>
                Phòng ban sử dụng báo cáo
              </h2>

              <span>
                Đang sử dụng{" "}
                {
                  selectedReportDepartmentIds.size
                }{" "}
                /{" "}
                {
                  reportDepartments.length
                }{" "}
                phòng ban
              </span>
            </div>

            <button
              type="button"
              className="department-report-primary-button"
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

          <div className="department-report-table-wrapper">
            <table className="department-report-table department-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        allReportDepartmentsSelected
                      }
                      disabled={
                        filteredReportDepartments.length ===
                        0
                      }
                      onChange={
                        toggleAllReportDepartments
                      }
                    />
                  </th>

                  <th className="stt-column">
                    STT
                  </th>

                  <th>Mã phòng ban</th>
                  <th>Tên phòng ban</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="department-report-empty"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredReportDepartments.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="department-report-empty"
                    >
                      Không có phòng ban.
                    </td>
                  </tr>
                ) : (
                  filteredReportDepartments.map(
                    (
                      department,
                      index,
                    ) => {
                      const checked =
                        selectedReportDepartmentIds.has(
                          department.departmentId,
                        );

                      return (
                        <tr
                          key={
                            department.departmentId
                          }
                          className={
                            checked
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            toggleReportDepartment(
                              department.departmentId,
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
                                toggleReportDepartment(
                                  department.departmentId,
                                )
                              }
                            />
                          </td>

                          <td className="stt-column">
                            {index + 1}
                          </td>

                          <td>
                            <span className="department-report-code">
                              {
                                department.departmentCode
                              }
                            </span>
                          </td>

                          <td>
                            {
                              department.departmentName
                            }
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="department-report-footer">
            Hiển thị{" "}
            {
              filteredReportDepartments.length
            }{" "}
            /{" "}
            {reportDepartments.length} phòng ban
          </div>
        </section>
      )}

      {/* =====================================================
          BULK DEPARTMENT MODAL
      ====================================================== */}

      {departmentModalOpen && (
        <div
          className="department-report-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeBulkDepartmentModal();
            }
          }}
        >
          <div className="department-report-modal">
            <div className="department-report-modal-header">
              <div>
                <h2>
                  Chọn phòng ban
                </h2>

                <p>
                  Cấp các báo cáo đã chọn
                  cho nhiều phòng ban.
                </p>
              </div>

              <button
                type="button"
                className="department-report-modal-close"
                disabled={saving}
                onClick={
                  closeBulkDepartmentModal
                }
              >
                ×
              </button>
            </div>

            <div className="department-report-modal-summary">
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
                  Phòng ban đã chọn
                </span>

                <strong>
                  {
                    bulkSelectedDepartmentIds.size
                  }
                </strong>
              </div>
            </div>

            <div className="department-report-modal-search">
              <input
                type="text"
                value={
                  departmentModalSearch
                }
                placeholder="Tìm mã hoặc tên phòng ban..."
                onChange={(event) =>
                  setDepartmentModalSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <label className="department-report-modal-select-all">
              <input
                type="checkbox"
                checked={
                  allModalDepartmentsSelected
                }
                disabled={
                  filteredModalDepartments.length ===
                  0
                }
                onChange={
                  toggleAllModalDepartments
                }
              />

              <span>
                Chọn tất cả phòng ban đang
                hiển thị
              </span>
            </label>

            <div className="department-report-modal-list">
              {filteredModalDepartments.length ===
              0 ? (
                <div className="department-report-modal-empty">
                  Không có phòng ban.
                </div>
              ) : (
                filteredModalDepartments.map(
                  (department) => {
                    const checked =
                      bulkSelectedDepartmentIds.has(
                        department.departmentId,
                      );

                    return (
                      <label
                        key={
                          department.departmentId
                        }
                        className={`department-report-modal-item ${
                          checked
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          onChange={() =>
                            toggleBulkDepartment(
                              department.departmentId,
                            )
                          }
                        />

                        <div>
                          <strong>
                            {
                              department.departmentCode
                            }
                          </strong>

                          <span>
                            {
                              department.departmentName
                            }
                          </span>
                        </div>
                      </label>
                    );
                  },
                )
              )}
            </div>

            <div className="department-report-modal-actions">
              <button
                type="button"
                className="department-report-cancel-button"
                disabled={saving}
                onClick={
                  closeBulkDepartmentModal
                }
              >
                Hủy
              </button>

              <button
                type="button"
                className="department-report-primary-button"
                disabled={
                  saving ||
                  bulkSelectedDepartmentIds.size ===
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

export default DepartmentReportPage;