import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode } from "react";

import { apiFetch } from "../api/apiClient";
import { AUTH_SESSION_CHANGED_EVENT } from "../auth/authStorage";


export type ExportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ExportJob = {
  jobId: string;

  title: string;

  /*
    API dùng để kiểm tra trạng thái job.

    Ví dụ:
    /api/reports/production-lines/export/ABC
  */
  statusUrl: string;

  status: ExportJobStatus;

  fileName: string | null;

  downloadUrl: string | null;

  errorMessage: string | null;

  createdAt: string | null;

  startedAt: string | null;

  completedAt: string | null;
};

export type StartTrackingParams = {
  jobId: string;

  title: string;

  statusUrl: string;
};

type ExportJobContextValue = {
  jobs: ExportJob[];

  startTracking: (params: StartTrackingParams) => void;

  removeJob: (jobId: string) => void;

  downloadJob: (job: ExportJob) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const ExportJobContext = createContext<ExportJobContextValue | undefined>(
  undefined,
);

// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEY = "production-plan-export-jobs";

// ============================================================
// HELPER
// ============================================================

function normalizeStatus(value: unknown): ExportJobStatus {
  const status = String(value ?? "").trim().toUpperCase();

  switch (status) {
    case "PENDING":
    case "PROCESSING":
    case "COMPLETED":
    case "FAILED":
      return status;
    default:
      return "PENDING";
  }
}

// ============================================================
// PROVIDER
// ============================================================

export function ExportJobProvider({ children }: { children: ReactNode }) {
  // ==========================================================
  // LOAD JOBS TỪ LOCAL STORAGE
  // ==========================================================

  const [jobs, setJobs] = useState<ExportJob[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return [];
      }

      /*
          Chỉ lấy tối đa 20 job gần nhất.
        */
      return parsed.slice(0, 20) as ExportJob[];
    } catch (error) {
      console.error("Read export jobs:", error);

      return [];
    }
  });

  /*
    Polling chạy bằng ref để không cần
    tạo lại interval mỗi khi jobs thay đổi.
  */

  const jobsRef = useRef<ExportJob[]>(jobs);

  // Auth identity changed/logout: never keep export metadata
  // belonging to the previous user/factory in memory or storage.
  useEffect(() => {
    const clearForAuthChange = () => {
      jobsRef.current = [];
      setJobs([]);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, clearForAuthChange);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, clearForAuthChange);
    };
  }, []);

  // ==========================================================
  // SAVE LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    jobsRef.current = jobs;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, 20)));
    } catch (error) {
      console.error("Save export jobs:", error);
    }
  }, [jobs]);

  // ==========================================================
  // START TRACKING
  // ==========================================================

  const startTracking = useCallback(
    ({ jobId, title, statusUrl }: StartTrackingParams) => {
      setJobs((current) => {
        /*
              Không thêm trùng job.
            */

        const exists = current.some((job) => job.jobId === jobId);

        if (exists) {
          return current;
        }

        const newJob: ExportJob = {
          jobId,

          title,

          statusUrl,

          status: "PENDING",

          fileName: null,

          downloadUrl: null,

          errorMessage: null,

          createdAt: new Date().toISOString(),

          startedAt: null,

          completedAt: null,
        };

        /*
              Job mới nhất nằm trên cùng.

              Chỉ giữ tối đa 20 job.
            */

        return [newJob, ...current].slice(0, 20);
      });
    },
    [],
  );

  // ==========================================================
  // REMOVE JOB
  // ==========================================================

  const removeJob = useCallback((jobId: string) => {
    setJobs((current) => current.filter((job) => job.jobId !== jobId));
  }, []);

  // ==========================================================
  // DOWNLOAD JOB
  // ==========================================================

  const downloadJob = useCallback(async (job: ExportJob) => {
    if (job.status !== "COMPLETED" || !job.downloadUrl) {
      return;
    }

    try {
      const response = await apiFetch(job.downloadUrl);

      if (!response.ok) {
        throw new Error("Không thể tải file.");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = job.fileName ?? "export.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download export file:", error);
    }
  }, []);

  // ==========================================================
  // POLLING
  // ==========================================================

  useEffect(() => {
    let checking = false;

    let destroyed = false;

    const checkJobs = async () => {
      if (checking || destroyed) {
        return;
      }

      /*
          Chỉ hỏi server những job chưa xong.
        */

      const activeJobs = jobsRef.current.filter(
        (job) => job.status === "PENDING" || job.status === "PROCESSING",
      );

      if (activeJobs.length === 0) {
        return;
      }

      checking = true;

      try {
        const results = await Promise.all(
          activeJobs.map(async (job) => {
            try {
              const response = await apiFetch(job.statusUrl);
              /*
                      Job không còn tồn tại trên server.

                      Trường hợp này có thể xảy ra nếu:
                      - backend restart
                      - backend đang dùng in-memory job store
                    */

              if (response.status === 404) {
                return {
                  jobId: job.jobId,

                  status: "FAILED" as ExportJobStatus,

                  fileName: null,

                  downloadUrl: null,

                  errorMessage:
                    "Export Job không còn tồn tại trên server. Có thể API đã được khởi động lại.",

                  createdAt: job.createdAt,

                  startedAt: job.startedAt,

                  completedAt: new Date().toISOString(),
                };
              }

              /*
                      Các lỗi tạm thời khác:
                      không đánh Failed ngay.

                      Ví dụ:
                      - mất mạng
                      - server tạm thời unavailable
                    */

              if (!response.ok) {
                return null;
              }

              const data = await response.json();

              return {
                jobId: job.jobId,

                status: normalizeStatus(data.status),

                fileName: data.fileName ?? null,

                downloadUrl: data.downloadUrl ?? null,

                errorMessage: data.errorMessage ?? null,

                createdAt: data.createdAt ?? job.createdAt,

                startedAt: data.startedAt ?? null,

                completedAt: data.completedAt ?? null,
              };
            } catch (error) {
              /*
                      Mất mạng thì giữ nguyên trạng thái.
                      Lần polling tiếp theo sẽ thử lại.
                    */

              console.error("Check export job:", error);

              return null;
            }
          }),
        );

        if (destroyed) {
          return;
        }

        setJobs((current) =>
          current.map((job) => {
            const result = results.find((item) => item?.jobId === job.jobId);

            if (!result) {
              return job;
            }

            return {
              ...job,

              status: result.status,

              fileName: result.fileName,

              downloadUrl: result.downloadUrl,

              errorMessage: result.errorMessage,

              createdAt: result.createdAt,

              startedAt: result.startedAt,

              completedAt: result.completedAt,
            };
          }),
        );
      } finally {
        checking = false;
      }
    };

    /*
      F5 xong:
      Provider mount lại.

      Nếu localStorage có job Pending/Processing,
      kiểm tra server ngay lập tức.
    */

    void checkJobs();

    /*
      Sau đó kiểm tra mỗi 3 giây.
    */

    const timer = window.setInterval(() => {
      void checkJobs();
    }, 3000);

    return () => {
      destroyed = true;

      window.clearInterval(timer);
    };
  }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo<ExportJobContextValue>(
    () => ({
      jobs,

      startTracking,

      removeJob,

      downloadJob,
    }),
    [jobs, startTracking, removeJob, downloadJob],
  );

  return (
    <ExportJobContext.Provider value={value}>
      {children}
    </ExportJobContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useExportJobs() {
  const context = useContext(ExportJobContext);

  if (!context) {
    throw new Error(
      "useExportJobs phải được sử dụng bên trong ExportJobProvider.",
    );
  }

  return context;
}
