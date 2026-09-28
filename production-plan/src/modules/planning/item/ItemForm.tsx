import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Item } from "./ItemPage";

// ============================================================
// PROPS
// ============================================================

interface ItemFormProps {
  item: Item;

  isEdit: boolean;

  onSave: (
    item: Item,
  ) => void;

  onCancel: () => void;
}

// ============================================================
// CONSTANT
// ============================================================

const FINISHED_GOOD_TYPES = [
  "Basic Finished Goods",
  "Detail Finished Goods",
];

const MATERIAL_TYPES = [
  "Basic Material",
  "Detail Material",
];

// ============================================================
// UOM OPTIONS
//
// Giữ các đơn vị cơ bản.
// Nếu file cũ của b có danh sách khác thì có thể thêm vào đây.
// ============================================================

const UOM_OPTIONS = [
  "PCS",
  "EA",
  "Ea",
  "KG",
  "G",
  "M",
  "CM",
  "MM",
  "M2",
  "M3",
  "YD",
  "FT",
  "IN",
  "ROLL",
  "SET",
  "PAIR",
  "BOX",
  "BAG",
];

// ============================================================
// CATEGORY OPTIONS
//
// Nếu hệ thống b đang có thêm category,
// thêm vào mảng này.
// ============================================================

const MATERIAL_CATEGORY_OPTIONS = [
  "Fabric",
  "Accessory",
  "Packing",
  "Thread",
  "Label",
  "Button",
  "Zipper",
  "Elastic",
  "Other",
];

// ============================================================
// COMPONENT
// ============================================================

function ItemForm({
  item,
  isEdit,
  onSave,
  onCancel,
}: ItemFormProps) {
  // ==========================================================
  // DETERMINE GROUP
  // ==========================================================

  const isFinishedGoods =
    useMemo(() => {
      return (
        FINISHED_GOOD_TYPES.includes(
          item.itemType,
        ) ||
        (!item.itemType &&
          item.itemCategory === "")
      );
    }, [
      item.itemType,
      item.itemCategory,
    ]);

  const isMaterial =
    useMemo(() => {
      return MATERIAL_TYPES.includes(
        item.itemType,
      );
    }, [item.itemType]);

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [form, setForm] =
    useState<Item>(() => ({
      ...item,
    }));

  // ==========================================================
  // SYNC WHEN ITEM CHANGES
  // ==========================================================

  useEffect(() => {
    setForm({
      ...item,
    });
  }, [item]);

  // ==========================================================
  // NORMALIZE DEFAULT TYPE
  //
  // ItemPage khi tạo mới sẽ truyền type tương ứng.
  // Phần này chủ yếu bảo vệ dữ liệu khi edit.
  // ==========================================================

  useEffect(() => {
    if (form.itemType) {
      return;
    }

    if (isFinishedGoods) {
      setForm((current) => ({
        ...current,

        itemType:
          "Basic Finished Goods",

        itemCategory: "",
      }));

      return;
    }

    if (isMaterial) {
      setForm((current) => ({
        ...current,

        itemType:
          "Basic Material",
      }));
    }
  }, [
    form.itemType,
    isFinishedGoods,
    isMaterial,
  ]);

  // ==========================================================
  // CHANGE
  // ==========================================================

  const updateField = <
    K extends keyof Item,
  >(
    field: K,
    value: Item[K],
  ) => {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSubmit = (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedItem: Item = {
      ...form,

      itemCode:
        form.itemCode
          .trim()
          .toUpperCase(),

      description:
        form.description.trim(),

      longDescription:
        form.longDescription.trim(),

      primaryUomCode:
        form.primaryUomCode.trim(),

      // --------------------------------------------
      // MÃ HÀNG
      // --------------------------------------------

      itemType: isFinishedGoods
        ? "Basic Finished Goods"
        : "Basic Material",

      // Mã hàng không dùng nhóm mã.
      itemCategory: isFinishedGoods
        ? ""
        : form.itemCategory.trim(),
    };

    onSave(normalizedItem);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <form
      onSubmit={handleSubmit}
      style={styles.form}
    >
      {/* =====================================================
          BASIC INFORMATION
      ====================================================== */}

      <div style={styles.body}>
        <div style={styles.grid}>
          {/* =================================================
              ITEM CODE
          ================================================== */}

          <div style={styles.field}>
            <label
              style={styles.label}
            >
              {isFinishedGoods
                ? "Mã hàng"
                : "Mã nguyên phụ liệu"}

              <span
                style={
                  styles.required
                }
              >
                *
              </span>
            </label>

            <input
              type="text"
              value={form.itemCode}
              placeholder={
                isFinishedGoods
                  ? "Nhập mã hàng"
                  : "Nhập mã nguyên phụ liệu"
              }
              style={styles.input}
              autoFocus={!isEdit}
              onChange={(event) =>
                updateField(
                  "itemCode",
                  event.target.value,
                )
              }
            />
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================== */}

          <div style={styles.field}>
            <label
              style={styles.label}
            >
              Mô tả

              <span
                style={
                  styles.required
                }
              >
                *
              </span>
            </label>

            <input
              type="text"
              value={
                form.description
              }
              placeholder="Nhập mô tả"
              style={styles.input}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
            />
          </div>

          {/* =================================================
              LONG DESCRIPTION
          ================================================== */}

          <div
            style={
              styles.fullWidthField
            }
          >
            <label
              style={styles.label}
            >
              Mô tả chi tiết
            </label>

            <textarea
              value={
                form.longDescription
              }
              placeholder="Nhập mô tả chi tiết"
              style={
                styles.textarea
              }
              onChange={(event) =>
                updateField(
                  "longDescription",
                  event.target.value,
                )
              }
            />
          </div>

          {/* =================================================
              UOM
          ================================================== */}

          <div style={styles.field}>
            <label
              style={styles.label}
            >
              Đơn vị tính

              <span
                style={
                  styles.required
                }
              >
                *
              </span>
            </label>

            <select
              value={
                form.primaryUomCode
              }
              style={styles.select}
              onChange={(event) =>
                updateField(
                  "primaryUomCode",
                  event.target.value,
                )
              }
            >
              <option value="">
                -- Chọn đơn vị tính --
              </option>

              {UOM_OPTIONS.map(
                (uom) => (
                  <option
                    key={uom}
                    value={uom}
                  >
                    {uom}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* =================================================
              TYPE - DISPLAY ONLY
          ================================================== */}

          <div style={styles.field}>
            <label
              style={styles.label}
            >
              Loại mã
            </label>

            <div
              style={
                styles.readOnlyValue
              }
            >
              {isFinishedGoods
                ? "Basic Finished Goods"
                : "Basic Material"}
            </div>
          </div>

          {/* =================================================
              CATEGORY

              Chỉ hiện với NPL.
          ================================================== */}

          {!isFinishedGoods && (
            <div
              style={styles.field}
            >
              <label
                style={styles.label}
              >
                Nhóm mã

                <span
                  style={
                    styles.required
                  }
                >
                  *
                </span>
              </label>

              <select
                value={
                  form.itemCategory
                }
                style={
                  styles.select
                }
                onChange={(event) =>
                  updateField(
                    "itemCategory",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  -- Chọn nhóm mã --
                </option>

                {MATERIAL_CATEGORY_OPTIONS.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        category
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div style={styles.footer}>
        <button
          type="button"
          style={
            styles.cancelButton
          }
          onClick={onCancel}
        >
          Hủy
        </button>

        <button
          type="submit"
          style={
            styles.saveButton
          }
        >
          {isEdit
            ? "Lưu thay đổi"
            : isFinishedGoods
              ? "Thêm mã hàng"
              : "Thêm mã NPL"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  form: {
    width: "100%",

    background: "#fff",
  },

  body: {
    padding: "22px 24px 26px",
  },

  grid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    columnGap: "24px",

    rowGap: "20px",
  },

  field: {
    minWidth: 0,
  },

  fullWidthField: {
    gridColumn: "1 / -1",

    minWidth: 0,
  },

  label: {
    display: "block",

    marginBottom: "7px",

    color: "#1f2937",

    fontSize: "13px",

    fontWeight: 600,
  },

  required: {
    marginLeft: "4px",

    color: "#dc2626",
  },

  input: {
    display: "block",

    width: "100%",

    height: "42px",

    padding: "0 12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "6px",

    outline: "none",

    background: "#fff",

    color: "#111827",

    fontSize: "14px",

    boxSizing:
      "border-box" as const,
  },

  select: {
    display: "block",

    width: "100%",

    height: "42px",

    padding: "0 12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "6px",

    outline: "none",

    background: "#fff",

    color: "#111827",

    fontSize: "14px",

    boxSizing:
      "border-box" as const,
  },

  textarea: {
    display: "block",

    width: "100%",

    minHeight: "92px",

    padding: "11px 12px",

    resize:
      "vertical" as const,

    border:
      "1px solid #d1d5db",

    borderRadius: "6px",

    outline: "none",

    background: "#fff",

    color: "#111827",

    fontFamily: "inherit",

    fontSize: "14px",

    lineHeight: 1.5,

    boxSizing:
      "border-box" as const,
  },

  readOnlyValue: {
    display: "flex",

    alignItems: "center",

    width: "100%",

    height: "42px",

    padding: "0 12px",

    border:
      "1px solid #e5e7eb",

    borderRadius: "6px",

    background: "#f3f4f6",

    color: "#4b5563",

    fontSize: "14px",

    boxSizing:
      "border-box" as const,
  },

  footer: {
    display: "flex",

    justifyContent:
      "flex-end",

    alignItems: "center",

    gap: "10px",

    padding: "16px 24px",

    borderTop:
      "1px solid #e5e7eb",

    background: "#fafafa",
  },

  cancelButton: {
    minWidth: "82px",

    height: "40px",

    padding: "0 18px",

    border:
      "1px solid #d1d5db",

    borderRadius: "6px",

    background: "#fff",

    color: "#111827",

    cursor: "pointer",

    fontSize: "13px",

    fontWeight: 600,
  },

  saveButton: {
    minWidth: "120px",

    height: "40px",

    padding: "0 20px",

    border: "none",

    borderRadius: "6px",

    background: "#1976d2",

    color: "#fff",

    cursor: "pointer",

    fontSize: "13px",

    fontWeight: 600,
  },
};

export default ItemForm;