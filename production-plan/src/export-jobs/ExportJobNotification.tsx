import {
  useExportJobs,
} from "./ExportJobContext";


function ExportJobNotification() {
  const {
    jobs,
    removeJob,
    downloadJob,
  } = useExportJobs();


  /*
    Hiện tối đa 4 job gần nhất.
  */

  const visibleJobs =
    jobs.slice(0, 4);


  if (
    visibleJobs.length === 0
  ) {
    return null;
  }


  return (
    <div
      style={{
        position: "fixed",

        right: "20px",

        bottom: "20px",

        zIndex: 99999,

        width: "360px",

        maxWidth:
          "calc(100vw - 40px)",

        display: "flex",

        flexDirection:
          "column",

        gap: "8px",

        pointerEvents:
          "none",
      }}
    >
      {visibleJobs.map(
        (job) => (
          <div
            key={job.jobId}
            style={{
              padding: "14px",

              backgroundColor:
                "white",

              border:
                "1px solid #e5e7eb",

              borderRadius:
                "8px",

              boxShadow:
                "0 10px 30px rgba(0, 0, 0, 0.16)",

              pointerEvents:
                "auto",
            }}
          >
            {/* =============================================
                HEADER
                ============================================= */}

            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "flex-start",

                gap: "10px",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize:
                      "14px",

                    fontWeight:
                      700,

                    color:
                      "#111827",
                  }}
                >
                  {getStatusIcon(
                    job.status,
                  )}{" "}

                  {job.title}
                </div>


                <div
                  style={{
                    marginTop:
                      "4px",

                    fontSize:
                      "12px",

                    color:
                      getStatusColor(
                        job.status,
                      ),
                  }}
                >
                  {getStatusText(
                    job.status,
                  )}
                </div>
              </div>


              {(job.status ===
                "COMPLETED" ||
                job.status ===
                  "FAILED") && (
                <button
                  type="button"
                  title="Đóng"
                  onClick={() =>
                    removeJob(
                      job.jobId,
                    )
                  }
                  style={{
                    border:
                      "none",

                    padding: 0,

                    background:
                      "transparent",

                    color:
                      "#9ca3af",

                    fontSize:
                      "20px",

                    lineHeight: 1,

                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>
              )}
            </div>


            {/* =============================================
                PENDING / PROCESSING
                ============================================= */}

            {(job.status ===
              "PENDING" ||
              job.status ===
                "PROCESSING") && (
              <>
                <div
                  style={{
                    marginTop:
                      "10px",

                    color:
                      "#6b7280",

                    fontSize:
                      "12px",

                    lineHeight:
                      1.5,
                  }}
                >
                  File đang được xử lý ở nền. Bạn có thể chuyển sang chức năng khác để tiếp tục làm việc.
                </div>


                <div
                  style={{
                    marginTop:
                      "10px",

                    height:
                      "5px",

                    overflow:
                      "hidden",

                    backgroundColor:
                      "#e5e7eb",

                    borderRadius:
                      "999px",
                  }}
                >
                  <div
                    style={{
                      width:
                        job.status ===
                        "PENDING"
                          ? "30%"
                          : "65%",

                      height:
                        "100%",

                      backgroundColor:
                        "#2563eb",

                      borderRadius:
                        "999px",

                      transition:
                        "width 0.3s ease",
                    }}
                  />
                </div>
              </>
            )}


            {/* =============================================
                COMPLETED
                ============================================= */}

            {job.status ===
              "COMPLETED" && (
              <div
                style={{
                  marginTop:
                    "10px",
                }}
              >
                {job.fileName && (
                  <div
                    title={
                      job.fileName
                    }
                    style={{
                      marginBottom:
                        "9px",

                      padding:
                        "7px 8px",

                      backgroundColor:
                        "#f9fafb",

                      borderRadius:
                        "5px",

                      color:
                        "#6b7280",

                      fontSize:
                        "12px",

                      whiteSpace:
                        "nowrap",

                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",
                    }}
                  >
                    {job.fileName}
                  </div>
                )}


                <button
                  type="button"
                  onClick={() =>
                    downloadJob(
                      job,
                    )
                  }
                  style={{
                    width: "100%",

                    padding:
                      "8px 12px",

                    border:
                      "none",

                    borderRadius:
                      "5px",

                    backgroundColor:
                      "#15803d",

                    color:
                      "white",

                    fontWeight:
                      700,

                    cursor:
                      "pointer",
                  }}
                >
                  ↓ Tải file Excel
                </button>
              </div>
            )}


            {/* =============================================
                FAILED
                ============================================= */}

            {job.status ===
              "FAILED" && (
              <div
                style={{
                  marginTop:
                    "10px",

                  padding:
                    "8px 10px",

                  backgroundColor:
                    "#fef2f2",

                  border:
                    "1px solid #fecaca",

                  borderRadius:
                    "5px",

                  color:
                    "#b91c1c",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.5,
                }}
              >
                {job.errorMessage ||
                  "Xuất file thất bại."}
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}


// ============================================================
// HELPERS
// ============================================================

function getStatusText(
  status: string,
) {
  switch (status) {
    case "PENDING":
      return "Đang chờ xử lý...";

    case "PROCESSING":
      return "Đang tạo file Excel...";

    case "COMPLETED":
      return "Xuất Excel hoàn tất";

    case "FAILED":
      return "Xuất Excel thất bại";

    default:
      return status;
  }
}


function getStatusIcon(
  status: string,
) {
  switch (status) {
    case "PENDING":
      return "⏳";

    case "PROCESSING":
      return "⚙";

    case "COMPLETED":
      return "✓";

    case "FAILED":
      return "✕";

    default:
      return "•";
  }
}


function getStatusColor(
  status: string,
) {
  switch (status) {
    case "PENDING":
    case "PROCESSING":
      return "#2563eb";

    case "COMPLETED":
      return "#15803d";

    case "FAILED":
      return "#b91c1c";

    default:
      return "#6b7280";
  }
}


export default ExportJobNotification;