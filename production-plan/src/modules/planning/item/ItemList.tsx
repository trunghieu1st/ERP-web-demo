import type { CSSProperties } from "react";
import type { Item } from "./ItemPage";

interface ItemListProps {
  items: Item[];
  selectedId: number | null;
  onSelect: (item: Item) => void;
  onDelete: (item: Item) => void;
  onOpenDetail?: (item: Item) => void;
}

function ItemList({ items, selectedId, onSelect, onDelete, onOpenDetail }: ItemListProps) {
  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <colgroup>
            <col style={{ width: "11%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead><tr><th style={styles.th}>Mã</th><th style={styles.th}>Mô tả</th><th style={styles.th}>Đơn vị</th><th style={styles.th}>Loại mã</th><th style={styles.th}>Nhóm mã</th><th style={styles.th}>Thao tác</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={styles.empty}>Không có dữ liệu.</td></tr>
            ) : items.map((item) => {
              const isSelected = item.inventoryItemId === selectedId;
              return (
                <tr key={item.inventoryItemId ?? item.itemCode} style={isSelected ? styles.selectedRow : undefined}>
                  <td style={styles.td}>
                    <button type="button" style={styles.codeButton} onClick={() => onOpenDetail ? onOpenDetail(item) : onSelect(item)} title={onOpenDetail ? "Mở chi tiết mã hàng" : "Sửa mã"}>{item.itemCode}</button>
                  </td>
                  <td style={styles.td} title={item.description}>{item.description}</td>
                  <td style={styles.td}>{item.primaryUomCode}</td>
                  <td style={styles.td} title={item.itemType}>{item.itemType}</td>
                  <td style={styles.td} title={item.itemCategory}>{item.itemCategory || "-"}</td>
                  <td style={styles.td}><div style={styles.actions}>
                    <button type="button" style={styles.editButton} onClick={() => onSelect(item)}>Sửa</button>
                    <button type="button" style={styles.deleteButton} onClick={() => onDelete(item)}>Xóa</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { width: "100%", height: "100%", minWidth: 0, minHeight: 0, overflow: "hidden", boxSizing: "border-box" },
  tableWrapper: { width: "100%", height: "100%", minWidth: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden", border: "1px solid #e5e7eb", borderRadius: "7px", background: "#ffffff", boxSizing: "border-box" },
  table: { width: "100%", minWidth: 0, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, background: "#ffffff" },
  th: { position: "sticky", top: 0, zIndex: 2, height: "38px", padding: "0 12px", borderBottom: "1px solid #e5e7eb", background: "#f8f9fa", color: "#374151", textAlign: "left", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" },
  td: { height: "48px", padding: "0 12px", borderBottom: "1px solid #eeeeee", color: "#111827", fontSize: "13px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  selectedRow: { background: "#f0f7ff" },
  codeButton: { maxWidth: "100%", padding: 0, border: "none", background: "transparent", color: "#1976d2", cursor: "pointer", fontSize: "13px", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  actions: { display: "flex", alignItems: "center", gap: "6px" },
  editButton: { height: "29px", padding: "0 10px", border: "1px solid #d1d5db", borderRadius: "5px", background: "#ffffff", color: "#111827", cursor: "pointer", fontSize: "12px" },
  deleteButton: { height: "29px", padding: "0 10px", border: "1px solid #fecaca", borderRadius: "5px", background: "#ffffff", color: "#dc2626", cursor: "pointer", fontSize: "12px" },
  empty: { height: "80px", textAlign: "center", color: "#6b7280", fontSize: "13px" },
};

export default ItemList;
