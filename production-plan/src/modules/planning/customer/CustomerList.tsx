
import { useState } from "react";
import type { CSSProperties } from "react";

import type { Customer } from "./CustomerPage";

type CustomerListProps = {
  customers: Customer[];
  selectedId: number | null;
  onSelect: (customer: Customer) => void;
  onDelete: (id: number) => void;
};

function CustomerList({
  customers,
  selectedId,
  onSelect,
  onDelete,
}: CustomerListProps) {
  const [searchText, setSearchText] =
    useState("");

  const keyword =
    searchText.trim().toLowerCase();

  const filteredCustomers =
    customers.filter((customer) => {
      if (!keyword) {
        return true;
      }

      return (
        customer.code
          .toLowerCase()
          .includes(keyword) ||
        customer.name
          .toLowerCase()
          .includes(keyword) ||
        customer.address
          .toLowerCase()
          .includes(keyword) ||
        customer.country
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
      {/* THANH TÌM KIẾM */}
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
          placeholder="Tìm mã, tên, địa chỉ, quốc gia..."
          style={{
            width: 400,
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

      {/* CUSTOMER TABLE */}
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
              Mã khách hàng
            </th>

            <th style={thStyle}>
              Tên khách hàng
            </th>

            <th style={thStyle}>
              Địa chỉ
            </th>

            <th style={thStyle}>
              Quốc gia
            </th>

            <th style={thStyle}>
              Trạng thái
            </th>

            <th
              style={{
                ...thStyle,
                textAlign:
                  "center",
              }}
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredCustomers.map(
            (customer, index) => {
              const isSelected =
                customer.id ===
                selectedId;

              return (
                <tr
                  key={customer.id}
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

                  {/* MÃ KHÁCH HÀNG */}
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
                          customer
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
                        textDecoration:
                          "none",
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
                      {customer.code}
                    </button>
                  </td>

                  {/* TÊN */}
                  <td style={tdStyle}>
                    {customer.name}
                  </td>

                  {/* ĐỊA CHỈ */}
                  <td style={tdStyle}>
                    {customer.address}
                  </td>

                  {/* QUỐC GIA */}
                  <td style={tdStyle}>
                    {customer.country}
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
                          customer.active ===
                          "ACTIVE"
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          customer.active    ===
                          "ACTIVE"
                            ? "#166534"
                            : "#991b1b",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {customer.active ===
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
                          customer.partyId
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

          {filteredCustomers.length ===
            0 && (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: 40,
                  textAlign:
                    "center",
                  color:
                    "#6b7280",
                }}
              >
                {searchText
                  ? "Không tìm thấy khách hàng phù hợp"
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
          {filteredCustomers.length}
        </strong>{" "}
        / {customers.length} khách hàng
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

export default CustomerList;