import { useEffect, useState } from "react";

import type { Supplier } from "./SupplierPage";

type SupplierFormProps = {
  supplier: Supplier;
  onSave: (supplier: Supplier) => void;
  onCancel: () => void;
};

function SupplierForm({
  supplier,
  onSave,
  onCancel,
}: SupplierFormProps) {
  const [formData, setFormData] =
    useState<Supplier>(supplier);

  useEffect(() => {
    setFormData(supplier);
  }, [supplier]);

  const handleChange = (
    field: keyof Supplier,
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
        {/* ==================================================
            MÃ NHÀ CUNG CẤP
           ================================================== */}

        <div>
          <label>Mã nhà cung cấp</label>

          <input
            value={formData.code}
            onChange={(e) =>
              handleChange(
                "code",
                e.target.value
              )
            }
            style={inputStyle}
            placeholder="Nhập mã nhà cung cấp"
          />
        </div>

        {/* ==================================================
            TÊN NHÀ CUNG CẤP
           ================================================== */}

        <div>
          <label>Tên nhà cung cấp</label>

          <input
            value={formData.name}
            onChange={(e) =>
              handleChange(
                "name",
                e.target.value
              )
            }
            style={inputStyle}
            placeholder="Nhập tên nhà cung cấp"
          />
        </div>

        {/* ==================================================
            QUỐC GIA
           ================================================== */}

        <div>
          <label>Quốc gia</label>

          <input
            value={formData.countryCode}
            onChange={(e) =>
              handleChange(
                "countryCode",
                e.target.value
              )
            }
            style={inputStyle}
            placeholder="Nhập mã quốc gia"
          />
        </div>

        {/* ==================================================
            ĐỊA CHỈ
           ================================================== */}

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
            placeholder="Nhập địa chỉ"
          />
        </div>

        {/* ==================================================
            SỐ ĐIỆN THOẠI
           ================================================== */}

        <div>
          <label>Số điện thoại</label>

          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              handleChange(
                "phoneNumber",
                e.target.value
              )
            }
            style={inputStyle}
            placeholder="Nhập số điện thoại"
          />
        </div>

        {/* ==================================================
            EMAIL
           ================================================== */}

        <div>
          <label>Email</label>

          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              handleChange(
                "email",
                e.target.value
              )
            }
            style={inputStyle}
            placeholder="Nhập email"
          />
        </div>

        {/* ==================================================
            TRẠNG THÁI
           ================================================== */}

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

      {/* ====================================================
          BUTTONS
         ==================================================== */}

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

export default SupplierForm;