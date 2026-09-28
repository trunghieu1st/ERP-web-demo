import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { apiFetch } from "../../../api/apiClient";

const API = "/api/sales-agreements";
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.message || `API error ${response.status}`);
  return data as T;
}
type Customer = {
  custAccountId: number;
  partyName: string | null;
  accountName: string;
};
type Currency = { currencyCode: string; currencyName: string | null };
type Price = { headerId: number; priceListName: string | null };
type Collection = {
  collectionHeaderId: number;
  collectionCode: string | null;
  collectionName: string | null;
};
type Item = {
  inventoryItemId: number;
  itemCode: string;
  primaryUomCode: string | null;
  longDescription: string | null;
};
type Options = {
  customers: Customer[];
  currencies: Currency[];
  priceLists: Price[];
  collections: Collection[];
  items: Item[];
};
type Agreement = {
  headerId: number;
  saleAgreementName: string;
  saleAgreementNumber: number;
  custAccountId: number | null;
  priceListId: number | null;
  collectionHeaderId: number | null;
  transactionalCurrCode: string | null;
  startDate: string | null;
  endDate: string | null;
};
type Detail = {
  header: Agreement;
  lines: Array<{
    lineId: number;
    inventoryItemId: number | null;
    itemCode: string;
    primaryUomCode: string | null;
    longDescription: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
};
type Line = {
  key: string;
  lineId?: number;
  inventoryItemId: number | null;
  startDate: string;
  endDate: string;
};
type Form = {
  saleAgreementName: string;
  custAccountId: number | null;
  priceListId: number | null;
  collectionHeaderId: number | null;
  transactionalCurrCode: string;
  startDate: string;
  endDate: string;
  lines: Line[];
};
const key = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const blankLine = (): Line => ({
  key: key(),
  inventoryItemId: null,
  startDate: "",
  endDate: "",
});
const blankForm = (): Form => ({
  saleAgreementName: "",
  custAccountId: null,
  priceListId: null,
  collectionHeaderId: null,
  transactionalCurrCode: "",
  startDate: "",
  endDate: "",
  lines: [blankLine()],
});
const date = (s: string | null | undefined) => s?.slice(0, 10) ?? "";
const sendDate = (s: string) => (s ? `${s}T00:00:00` : null);
const numberOrNull = (s: string) => (s ? Number(s) : null);
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Thao tác thất bại.";
const css: Record<string, CSSProperties> = {
  page: {
    padding: 20,
    background: "#f4f7fb",
    minHeight: "100%",
    color: "#213047",
    paddingBottom: 94,
  },
  card: {
    background: "white",
    border: "1px solid #dce5ef",
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(225px,1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    font: "inherit",
    background: "white",
    fontWeight: 400,
  },
  readonly: { background: "#f0f3f7", color: "#59677b" },
  primary: {
    background: "#1463b8",
    color: "white",
    border: 0,
    borderRadius: 6,
    padding: "9px 16px",
    fontWeight: 650,
    cursor: "pointer",
  },
  secondary: {
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "9px 16px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    minWidth: 880,
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    background: "#edf3fa",
    position: "sticky",
    top: 0,
    zIndex: 1,
    padding: 10,
    borderBottom: "1px solid #d9e3ef",
  },
  td: {
    padding: 8,
    borderBottom: "1px solid #e5ebf2",
    verticalAlign: "middle",
  },
};
export default function SalesAgreementPage() {
  const [options, setOptions] = useState<Options>({
    customers: [],
    currencies: [],
    priceLists: [],
    collections: [],
    items: [],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNumber, setEditingNumber] = useState<number | null>(null);
  // Chỉ khóa tên chương trình khi đã tải được một chương trình có thật.
  const [programLocked, setProgramLocked] = useState(false);
  const [form, setForm] = useState<Form>(blankForm);
  const [existingItems, setExistingItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const loadOptions = useCallback(async () => {
    const data = await request<Options>(`${API}/options`);
    setOptions(data);
  }, []);
  useEffect(() => {
    void loadOptions().catch((e) => setError(message(e)));
  }, [loadOptions]);
  const load = useCallback(async (id: number) => {
    const detail = await request<Detail>(`${API}/${id}`);
    setEditingId(detail.header.headerId);
    setProgramLocked(true);
    setEditingNumber(detail.header.saleAgreementNumber);
    setForm({
      saleAgreementName: detail.header.saleAgreementName,
      custAccountId: detail.header.custAccountId,
      priceListId: detail.header.priceListId,
      collectionHeaderId: detail.header.collectionHeaderId,
      transactionalCurrCode: detail.header.transactionalCurrCode ?? "",
      startDate: date(detail.header.startDate),
      endDate: date(detail.header.endDate),
      lines: [
        ...detail.lines.map((l) => ({
          key: key(),
          lineId: l.lineId,
          inventoryItemId: l.inventoryItemId,
          startDate: date(l.startDate),
          endDate: date(l.endDate),
        })),
        blankLine(),
      ],
    });
    setExistingItems(
      detail.lines
        .filter((l) => l.inventoryItemId != null)
        .map((l) => ({
          inventoryItemId: l.inventoryItemId!,
          itemCode: l.itemCode,
          primaryUomCode: l.primaryUomCode,
          longDescription: l.longDescription,
        })),
    );
  }, []);
  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    const term = form.saleAgreementName.trim();
    if (!term) {
      setError("Vui lòng nhập tên chương trình để tìm kiếm.");
      return;
    }
    const current = ++sequence.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const matches = await request<Agreement[]>(
        `${API}?keyword=${encodeURIComponent(term)}`,
      );
      if (current !== sequence.current) return;
      // Không tự ý mở chương trình gần giống: tránh sửa nhầm hoặc tạo trùng.
      const exact = matches.find(
        (x) =>
          x.saleAgreementName.trim().toLocaleLowerCase() ===
          term.toLocaleLowerCase(),
      );
      if (exact) {
        await Promise.all([load(exact.headerId), loadOptions()]);
        if (current === sequence.current)
          setNotice("Đã tải thông tin chương trình.");
      } else {
        // Chưa tồn tại: giữ tên đã nhập, cho phép nhập Header/Line và lưu mới.
        setEditingId(null);
        setProgramLocked(false);
        setEditingNumber(null);
        setExistingItems([]);
        setForm({ ...blankForm(), saleAgreementName: term });
        if (matches.length > 0)
          setNotice(
            "Không có tên trùng chính xác. Hãy kiểm tra các tên gần giống trước khi tạo mới.",
          );
        else
          setNotice(
            "Chưa có chương trình này. Bạn có thể nhập thông tin và nhấn Lưu để tạo mới.",
          );
      }
    } catch (err) {
      if (current === sequence.current) setError(message(err));
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  };
  const update = <K extends keyof Form>(name: K, value: Form[K]) =>
    setForm((old) => ({ ...old, [name]: value }));
  const updateLine = (rowKey: string, patch: Partial<Line>) =>
    setForm((old) => {
      let lines = old.lines.map((l) =>
        l.key === rowKey ? { ...l, ...patch } : l,
      );
      if (
        patch.inventoryItemId != null &&
        lines.every((l) => l.inventoryItemId != null)
      )
        lines = [...lines, blankLine()];
      return { ...old, lines };
    });
  const allItems = useMemo(
    () =>
      new Map(
        [...options.items, ...existingItems].map((i) => [i.inventoryItemId, i]),
      ),
    [options.items, existingItems],
  );
  const selected = useMemo(
    () =>
      new Set(
        form.lines
          .map((l) => l.inventoryItemId)
          .filter((id): id is number => id != null),
      ),
    [form.lines],
  );
  const refresh = async () => {
    ++sequence.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await loadOptions();
      setEditingId(null);
      setProgramLocked(false);
      setEditingNumber(null);
      setExistingItems([]);
      setForm(blankForm());
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!form.saleAgreementName.trim()) {
      setError("Vui lòng nhập tên chương trình.");
      return;
    }
    if (form.custAccountId == null) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (!form.transactionalCurrCode.trim()) {
      setError("Vui lòng chọn đơn vị tiền tệ.");
      return;
    }
    const lines = form.lines.filter((l) => l.inventoryItemId != null);
    if (lines.length !== new Set(lines.map((l) => l.inventoryItemId)).size) {
      setError("Mã hàng không được trùng trong cùng chương trình.");
      return;
    }
    if (
      (form.startDate && form.endDate && form.startDate > form.endDate) ||
      lines.some((l) => l.startDate && l.endDate && l.startDate > l.endDate)
    ) {
      setError("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const isCreate = editingId == null;
      const result = await request<{ headerId: number }>(
        isCreate ? API : `${API}/${editingId}`,
        {
          method: isCreate ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saleAgreementName: form.saleAgreementName.trim(),
            custAccountId: form.custAccountId,
            priceListId: form.priceListId,
            collectionHeaderId: form.collectionHeaderId,
            transactionalCurrCode: form.transactionalCurrCode || null,
            startDate: sendDate(form.startDate),
            endDate: sendDate(form.endDate),
            lines: lines.map((l) => ({
              lineId: isCreate ? null : (l.lineId ?? null),
              inventoryItemId: l.inventoryItemId,
              startDate: sendDate(l.startDate),
              endDate: sendDate(l.endDate),
            })),
          }),
        },
      );
      const id = isCreate ? result.headerId : editingId!;
      await Promise.all([load(id), loadOptions()]);
      setNotice(
        isCreate
          ? "Đã tạo chương trình mới thành công."
          : "Đã lưu thay đổi thành công.",
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={css.page}>
      <h1 style={{ margin: "0 0 16px", fontSize: 23 }}>
        Thông tin hợp đồng / mùa hàng
      </h1>
      {error && (
        <div
          role="alert"
          style={{
            padding: 11,
            background: "#fff0f0",
            color: "#a51c1c",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          style={{
            padding: 11,
            background: "#eaf8ed",
            color: "#176b32",
            marginBottom: 12,
          }}
        >
          {notice}
        </div>
      )}
      <section style={css.card}>
        <div style={css.toolbar}>
          <strong>Header — Thông tin chương trình</strong>
          <button
            type="button"
            style={css.primary}
            disabled={busy || !form.saleAgreementName.trim() || programLocked}
            onClick={() => void search()}
          >
            Tìm kiếm
          </button>
        </div>
        <div style={css.grid}>
          <label style={css.field}>
            Chương trình *
            <input
              style={{ ...css.input, ...(programLocked ? css.readonly : {}) }}
              readOnly={programLocked}
              maxLength={250}
              value={form.saleAgreementName}
              onChange={(e) => {
                if (programLocked) return;
                ++sequence.current;
                update("saleAgreementName", e.target.value);
                setNotice("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !programLocked) {
                  e.preventDefault();
                  void search();
                }
              }}
              placeholder="Nhập tên chương trình, sau đó nhấn Tìm kiếm"
            />
          </label>
          <label style={css.field}>
            Số SA
            <input
              style={{ ...css.input, ...css.readonly }}
              readOnly
              value={editingNumber ?? "Tự sinh khi lưu mới"}
            />
          </label>
          <label style={css.field}>
            Khách hàng *
            <select
              style={css.input}
              disabled={busy}
              value={form.custAccountId ?? ""}
              onChange={(e) =>
                update("custAccountId", numberOrNull(e.target.value))
              }
            >
              <option value="">-- Chọn khách hàng --</option>
              {options.customers.map((c) => (
                <option key={c.custAccountId} value={c.custAccountId}>
                  {c.partyName ?? ""} - {c.accountName}
                </option>
              ))}
            </select>
          </label>
          <label style={css.field}>
            Đơn vị tiền tệ *
            <select
              style={css.input}
              disabled={busy}
              value={form.transactionalCurrCode}
              onChange={(e) => update("transactionalCurrCode", e.target.value)}
            >
              <option value="">-- Chọn tiền tệ --</option>
              {options.currencies.map((c) => (
                <option key={c.currencyCode} value={c.currencyCode}>
                  {c.currencyCode}
                  {c.currencyName ? ` - ${c.currencyName}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label style={css.field}>
            Bảng giá
            <select
              style={css.input}
              disabled={busy}
              value={form.priceListId ?? ""}
              onChange={(e) =>
                update("priceListId", numberOrNull(e.target.value))
              }
            >
              <option value="">-- Chọn bảng giá --</option>
              {options.priceLists.map((p) => (
                <option key={p.headerId} value={p.headerId}>
                  {p.priceListName ?? `#${p.headerId}`}
                </option>
              ))}
            </select>
          </label>
          <label style={css.field}>
            Bảng tập hợp NPL
            <select
              style={css.input}
              disabled={busy}
              value={form.collectionHeaderId ?? ""}
              onChange={(e) =>
                update("collectionHeaderId", numberOrNull(e.target.value))
              }
            >
              <option value="">-- Chọn bảng tập hợp NPL --</option>
              {options.collections.map((c) => (
                <option key={c.collectionHeaderId} value={c.collectionHeaderId}>
                  {c.collectionCode ?? ""}{" "}
                  {c.collectionName ? `- ${c.collectionName}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label style={css.field}>
            Ngày bắt đầu
            <input
              type="date"
              style={css.input}
              disabled={busy}
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </label>
          <label style={css.field}>
            Ngày kết thúc
            <input
              type="date"
              style={css.input}
              disabled={busy}
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
          </label>
        </div>
      </section>
      <section style={{ ...css.card, marginBottom: 8 }}>
        <div style={css.toolbar}>
          <strong>Line — Danh sách mã hàng</strong>
          <button
            type="button"
            style={css.primary}
            disabled={busy}
            onClick={() => update("lines", [...form.lines, blankLine()])}
          >
            + Thêm dòng
          </button>
        </div>
        <div
          style={{
            overflow: "auto",
            maxHeight: "min(46vh, 470px)",
            border: "1px solid #e0e7ef",
            borderRadius: 6,
          }}
        >
          <table style={css.table}>
            <thead>
              <tr>
                {[
                  "STT",
                  "Mã hàng",
                  "Đơn vị tính",
                  "Diễn giải",
                  "Ngày bắt đầu",
                  "Ngày kết thúc",
                  "",
                ].map((t) => (
                  <th style={css.th} key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, index) => {
                const item =
                  line.inventoryItemId == null
                    ? undefined
                    : allItems.get(line.inventoryItemId);
                // API trả về mã hàng chưa thuộc chương trình nào; giữ các mã đã có trong chương trình hiện tại.
                const available = Array.from(allItems.values()).filter(
                  (i) =>
                    i.inventoryItemId === line.inventoryItemId ||
                    (!selected.has(i.inventoryItemId) &&
                      options.items.some(
                        (x) => x.inventoryItemId === i.inventoryItemId,
                      )),
                );
                return (
                  <tr key={line.key}>
                    <td style={css.td}>{index + 1}</td>
                    <td style={{ ...css.td, minWidth: 190 }}>
                      <select
                        aria-label={`Mã hàng dòng ${index + 1}`}
                        style={css.input}
                        disabled={busy}
                        value={line.inventoryItemId ?? ""}
                        onChange={(e) =>
                          updateLine(line.key, {
                            inventoryItemId: numberOrNull(e.target.value),
                          })
                        }
                      >
                        <option value="">-- Chọn mã hàng --</option>
                        {available.map((i) => (
                          <option
                            key={i.inventoryItemId}
                            value={i.inventoryItemId}
                          >
                            {i.itemCode}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={css.td}>{item?.primaryUomCode ?? ""}</td>
                    <td style={{ ...css.td, minWidth: 220 }}>
                      {item?.longDescription ?? ""}
                    </td>
                    <td style={css.td}>
                      <input
                        aria-label={`Ngày bắt đầu dòng ${index + 1}`}
                        type="date"
                        style={css.input}
                        disabled={busy}
                        value={line.startDate}
                        onChange={(e) =>
                          updateLine(line.key, { startDate: e.target.value })
                        }
                      />
                    </td>
                    <td style={css.td}>
                      <input
                        aria-label={`Ngày kết thúc dòng ${index + 1}`}
                        type="date"
                        style={css.input}
                        disabled={busy}
                        value={line.endDate}
                        onChange={(e) =>
                          updateLine(line.key, { endDate: e.target.value })
                        }
                      />
                    </td>
                    <td style={css.td}>
                      <button
                        type="button"
                        style={css.secondary}
                        disabled={busy}
                        onClick={() =>
                          update(
                            "lines",
                            form.lines.filter((x) => x.key !== line.key).length
                              ? form.lines.filter((x) => x.key !== line.key)
                              : [blankLine()],
                          )
                        }
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
          Chọn mã hàng sẽ tự động mở dòng tiếp theo. Chỉ hiển thị mã hàng chưa
          thuộc chương trình nào và mã đã có trong chương trình đang sửa.
        </div>
      </section>
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 3,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          padding: "14px 16px",
          background: "#fff",
          border: "1px solid #dce5ef",
          boxShadow: "0 -3px 12px #dbe3ed",
        }}
      >
        <button
          type="button"
          style={css.secondary}
          disabled={busy}
          onClick={() => void refresh()}
        >
          Làm mới
        </button>
        <button
          type="button"
          style={{ ...css.primary, opacity: busy ? 0.55 : 1 }}
          disabled={busy || !form.saleAgreementName.trim()}
          onClick={() => void save()}
        >
          {busy ? "Đang xử lý..." : editingId == null ? "Lưu" : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
