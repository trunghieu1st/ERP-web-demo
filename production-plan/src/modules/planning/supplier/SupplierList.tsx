import { useState } from "react";
import type { CSSProperties } from "react";

import type { Supplier } from "./SupplierPage";

type SupplierListProps = {
  suppliers: Supplier[];
  selectedId: number | null;
  onSelect: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
};

function SupplierList({
  suppliers,
  selectedId,
  onSelect,
  onDelete,
}: SupplierListProps) {
  const [searchText, setSearchText] =
    useState("");

  const keyword =
    searchText.trim().toLowerCase();

  const filteredSuppliers =
    suppliers.filter((supplier) => {
      if (!keyword) {
        return true;
      }

      return (
        supplier.code
          .toLowerCase()
          .includes(keyword) ||
        supplier.name
          .toLowerCase()
          .includes(keyword) ||
        supplier.countryCode
          .toLowerCase()
          .includes(keyword) ||
        supplier.address
          .toLowerCase()
          .includes(keyword) ||
        supplier.phoneNumber
          .toLowerCase()
          .includes(keyword) ||
        supplier.email
          .toLowerCase()
          .includes(keyword)
      );
    });

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      {/* ==================================================
          SEARCH
         ================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 15,
        }}
      >
        <input
          type="text"
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
          placeholder="Tìm mã, tên, quốc gia, địa chỉ, điện thoại, email..."
          style={{
            width: 450,
            maxWidth: "100%",
            boxSizing: "border-box",
            padding: "9px 12px",
            border:
              "1px solid #d1d5db",
            borderRadius: 6,
            outline: "none",
            fontSize: 14,
          }}
        />

        {searchText && (
          <button
            type="button"
            onClick={() =>
              setSearchText("")
            }
            style={{
              padding: "8px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: 6,
              backgroundColor:
                "#ffffff",
              cursor: "pointer",
            }}
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* ==================================================
          SUPPLIER TABLE
         ================================================== */}

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
          backgroundColor:
            "#ffffff",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>
              STT
            </th>

            <th style={thStyle}>
              Mã nhà cung cấp
            </th>

            <th style={thStyle}>
              Tên nhà cung cấp
            </th>

            <th style={thStyle}>
              Quốc gia
            </th>

            <th style={thStyle}>
              Địa chỉ
            </th>

            <th style={thStyle}>
              Số điện thoại
            </th>

            <th style={thStyle}>
              Email
            </th>

            <th style={thStyle}>
              Trạng thái
            </th>

            <th
              style={{
                ...thStyle,
                textAlign: "center",
              }}
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredSuppliers.map(
            (supplier, index) => {
              const isSelected =
                supplier.id ===
                selectedId;

              return (
                <tr
                  key={supplier.id}
                  style={{
                    backgroundColor:
                      isSelected
                        ? "#eff6ff"
                        : "#ffffff",
                  }}
                >
                  {/* STT */}

                  <td style={tdStyle}>
                    {index + 1}
                  </td>

                  {/* MÃ NCC */}

                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 600,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onSelect(
                          supplier
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        padding: 0,
                        color:
                          "#2563eb",
                        cursor:
                          "pointer",
                        fontWeight:
                          600,
                      }}
                      onMouseEnter={(
                        event
                      ) => {
                        event.currentTarget.style.textDecoration =
                          "underline";
                      }}
                      onMouseLeave={(
                        event
                      ) => {
                        event.currentTarget.style.textDecoration =
                          "none";
                      }}
                    >
                      {supplier.code}
                    </button>
                  </td>

                  {/* TÊN */}

                  <td style={tdStyle}>
                    {supplier.name}
                  </td>

                  {/* QUỐC GIA */}

                  <td style={tdStyle}>
                    {supplier.countryCode}
                  </td>

                  {/* ĐỊA CHỈ */}

                  <td style={tdStyle}>
                    {supplier.address}
                  </td>

                  {/* PHONE */}

                  <td style={tdStyle}>
                    {supplier.phoneNumber}
                  </td>

                  {/* EMAIL */}

                  <td style={tdStyle}>
                    {supplier.email}
                  </td>

                  {/* TRẠNG THÁI */}

                  <td style={tdStyle}>
                    <span
                      style={{
                        display:
                          "inline-block",
                        padding:
                          "4px 8px",
                        borderRadius: 4,
                        backgroundColor:
                          supplier.active ===
                          "ACTIVE"
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          supplier.active ===
                          "ACTIVE"
                            ? "#166534"
                            : "#991b1b",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {supplier.active ===
                      "ACTIVE"
                        ? "Hoạt động"
                        : "Ngừng hoạt động"}
                    </span>
                  </td>

                  {/* THAO TÁC */}

                  <td
                    style={{
                      ...tdStyle,
                      textAlign:
                        "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          supplier.id
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          "#dc2626",
                        cursor:
                          "pointer",
                        fontSize: 13,
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            }
          )}

          {filteredSuppliers.length ===
            0 && (
            <tr>
              <td
                colSpan={9}
                style={{
                  padding: 40,
                  textAlign:
                    "center",
                  color:
                    "#6b7280",
                }}
              >
                {searchText
                  ? "Không tìm thấy nhà cung cấp phù hợp"
                  : "Không có dữ liệu"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 10,
          color: "#6b7280",
          fontSize: 13,
        }}
      >
        Tổng số:{" "}
        <strong>
          {filteredSuppliers.length}
        </strong>{" "}
        / {suppliers.length} nhà cung cấp
      </div>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "11px 12px",
  borderBottom:
    "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom:
    "1px solid #e5e7eb",
  fontSize: 14,
  whiteSpace: "nowrap",
};

export default SupplierList;