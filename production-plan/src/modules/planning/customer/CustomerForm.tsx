
import { useEffect, useState } from "react";

import type { Customer } from "./CustomerPage";

type CustomerFormProps = {
  customer: Customer;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
};

function CustomerForm({
  customer,
  onSave,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] =
    useState<Customer>(customer);

  useEffect(() => {
    setFormData(customer);
  }, [customer]);

  const handleChange = (
    field: keyof Customer,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(300px, 1fr))",
          gap: "16px",
          maxWidth: "1000px",
        }}
      >
        {/* MÃ KHÁCH HÀNG */}
        <div>
          <label>Mã khách hàng</label>

          <input
            value={formData.code}
            onChange={(e) =>
              handleChange(
                "code",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        {/* TÊN KHÁCH HÀNG */}
        <div>
          <label>Tên khách hàng</label>

          <input
            value={formData.name}
            onChange={(e) =>
              handleChange(
                "name",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        {/* ĐỊA CHỈ */}
        <div>
          <label>Địa chỉ</label>

          <input
            value={formData.address}
            onChange={(e) =>
              handleChange(
                "address",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        {/* QUỐC GIA */}
        <div>
          <label>Quốc gia</label>

          <input
            value={formData.country}
            onChange={(e) =>
              handleChange(
                "country",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        {/* TRẠNG THÁI */}
        <div>
          <label>Trạng thái</label>

          <select
            value={formData.active}
            onChange={(e) =>
              handleChange(
                "active",
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="ACTIVE">
              Hoạt động
            </option>

            <option value="INACTIVE">
              Ngừng hoạt động
            </option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <button
          type="submit"
          style={{
            padding: "9px 20px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Lưu
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "9px 20px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 10px",
  marginTop: "6px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
};

export default CustomerForm;
