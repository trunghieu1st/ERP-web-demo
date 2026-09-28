// ============================================================
// TYPES
// ============================================================

export type ExportProductionLine = {
  factoryId: number;

  factoryCode: string;

  factoryName: string;

  userId: number;

  username: string;

  productionLineId: number;

  lineCode: string;

  lineName: string;
};


// ============================================================
// PROPS
// ============================================================

type ExportProductionLineListProps = {
  data: ExportProductionLine[];

  hasSearched: boolean;
};


// ============================================================
// COMPONENT
// ============================================================

function ExportProductionLineList({
  data,
  hasSearched,
}: ExportProductionLineListProps) {
  // ==========================================================
  // CHƯA SEARCH
  // ==========================================================

  if (!hasSearched) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "220px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          padding: "30px",

          boxSizing: "border-box",

          color: "#9ca3af",

          fontSize: "13px",

          textAlign: "center",
        }}
      >
        Chọn điều kiện và nhấn "Tìm kiếm" để xem dữ liệu.
      </div>
    );
  }


  // ==========================================================
  // KHÔNG CÓ DATA
  // ==========================================================

  if (data.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "220px",

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          gap: "6px",

          padding: "30px",

          boxSizing: "border-box",

          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "28px",
          }}
        >
          📭
        </div>

        <div
          style={{
            color: "#374151",

            fontSize: "14px",

            fontWeight: 600,
          }}
        >
          Không có dữ liệu
        </div>

        <div
          style={{
            color: "#9ca3af",

            fontSize: "12px",
          }}
        >
          Không tìm thấy Production Line phù hợp với điều kiện đã chọn.
        </div>
      </div>
    );
  }


  // ==========================================================
  // TABLE
  // ==========================================================

  return (
    <div
      style={{
        width: "100%",

        minWidth: "950px",

        boxSizing: "border-box",
      }}
    >
      <table
        style={{
          width: "100%",

          borderCollapse: "collapse",

          tableLayout: "fixed",

          backgroundColor: "#ffffff",

          fontSize: "13px",
        }}
      >
        {/* ====================================================
            HEADER
            ==================================================== */}

        <thead>
          <tr>
            <th
              style={{
                ...headerCellStyle,

                width: "65px",

                textAlign: "center",
              }}
            >
              STT
            </th>

            <th
              style={{
                ...headerCellStyle,

                width: "150px",
              }}
            >
              Factory Code
            </th>

            <th
              style={{
                ...headerCellStyle,

                width: "240px",
              }}
            >
              Factory Name
            </th>

            <th
              style={{
                ...headerCellStyle,

                width: "180px",
              }}
            >
              Username
            </th>

            <th
              style={{
                ...headerCellStyle,

                width: "160px",
              }}
            >
              Line Code
            </th>

            <th
              style={{
                ...headerCellStyle,

                width: "260px",
              }}
            >
              Line Name
            </th>
          </tr>
        </thead>


        {/* ====================================================
            BODY
            ==================================================== */}

        <tbody>
          {data.map(
            (
              item,
              index,
            ) => {
              const rowKey =
                `${item.factoryId}-` +
                `${item.userId}-` +
                `${item.productionLineId}-` +
                `${index}`;


              return (
                <tr
                  key={rowKey}
                  style={{
                    backgroundColor:
                      index % 2 === 0
                        ? "#ffffff"
                        : "#fafafa",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor =
                      "#eff6ff";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor =
                      index % 2 === 0
                        ? "#ffffff"
                        : "#fafafa";
                  }}
                >
                  {/* STT */}

                  <td
                    style={{
                      ...bodyCellStyle,

                      textAlign: "center",

                      color: "#6b7280",
                    }}
                  >
                    {index + 1}
                  </td>


                  {/* FACTORY CODE */}

                  <td
                    style={{
                      ...bodyCellStyle,

                      fontWeight: 600,

                      color: "#1f2937",
                    }}
                    title={
                      item.factoryCode ??
                      ""
                    }
                  >
                    {displayValue(
                      item.factoryCode,
                    )}
                  </td>


                  {/* FACTORY NAME */}

                  <td
                    style={bodyCellStyle}
                    title={
                      item.factoryName ??
                      ""
                    }
                  >
                    {displayValue(
                      item.factoryName,
                    )}
                  </td>


                  {/* USERNAME */}

                  <td
                    style={bodyCellStyle}
                    title={
                      item.username ??
                      ""
                    }
                  >
                    {displayValue(
                      item.username,
                    )}
                  </td>


                  {/* LINE CODE */}

                  <td
                    style={{
                      ...bodyCellStyle,

                      color: "#2563eb",

                      fontWeight: 600,
                    }}
                    title={
                      item.lineCode ??
                      ""
                    }
                  >
                    {displayValue(
                      item.lineCode,
                    )}
                  </td>


                  {/* LINE NAME */}

                  <td
                    style={bodyCellStyle}
                    title={
                      item.lineName ??
                      ""
                    }
                  >
                    {displayValue(
                      item.lineName,
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


// ============================================================
// DISPLAY VALUE
// ============================================================

function displayValue(
  value:
    | string
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value.trim() === ""
  ) {
    return "-";
  }


  return value;
}


// ============================================================
// STYLES
// ============================================================

const headerCellStyle = {
  padding: "10px 12px",

  borderBottom:
    "1px solid #d1d5db",

  borderRight:
    "1px solid #e5e7eb",

  backgroundColor:
    "#f9fafb",

  color: "#374151",

  fontSize: "12px",

  fontWeight: 700,

  textAlign:
    "left" as const,

  whiteSpace:
    "nowrap" as const,

  /*
    Header đứng yên khi cuộn xuống.
  */
  position:
    "sticky" as const,

  top: 0,

  zIndex: 2,
};


const bodyCellStyle = {
  padding: "10px 12px",

  borderBottom:
    "1px solid #e5e7eb",

  borderRight:
    "1px solid #f3f4f6",

  color: "#374151",

  fontSize: "13px",

  lineHeight: 1.4,

  whiteSpace:
    "nowrap" as const,

  overflow: "hidden",

  textOverflow:
    "ellipsis",
};


export default ExportProductionLineList;