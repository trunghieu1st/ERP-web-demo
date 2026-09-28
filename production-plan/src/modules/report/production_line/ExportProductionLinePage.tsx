import { useEffect, useMemo, useState } from "react";

import ExportProductionLineList from "./ExportProductionLineList";

import type { ExportProductionLine } from "./ExportProductionLineList";

import {
  useBackgroundQuery,
  useBackgroundQueryState,
} from "../../../background-query/BackgroundQueryContext";

import { useExportJobs } from "../../../export-jobs/ExportJobContext";

import { apiFetch } from "../../../api/apiClient";
/*
  ============================================================
  API BASE URL

  GIỮ NGUYÊN DÒNG IMPORT API_BASE_URL
  HIỆN TẠI CỦA PROJECT BẠN Ở ĐÂY.
  ============================================================
*/

// import { API_BASE_URL } from "...";

// ============================================================
// CONFIG
// ============================================================

const QUERY_KEY = "report-production-line";

const REPORT_ROUTE = "/report/production_line";

const UI_STORAGE_KEY = "report-production-line-ui";

// ============================================================
// TYPES
// ============================================================

type FactoryOption = {
  factoryId: number;

  factoryCode: string;

  factoryName: string;

  isActive: boolean;
};

type UserOption = {
  userId: number;

  username: string;

  fullName: string;

  factoryId: number | null;

  factoryName: string;

  departmentId: number | null;

  departmentName: string;

  role: string;

  roleName: string;

  isActive: boolean;
};

type ReportFilters = {
  factoryId: number | null;

  userId: number | null;
};

type ReportResponse = {
  total: number;

  data: ExportProductionLine[];
};

type SavedUiState = {
  draftFilters: ReportFilters;

  appliedFilters: ReportFilters;

  hasSearched: boolean;
};

// ============================================================
// DEFAULT
// ============================================================

const DEFAULT_UI_STATE: SavedUiState = {
  draftFilters: {
    factoryId: null,

    userId: null,
  },

  appliedFilters: {
    factoryId: null,

    userId: null,
  },

  hasSearched: false,
};

// ============================================================
// STORAGE
// ============================================================

function readSavedUiState(): SavedUiState {
  try {
    const raw = sessionStorage.getItem(UI_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_UI_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<SavedUiState>;

    return {
      draftFilters: {
        factoryId: parsed.draftFilters?.factoryId ?? null,

        userId: parsed.draftFilters?.userId ?? null,
      },

      appliedFilters: {
        factoryId: parsed.appliedFilters?.factoryId ?? null,

        userId: parsed.appliedFilters?.userId ?? null,
      },

      hasSearched: Boolean(parsed.hasSearched),
    };
  } catch {
    return DEFAULT_UI_STATE;
  }
}

// ============================================================
// COMPONENT
// ============================================================

function ExportProductionLinePage() {
  // ==========================================================
  // BACKGROUND QUERY
  // ==========================================================

  const { runQuery, clearQuery } = useBackgroundQuery();

  const reportQuery = useBackgroundQueryState<ReportResponse>(QUERY_KEY);

  // ==========================================================
  // EXPORT
  // ==========================================================

  const { startTracking } = useExportJobs();

  // ==========================================================
  // INITIAL UI
  // ==========================================================

  const [initialUiState] = useState(() => readSavedUiState());

  // ==========================================================
  // MASTER DATA
  // ==========================================================

  const [factories, setFactories] = useState<FactoryOption[]>([]);

  const [users, setUsers] = useState<UserOption[]>([]);

  const [loadingMaster, setLoadingMaster] = useState(false);

  // ==========================================================
  // DRAFT FILTER
  // ==========================================================

  const [factoryId, setFactoryId] = useState<number | null>(
    initialUiState.draftFilters.factoryId,
  );

  const [userId, setUserId] = useState<number | null>(
    initialUiState.draftFilters.userId,
  );

  // ==========================================================
  // APPLIED FILTER
  // ==========================================================

  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(
    initialUiState.appliedFilters,
  );

  // ==========================================================
  // HAS SEARCHED
  // ==========================================================

  const [hasSearched, setHasSearched] = useState(
    initialUiState.hasSearched || reportQuery !== undefined,
  );

  // ==========================================================
  // OTHER
  // ==========================================================

  const [localError, setLocalError] = useState("");

  const [startingExport, setStartingExport] = useState(false);

  // ==========================================================
  // QUERY STATE
  // ==========================================================

  const loadingReport = reportQuery?.status === "loading";

  const reportData = reportQuery?.data?.data ?? [];

  const total = reportQuery?.data?.total ?? 0;

  const reportError =
    reportQuery?.status === "error" ? (reportQuery.error ?? "") : "";

  const error = localError || reportError;

  // ==========================================================
  // GLOBAL QUERY EXISTS
  // ==========================================================

  useEffect(() => {
    if (reportQuery !== undefined) {
      setHasSearched(true);
    }
  }, [reportQuery]);

  // ==========================================================
  // SAVE UI
  // ==========================================================

  useEffect(() => {
    const state: SavedUiState = {
      draftFilters: {
        factoryId,

        userId,
      },

      appliedFilters,

      hasSearched,
    };

    try {
      sessionStorage.setItem(
        UI_STORAGE_KEY,

        JSON.stringify(state),
      );
    } catch {
      // Ignore
    }
  }, [factoryId, userId, appliedFilters, hasSearched]);

  // ==========================================================
  // MASTER DATA
  //
  // Không Search report khi vào màn hình.
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadMasterData() {
      try {
        setLoadingMaster(true);

        setLocalError("");

        const [factoryResponse, userResponse] = await Promise.all([
          apiFetch("/api/factories"),

          apiFetch("/api/users"),
        ]);

        if (!factoryResponse.ok) {
          throw new Error("Không thể tải danh sách Factory.");
        }

        if (!userResponse.ok) {
          throw new Error("Không thể tải danh sách User.");
        }

        const factoryData = (await factoryResponse.json()) as FactoryOption[];

        const userData = (await userResponse.json()) as UserOption[];

        if (cancelled) {
          return;
        }

        setFactories(factoryData);

        setUsers(userData);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setLocalError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu danh mục.",
        );
      } finally {
        if (!cancelled) {
          setLoadingMaster(false);
        }
      }
    }

    void loadMasterData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // AVAILABLE USER
  // ==========================================================

  const availableUsers = useMemo(() => {
    const activeUsers = users.filter((item) => item.isActive);

    if (factoryId === null) {
      return activeUsers;
    }

    return activeUsers.filter((item) => Number(item.factoryId) === factoryId);
  }, [users, factoryId]);

  // ==========================================================
  // FACTORY CHANGE
  // ==========================================================

  const handleFactoryChange = (value: string) => {
    const nextFactoryId = value === "" ? null : Number(value);

    setFactoryId(nextFactoryId);

    setUserId(null);
  };

  // ==========================================================
  // BUILD REPORT URL
  //
  // KHÔNG page
  // KHÔNG pageSize
  // ==========================================================

  const buildReportUrl = (filters: ReportFilters) => {
    const params = new URLSearchParams();

    if (filters.factoryId !== null) {
      params.set("factoryId", String(filters.factoryId));
    }

    if (filters.userId !== null) {
      params.set("userId", String(filters.userId));
    }

    const queryString = params.toString();

    if (!queryString) {
      return "/api/reports/production-lines";
    }

    return `/api/reports/production-lines?${queryString}`;
  };

  // ==========================================================
  // RUN REPORT
  // ==========================================================

  const runReport = async (filters: ReportFilters) => {
    const url = buildReportUrl(filters);

    await runQuery<ReportResponse>({
      key: QUERY_KEY,

      title: "Production Line",

      route: REPORT_ROUTE,

      /*
    Nếu query xong trong lúc
    user đang ở menu khác
    => Global Background Notification.
  */
      notifyOnSuccess: true,

      notifyOnError: true,

      successMessage: "Đã có dữ liệu.",

      request: async () => {
        const response = await apiFetch(url);

        if (!response.ok) {
          let message = "Không thể lấy dữ liệu báo cáo Production Line.";

          try {
            const body = await response.json();

            if (body?.message) {
              message = String(body.message);
            }
          } catch {
            // Ignore
          }

          throw new Error(message);
        }

        return (await response.json()) as ReportResponse;
      },
    });
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = async () => {
    const filters: ReportFilters = {
      factoryId,

      userId,
    };

    setLocalError("");

    setAppliedFilters(filters);

    setHasSearched(true);

    await runReport(filters);
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleRefresh = () => {
    clearQuery(QUERY_KEY);

    setFactoryId(null);

    setUserId(null);

    setAppliedFilters({
      factoryId: null,

      userId: null,
    });

    setHasSearched(false);

    setLocalError("");

    try {
      sessionStorage.removeItem(UI_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // ==========================================================
  // EXPORT
  // ==========================================================

  const handleExportExcel = async () => {
    try {
      setStartingExport(true);
      setLocalError("");

      /*
        Backend lấy Factory scope trực tiếp từ JWT.
        Frontend chỉ gửi các filter nghiệp vụ của export.
      */
      const response = await apiFetch("/api/reports/production-lines/export", {
        method: "POST",
        body: JSON.stringify({
          userId,
          productionLineId: null,
        }),
      });

      if (!response.ok) {
        let message = "Không thể gửi yêu cầu xuất Excel.";

        try {
          const body = await response.json();

          if (body?.message) {
            message = String(body.message);
          }
        } catch {
          // Ignore
        }

        throw new Error(message);
      }

      const result = await response.json();

      if (!result?.jobId) {
        throw new Error("Backend không trả về Export Job ID.");
      }

      const jobId = String(result.jobId);

      startTracking({
        jobId,

        title: "Production Line",

        statusUrl: `/api/reports/production-lines/export/${jobId}`,
      });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Có lỗi khi xuất Excel.",
      );
    } finally {
      setStartingExport(false);
    }
  };

  // ==========================================================
  // SELECTED FILTER LABEL
  // ==========================================================

  const selectedFactory = factories.find(
    (item) => item.factoryId === appliedFilters.factoryId,
  );

  const selectedUser = users.find(
    (item) => item.userId === appliedFilters.userId,
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        width: "100%",

        height: "100%",

        minHeight: 0,

        padding: "14px 20px",

        boxSizing: "border-box",

        backgroundColor: "#f3f4f6",

        display: "flex",

        flexDirection: "column",

        /*
          Page không scroll.

          Chỉ table bên dưới scroll.
        */
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div
        style={{
          flexShrink: 0,

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          gap: "12px",

          marginBottom: "14px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,

              color: "#111827",

              fontSize: "25px",
            }}
          >
            Báo cáo dây chuyền sản xuất
          </h1>

          <div
            style={{
              marginTop: "4px",

              color: "#6b7280",

              fontSize: "14px",
            }}
          >
            Export Production Line
          </div>
        </div>

        <div
          style={{
            padding: "8px 15px",

            backgroundColor: "#ffffff",

            border: "1px solid #e5e7eb",

            borderRadius: "6px",

            color: "#374151",

            fontSize: "13px",
          }}
        >
          Tổng số: <strong>{hasSearched ? total : "-"}</strong>
        </div>
      </div>

      {/* =====================================================
          FILTER
          ===================================================== */}

      <div
        style={{
          flexShrink: 0,

          padding: "16px",

          marginBottom: "14px",

          backgroundColor: "#ffffff",

          border: "1px solid #e5e7eb",

          borderRadius: "8px",
        }}
      >
        <div
          style={{
            paddingBottom: "10px",

            marginBottom: "14px",

            borderBottom: "1px solid #e5e7eb",

            color: "#111827",

            fontSize: "15px",

            fontWeight: 700,
          }}
        >
          Điều kiện báo cáo
        </div>

        {/* STATUS */}

        {loadingReport && (
          <div
            style={{
              marginBottom: "12px",

              padding: "10px 12px",

              backgroundColor: "#eff6ff",

              border: "1px solid #bfdbfe",

              borderRadius: "6px",

              color: "#1d4ed8",

              fontSize: "13px",
            }}
          >
            ⏳ Báo cáo đang được xử lý. Bạn có thể chuyển sang chức năng khác,
            tìm kiếm vẫn tiếp tục.
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: "12px",

              padding: "10px 12px",

              backgroundColor: "#fef2f2",

              border: "1px solid #fecaca",

              borderRadius: "6px",

              color: "#b91c1c",

              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* FILTER FIELDS */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",

            gap: "15px",
          }}
        >
          {/* FACTORY */}

          <div>
            <label style={labelStyle}>Factory</label>

            <select
              value={factoryId ?? ""}
              disabled={loadingMaster}
              onChange={(event) => handleFactoryChange(event.target.value)}
              style={selectStyle}
            >
              <option value="">-- Tất cả Factory --</option>

              {factories
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item.factoryId} value={item.factoryId}>
                    {item.factoryCode} - {item.factoryName}
                  </option>
                ))}
            </select>
          </div>

          {/* USER */}

          <div>
            <label style={labelStyle}>User</label>

            <select
              value={userId ?? ""}
              disabled={loadingMaster}
              onChange={(event) =>
                setUserId(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              style={selectStyle}
            >
              <option value="">-- Tất cả User --</option>

              {availableUsers.map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.username}

                  {item.fullName ? ` - ${item.fullName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ACTION */}

        <div
          style={{
            marginTop: "16px",

            paddingTop: "14px",

            borderTop: "1px solid #e5e7eb",

            display: "flex",

            justifyContent: "flex-end",

            gap: "8px",

            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={handleRefresh} style={normalButton}>
            ↻ Làm mới
          </button>

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loadingMaster || loadingReport}
            style={{
              ...searchButton,

              opacity: loadingMaster || loadingReport ? 0.55 : 1,

              cursor:
                loadingMaster || loadingReport ? "not-allowed" : "pointer",
            }}
          >
            {loadingReport ? "⏳ Đang tìm..." : "🔍 Tìm kiếm"}
          </button>

          <button
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={startingExport}
            style={{
              ...excelButton,

              opacity: startingExport ? 0.5 : 1,

              cursor: startingExport ? "not-allowed" : "pointer",
            }}
          >
            {startingExport ? "⏳ Đang gửi..." : "📊 Xuất Excel"}
          </button>
        </div>
      </div>

      {/* =====================================================
          RESULT
          ===================================================== */}

      <div
        style={{
          flex: 1,

          minHeight: 0,

          backgroundColor: "#ffffff",

          border: "1px solid #e5e7eb",

          borderRadius: "8px",

          display: "flex",

          flexDirection: "column",

          /*
            Card không scroll.
          */
          overflow: "hidden",
        }}
      >
        {/* RESULT HEADER */}

        <div
          style={{
            flexShrink: 0,

            padding: "12px 16px",

            borderBottom: "1px solid #e5e7eb",

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            gap: "12px",

            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#111827",

                fontSize: "15px",

                fontWeight: 700,
              }}
            >
              Dữ liệu Production Line
            </div>

            {hasSearched && (
              <div
                style={{
                  marginTop: "3px",

                  color: "#6b7280",

                  fontSize: "12px",
                }}
              >
                Factory:{" "}
                <strong>
                  {selectedFactory
                    ? `${selectedFactory.factoryCode} - ${selectedFactory.factoryName}`
                    : "Tất cả"}
                </strong>
                {" | "}
                User:{" "}
                <strong>
                  {selectedUser ? selectedUser.username : "Tất cả"}
                </strong>
              </div>
            )}
          </div>

          <div
            style={{
              color: "#6b7280",

              fontSize: "13px",
            }}
          >
            Kết quả: <strong>{hasSearched ? total : "-"}</strong>
          </div>
        </div>

        {/* ===================================================
            SCROLL AREA

            CHỈ VÙNG NÀY CUỘN.
            =================================================== */}

        <div
          style={{
            flex: 1,

            minHeight: 0,

            /*
              Đây chính là thanh cuộn bạn muốn.

              overflowY:
              dữ liệu nhiều => scroll dọc.

              overflowX:
              màn hình nhỏ => scroll ngang.
            */
            overflowY: "auto",

            overflowX: "auto",

            position: "relative",
          }}
        >
          {loadingReport && reportData.length === 0 ? (
            <div
              style={{
                width: "100%",

                height: "100%",

                minHeight: "220px",

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                justifyContent: "center",

                gap: "8px",

                color: "#6b7280",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                }}
              >
                ⏳
              </div>

              <div
                style={{
                  fontSize: "14px",

                  fontWeight: 600,
                }}
              >
                Đang xử lý báo cáo...
              </div>

              <div
                style={{
                  color: "#9ca3af",

                  fontSize: "12px",
                }}
              >
                Bạn có thể chuyển sang màn hình khác rồi quay lại.
              </div>
            </div>
          ) : (
            <ExportProductionLineList
              data={reportData}
              hasSearched={hasSearched}
            />
          )}

          {/* Loading overlay nếu đang có data cũ */}

          {loadingReport && reportData.length > 0 && (
            <div
              style={{
                position: "sticky",

                top: "10px",

                float: "right",

                marginRight: "10px",

                padding: "7px 10px",

                backgroundColor: "#eff6ff",

                border: "1px solid #bfdbfe",

                borderRadius: "5px",

                color: "#1d4ed8",

                fontSize: "12px",

                fontWeight: 600,

                zIndex: 5,
              }}
            >
              ⏳ Đang cập nhật...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const labelStyle = {
  display: "block",

  marginBottom: "6px",

  color: "#374151",

  fontSize: "13px",

  fontWeight: 600,
};

const selectStyle = {
  width: "100%",

  boxSizing: "border-box" as const,

  padding: "9px 10px",

  backgroundColor: "#ffffff",

  border: "1px solid #d1d5db",

  borderRadius: "5px",

  color: "#111827",

  outline: "none",
};

const normalButton = {
  padding: "8px 15px",

  backgroundColor: "#ffffff",

  color: "#374151",

  border: "1px solid #d1d5db",

  borderRadius: "5px",

  cursor: "pointer",

  fontWeight: 600,
};

const searchButton = {
  padding: "8px 15px",

  backgroundColor: "#2563eb",

  color: "#ffffff",

  border: "none",

  borderRadius: "5px",

  cursor: "pointer",

  fontWeight: 600,
};

const excelButton = {
  padding: "8px 15px",

  backgroundColor: "#15803d",

  color: "#ffffff",

  border: "none",

  borderRadius: "5px",

  cursor: "pointer",

  fontWeight: 600,
};

export default ExportProductionLinePage;
