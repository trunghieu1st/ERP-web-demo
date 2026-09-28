import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import ItemForm from "./ItemForm";
import ItemList from "./ItemList";
import ItemDetailPage from "./ItemDetailPage";
import { apiFetch } from "../../../api/apiClient";
import { useAuth } from "../../../auth/AuthContext";

export interface Item {
  inventoryItemId: number | null;
  factoryId: number;
  itemCode: string;
  description: string;
  longDescription: string;
  primaryUomCode: string;
  itemType: string;
  itemCategory: string;
}
type ItemGroup = "FINISHED_GOODS" | "MATERIAL";
type ApiError = { message?: string };
const FINISHED_TYPES = ["Basic Finished Goods", "Detail Finished Goods"];
const MATERIAL_TYPES = ["Basic Material", "Detail Material"];

function mapItem(raw: unknown): Item {
  const x = (raw ?? {}) as Record<string, unknown>;
  const number = (camel: string, upper: string) => {
    const value = x[camel] ?? x[upper];
    return typeof value === "number" ? value : null;
  };
  const str = (camel: string, upper: string) => {
    const value = x[camel] ?? x[upper];
    return typeof value === "string" ? value : "";
  };
  return {
    inventoryItemId: number("inventoryItemId", "INVENTORY_ITEM_ID"),
    factoryId: number("factoryId", "FACTORY_ID") ?? 0,
    itemCode: str("itemCode", "ITEM_CODE"),
    description: str("description", "DESCRIPTION"),
    longDescription: str("longDescription", "LONG_DESCRIPTION"),
    primaryUomCode: str("primaryUomCode", "PRIMARY_UOM_CODE"),
    itemType: str("itemType", "ITEM_TYPE"),
    itemCategory: str("itemCategory", "ITEM_CATEGORY"),
  };
}

export default function ItemPage() {
  const { user } = useAuth();
  const factoryName = user?.factoryName?.trim() || "Chưa xác định nhà máy";
  const [openTabs, setOpenTabs] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [finishedKeyword, setFinishedKeyword] = useState("");
  const [materialKeyword, setMaterialKeyword] = useState("");
  const [finished, setFinished] = useState<Item[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [finishedSearched, setFinishedSearched] = useState(false);
  const [materialSearched, setMaterialSearched] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [formGroup, setFormGroup] = useState<ItemGroup | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const finishedSeq = useRef(0);
  const materialSeq = useRef(0);
  const clearMessage = () => { setError(""); setSuccess(""); };

  const searchItems = useCallback(async (group: ItemGroup, keyword: string) => {
    const isFinished = group === "FINISHED_GOODS";
    const seq = isFinished ? ++finishedSeq.current : ++materialSeq.current;
    const setRows = isFinished ? setFinished : setMaterials;
    const setSearched = isFinished ? setFinishedSearched : setMaterialSearched;
    const setLoading = isFinished ? setFinishedLoading : setMaterialLoading;
    const current = () => seq === (isFinished ? finishedSeq.current : materialSeq.current);
    if (!keyword.trim()) { setRows([]); setSearched(false); setLoading(false); return; }
    setLoading(true);
    try {
      // FactoryId được backend xác định từ JWT; frontend tuyệt đối không gửi factoryId.
      const params = new URLSearchParams({ group, keyword: keyword.trim() });
      const response = await apiFetch(`/api/items/search?${params}`);
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error((data as ApiError | null)?.message || "Không thể tìm kiếm dữ liệu.");
      const rows = Array.isArray(data) ? data :
        data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
          ? (data as { items: unknown[] }).items : [];
      if (current()) { setRows(rows.map(mapItem)); setSearched(true); }
    } catch (e) {
      if (current()) { setRows([]); setSearched(true); setError(e instanceof Error ? e.message : "Không thể tìm kiếm dữ liệu."); }
    } finally { if (current()) setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void searchItems("FINISHED_GOODS", finishedKeyword); }, 300);
    return () => { window.clearTimeout(timer); finishedSeq.current++; };
  }, [finishedKeyword, searchItems]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void searchItems("MATERIAL", materialKeyword); }, 300);
    return () => { window.clearTimeout(timer); materialSeq.current++; };
  }, [materialKeyword, searchItems]);

  const openDetail = (item: Item) => {
    if (item.inventoryItemId === null) return;
    setOpenTabs(tabs => tabs.some(t => t.inventoryItemId === item.inventoryItemId) ? tabs : [...tabs, item]);
    setActiveId(item.inventoryItemId);
    setSelected(null); setFormGroup(null); clearMessage();
  };
  const closeDetail = (id: number) => {
    setOpenTabs(tabs => tabs.filter(t => t.inventoryItemId !== id));
    setActiveId(current => current === id ? null : current);
  };
  const createItem = (group: ItemGroup) => {
    clearMessage(); setActiveId(null); setFormGroup(group);
    setSelected({ inventoryItemId: null, factoryId: 0, itemCode: "", description: "", longDescription: "", primaryUomCode: "", itemType: group === "FINISHED_GOODS" ? "Basic Finished Goods" : "Basic Material", itemCategory: "" });
  };
  const editItem = (item: Item) => {
    clearMessage(); setActiveId(null); setSelected(item);
    setFormGroup(FINISHED_TYPES.includes(item.itemType) ? "FINISHED_GOODS" : "MATERIAL");
  };
  const reload = async (item: Item) => {
    if (FINISHED_TYPES.includes(item.itemType) && finishedKeyword.trim()) await searchItems("FINISHED_GOODS", finishedKeyword);
    if (MATERIAL_TYPES.includes(item.itemType) && materialKeyword.trim()) await searchItems("MATERIAL", materialKeyword);
  };
  const saveItem = async (item: Item) => {
    clearMessage();
    const itemCode = item.itemCode.trim().toUpperCase();
    if (!itemCode) { setError("Vui lòng nhập mã."); return; }
    if (!item.description.trim()) { setError("Vui lòng nhập Mô tả."); return; }
    if (!item.primaryUomCode.trim()) { setError("Vui lòng chọn Đơn vị tính."); return; }
    if (!formGroup) return;
    const itemType = formGroup === "FINISHED_GOODS" ? "Basic Finished Goods" : "Basic Material";
    const itemCategory = formGroup === "FINISHED_GOODS" ? "" : item.itemCategory.trim();
    if (formGroup === "MATERIAL" && !itemCategory) { setError("Vui lòng chọn Nhóm mã."); return; }
    const isCreate = item.inventoryItemId === null;
    try {
      const response = await apiFetch(isCreate ? "/api/items" : `/api/items/${item.inventoryItemId}`, {
        method: isCreate ? "POST" : "PUT",
        body: JSON.stringify({ itemCode, description: item.description.trim(), longDescription: item.longDescription.trim(), primaryUomCode: item.primaryUomCode.trim(), itemType, itemCategory }),
      });
      const result = await response.json().catch(() => null) as ApiError | null;
      if (!response.ok) throw new Error(result?.message || "Không thể lưu mã.");
      if (!isCreate) setOpenTabs(tabs => tabs.map(tab => tab.inventoryItemId === item.inventoryItemId ? { ...tab, ...item, itemCode, itemType, itemCategory } : tab));
      await reload({ ...item, itemCode, itemType, itemCategory });
      setSelected(null); setFormGroup(null);
      setSuccess(isCreate ? "Thêm mã thành công." : "Cập nhật mã thành công.");
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu mã."); }
  };
  const deleteItem = async (item: Item) => {
    if (item.inventoryItemId === null || !window.confirm(`Bạn có chắc muốn xóa mã "${item.itemCode}" không?`)) return;
    clearMessage();
    try {
      const response = await apiFetch(`/api/items/${item.inventoryItemId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as ApiError | null;
      if (!response.ok) throw new Error(result?.message || "Không thể xóa mã.");
      closeDetail(item.inventoryItemId);
      if (selected?.inventoryItemId === item.inventoryItemId) { setSelected(null); setFormGroup(null); }
      await reload(item);
      setSuccess(`Đã xóa mã "${item.itemCode}".`);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa mã."); }
  };

  const renderSection = (group: ItemGroup) => {
    const isFinished = group === "FINISHED_GOODS";
    const keyword = isFinished ? finishedKeyword : materialKeyword;
    const rows = isFinished ? finished : materials;
    const searched = isFinished ? finishedSearched : materialSearched;
    const loading = isFinished ? finishedLoading : materialLoading;
    return <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div><h2 style={styles.sectionTitle}>{isFinished ? "Mã hàng" : "Mã nguyên phụ liệu"}</h2>
          <div style={styles.muted}>Tìm kiếm và quản lý {isFinished ? "mã hàng" : "nguyên phụ liệu"} tại {factoryName}.</div></div>
        <button type="button" style={styles.addButton} onClick={() => createItem(group)}>+ {isFinished ? "Thêm mã hàng" : "Thêm mã NPL"}</button>
      </div>
      <div style={styles.searchArea}><label style={styles.searchLabel}>{isFinished ? "Tìm mã hàng" : "Tìm mã nguyên phụ liệu"}</label>
        <input style={styles.searchInput} value={keyword} placeholder="Nhập mã hoặc mô tả..." autoComplete="off"
          onChange={e => { (isFinished ? setFinishedKeyword : setMaterialKeyword)(e.target.value); setError(""); }} /></div>
      <div style={styles.resultArea}>
        {!keyword.trim() ? <div style={styles.state}>Nhập mã hoặc mô tả để tìm kiếm.</div> :
          loading || !searched ? <div style={styles.state}>Đang tìm kiếm...</div> :
          rows.length === 0 ? <div style={styles.state}>Không tìm thấy dữ liệu phù hợp.</div> :
          <ItemList items={rows} selectedId={null} onSelect={editItem} onDelete={deleteItem}
            {...(isFinished ? { onOpenDetail: openDetail } : {})} />}
      </div>
    </section>;
  };

  return <div style={styles.workspace}>
    <div style={styles.tabs}>
      <button type="button" style={{ ...styles.tab, ...(activeId === null ? styles.activeTab : {}) }} onClick={() => setActiveId(null)}>Mã hàng & Nguyên phụ liệu</button>
      {openTabs.map(tab => <div key={tab.inventoryItemId} style={{ ...styles.tab, ...(activeId === tab.inventoryItemId ? styles.activeTab : {}) }}>
        <button type="button" style={styles.tabLabel} title={tab.itemCode} onClick={() => setActiveId(tab.inventoryItemId)}>{tab.itemCode}</button>
        <button type="button" style={styles.closeButton} onClick={() => closeDetail(tab.inventoryItemId!)} title="Đóng tab">×</button>
      </div>)}
    </div>
    <div style={styles.content}>
      <div style={{ ...styles.page, display: activeId === null ? "flex" : "none" }}>
        <div style={styles.header}><h1 style={styles.title}>Mã hàng & Nguyên phụ liệu</h1><div style={styles.muted}>Phạm vi dữ liệu: <strong>{factoryName}</strong></div></div>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        {selected && formGroup ? <div style={styles.formCard}>
          <div style={styles.formHeader}><h2 style={styles.sectionTitle}>{selected.inventoryItemId === null ? "Thêm" : "Sửa"} {formGroup === "FINISHED_GOODS" ? "mã hàng" : "mã nguyên phụ liệu"}</h2><div style={styles.muted}>Phạm vi: <strong>{factoryName}</strong></div></div>
          <ItemForm item={selected} isEdit={selected.inventoryItemId !== null} onSave={saveItem} onCancel={() => { clearMessage(); setSelected(null); setFormGroup(null); }} />
        </div> : <div style={styles.sections}>{renderSection("FINISHED_GOODS")}{renderSection("MATERIAL")}</div>}
      </div>
      {openTabs.map(tab => tab.inventoryItemId !== null && <div key={tab.inventoryItemId} style={{ display: activeId === tab.inventoryItemId ? "flex" : "none", width: "100%", height: "100%", minHeight: 0 }}>
        <ItemDetailPage itemId={tab.inventoryItemId!} itemCode={tab.itemCode} description={tab.description} onClose={() => closeDetail(tab.inventoryItemId!)} />
      </div>)}
    </div>
  </div>;
}

const styles: Record<string, CSSProperties> = {
  workspace: { width: "100%", height: "100%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f7f8fa" },
  tabs: { flexShrink: 0, minHeight: 50, display: "flex", alignItems: "flex-end", gap: 3, padding: "8px 14px 0", borderBottom: "1px solid #cfd5dd", background: "#e9edf2", overflowX: "auto" },
  tab: { height: 42, maxWidth: 330, display: "flex", alignItems: "center", gap: 8, padding: "0 13px", border: "1px solid #cfd5dd", borderBottom: "none", borderRadius: "8px 8px 0 0", background: "#dfe4ea", whiteSpace: "nowrap" },
  activeTab: { background: "#fff", fontWeight: 700 },
  tabLabel: { border: "none", background: "transparent", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14 },
  closeButton: { border: "none", background: "transparent", cursor: "pointer", fontSize: 18 },
  content: { flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" },
  page: { width: "100%", height: "100%", minHeight: 0, flexDirection: "column", padding: "18px 24px", boxSizing: "border-box", overflow: "hidden" },
  header: { marginBottom: 14 }, title: { margin: 0, fontSize: 25, color: "#111827" }, muted: { marginTop: 4, color: "#6b7280", fontSize: 12 },
  error: { padding: 10, marginBottom: 10, border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", color: "#b91c1c" },
  success: { padding: 10, marginBottom: 10, border: "1px solid #bbf7d0", borderRadius: 6, background: "#f0fdf4", color: "#15803d" },
  sections: { flex: 1, minHeight: 0, display: "grid", gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 },
  section: { minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e1e5ea", borderRadius: 9, background: "#fff" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 16px", borderBottom: "1px solid #e5e7eb" },
  sectionTitle: { margin: 0, fontSize: 16, color: "#111827" }, addButton: { padding: "10px 15px", border: 0, borderRadius: 6, background: "#1976d2", color: "#fff", cursor: "pointer" },
  searchArea: { padding: "8px 16px", background: "#fafbfc", borderBottom: "1px solid #e5e7eb" },
  searchLabel: { display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600 },
  searchInput: { width: "100%", height: 36, boxSizing: "border-box", padding: "0 11px", border: "1px solid #d1d5db", borderRadius: 6 },
  resultArea: { flex: 1, minHeight: 0, padding: "8px 16px 10px", overflow: "hidden" },
  state: { height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "#6b7280", border: "1px dashed #d1d5db", borderRadius: 6 },
  formCard: { flex: 1, minHeight: 0, overflowY: "auto", border: "1px solid #dfe3e8", borderRadius: 9, background: "#fff" },
  formHeader: { padding: "14px 20px", borderBottom: "1px solid #e5e7eb" },
};
