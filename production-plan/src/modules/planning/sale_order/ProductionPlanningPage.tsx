import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { apiFetch } from "../../../api/apiClient";

const API = "/api/order-headers";

type Customer = {
  custAccountId: number;
  partyName: string | null;
  accountName: string;
};
type ShippingMethod = {
  shippingMethodCode: string;
  description: string | null;
};
type PaymentTerm = { paymentTermCode: string; description: string | null };
type Options = {
  customers: Customer[];
  shippingMethods: ShippingMethod[];
  paymentTerms: PaymentTerm[];
};
type Agreement = {
  headerId: number;
  saleAgreementName: string;
  priceListId: number | null;
  collectionHeaderId: number | null;
  transactionalCurrCode: string | null;
};
type AgreementDetail = {
  headerId: number;
  priceListId: number | null;
  priceListName: string | null;
  collectionHeaderId: number | null;
  collectionName: string | null;
  transactionalCurrCode: string | null;
};
type Form = {
  custAccountId: number | null;
  saleAgreementId: number | null;
  priceListName: string;
  collectionName: string;
  transactionalCurrCode: string;
  shippingMethodCode: string;
  paymentTermCode: string;
};

const blankForm = (): Form => ({
  custAccountId: null,
  saleAgreementId: null,
  priceListName: "",
  collectionName: "",
  transactionalCurrCode: "",
  shippingMethodCode: "",
  paymentTermCode: "",
});
const numberOrNull = (value: string) => (value ? Number(value) : null);
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Thao tác thất bại.";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.message || `API error ${response.status}`);
  return data as T;
}

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
  tabs: {
    display: "flex",
    gap: 6,
    marginBottom: 16,
    borderBottom: "1px solid #dce5ef",
  },
  tab: {
    border: 0,
    background: "transparent",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 650,
  },
  activeTab: { borderBottom: "3px solid #1463b8", color: "#1463b8" },
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
};

export default function ProductionPlanningPage() {
  const [activeTab, setActiveTab] = useState<"header" | "line">("header");
  const [options, setOptions] = useState<Options>({
    customers: [],
    shippingMethods: [],
    paymentTerms: [],
  });
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [form, setForm] = useState<Form>(blankForm);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOptions = useCallback(async () => {
    const data = await request<Options>(`${API}/options`);
    setOptions(data);
  }, []);

  useEffect(() => {
    void loadOptions().catch((e) => setError(message(e)));
  }, [loadOptions]);

  const selectCustomer = async (value: string) => {
    const custAccountId = numberOrNull(value);
    setForm((old) => ({
      ...old,
      custAccountId,
      saleAgreementId: null,
      priceListName: "",
      collectionName: "",
      transactionalCurrCode: "",
    }));
    setAgreements([]);
    setError("");
    setNotice("");
    if (custAccountId == null) return;
    setBusy(true);
    try {
      setAgreements(
        await request<Agreement[]>(
          `${API}/sales-agreements?custAccountId=${custAccountId}`,
        ),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const selectAgreement = async (value: string) => {
    const saleAgreementId = numberOrNull(value);
    setForm((old) => ({
      ...old,
      saleAgreementId,
      priceListName: "",
      collectionName: "",
      transactionalCurrCode: "",
    }));
    setError("");
    setNotice("");
    if (saleAgreementId == null) return;
    setBusy(true);
    try {
      const detail = await request<AgreementDetail>(
        `${API}/sales-agreements/${saleAgreementId}/detail`,
      );
      setForm((old) => ({
        ...old,
        saleAgreementId,
        priceListName: detail.priceListName ?? "",
        collectionName: detail.collectionName ?? "",
        transactionalCurrCode: detail.transactionalCurrCode ?? "",
      }));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const refresh = () => {
    setForm(blankForm());
    setAgreements([]);
    setOrderNumber(null);
    setError("");
    setNotice("");
    setActiveTab("header");
  };

  const save = async () => {
    if (form.custAccountId == null) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (form.saleAgreementId == null) {
      setError("Vui lòng chọn chương trình/mùa hàng.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request<{
        headerId: number;
        orderNumber: number;
        orderType: string;
        message: string;
      }>(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custAccountId: form.custAccountId,
          saleAgreementId: form.saleAgreementId,
          shippingMethodCode: form.shippingMethodCode,
          paymentTermCode: form.paymentTermCode,
        }),
      });
      setOrderNumber(result.orderNumber);
      setNotice(result.message);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={css.page}>
      <h1 style={{ margin: "0 0 16px", fontSize: 23 }}>
        Lập kế hoạch sản xuất
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

      <div style={css.tabs}>
        <button
          type="button"
          style={{
            ...css.tab,
            ...(activeTab === "header" ? css.activeTab : {}),
          }}
          onClick={() => setActiveTab("header")}
        >
          Header
        </button>
        <button
          type="button"
          style={{ ...css.tab, ...(activeTab === "line" ? css.activeTab : {}) }}
          onClick={() => setActiveTab("line")}
        >
          Line
        </button>
      </div>

      {activeTab === "header" ? (
        <section style={css.card}>
          <div style={css.grid}>
            <label style={css.field}>
              Số đơn hàng
              <input
                style={{ ...css.input, ...css.readonly }}
                readOnly
                value={orderNumber ?? "Tự sinh khi lưu"}
              />
            </label>
            <label style={css.field}>
              Loại đơn hàng
              <input
                style={{ ...css.input, ...css.readonly }}
                readOnly
                value="ORDER BREAKDOWN"
              />
            </label>
            <label style={css.field}>
              Khách hàng *
              <select
                style={css.input}
                disabled={busy || orderNumber != null}
                value={form.custAccountId ?? ""}
                onChange={(e) => void selectCustomer(e.target.value)}
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
              Chương trình/Mùa hàng *
              <select
                style={css.input}
                disabled={
                  busy || form.custAccountId == null || orderNumber != null
                }
                value={form.saleAgreementId ?? ""}
                onChange={(e) => void selectAgreement(e.target.value)}
              >
                <option value="">-- Chọn chương trình/mùa hàng --</option>
                {agreements.map((a) => (
                  <option key={a.headerId} value={a.headerId}>
                    {a.saleAgreementName}
                  </option>
                ))}
              </select>
            </label>
            <label style={css.field}>
              Bảng giá
              <input
                style={{ ...css.input, ...css.readonly }}
                readOnly
                value={form.priceListName}
              />
            </label>
            <label style={css.field}>
              Bảng tập hợp NPL
              <input
                style={{ ...css.input, ...css.readonly }}
                readOnly
                value={form.collectionName}
              />
            </label>
            <label style={css.field}>
              Đơn vị tiền tệ
              <input
                style={{ ...css.input, ...css.readonly }}
                readOnly
                value={form.transactionalCurrCode}
              />
            </label>
            <label style={css.field}>
              Phương thức vận chuyển
              <select
                style={css.input}
                disabled={busy || orderNumber != null}
                value={form.shippingMethodCode}
                onChange={(e) =>
                  setForm((old) => ({
                    ...old,
                    shippingMethodCode: e.target.value,
                  }))
                }
              >
                <option value="">-- Chọn phương thức vận chuyển --</option>
                {options.shippingMethods.map((x) => (
                  <option
                    key={x.shippingMethodCode}
                    value={x.shippingMethodCode}
                  >
                    {x.shippingMethodCode}
                    {x.description ? ` - ${x.description}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={css.field}>
              Phương thức thanh toán
              <select
                style={css.input}
                disabled={busy || orderNumber != null}
                value={form.paymentTermCode}
                onChange={(e) =>
                  setForm((old) => ({
                    ...old,
                    paymentTermCode: e.target.value,
                  }))
                }
              >
                <option value="">-- Chọn phương thức thanh toán --</option>
                {options.paymentTerms.map((x) => (
                  <option key={x.paymentTermCode} value={x.paymentTermCode}>
                    {x.paymentTermCode}
                    {x.description ? ` - ${x.description}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : (
        <section style={css.card}>
          <strong>Line</strong>
          <div style={{ marginTop: 12, color: "#64748b" }}>
            Chưa triển khai — chờ mô tả nghiệp vụ Line.
          </div>
        </section>
      )}

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
          onClick={refresh}
        >
          Làm mới
        </button>
        <button
          type="button"
          style={{
            ...css.primary,
            opacity: busy || orderNumber != null ? 0.55 : 1,
          }}
          disabled={busy || orderNumber != null}
          onClick={() => void save()}
        >
          {busy ? "Đang xử lý..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}
