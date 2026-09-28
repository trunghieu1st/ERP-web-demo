import { useEffect, useMemo, useState } from "react";

import SupplierList from "./SupplierList";
import SupplierForm from "./SupplierForm";

import { useDataScopeData } from "../../../auth/useDataScope";
import { apiFetch } from "../../../api/apiClient";

// =========================================================
// SUPPLIER
// =========================================================

export type Supplier = {
  id: number;

  factoryId: number;

  supplierId: number;

  code: string;

  name: string;

  countryCode: string;

  address: string;

  phoneNumber: string;

  email: string;

  active: "ACTIVE" | "INACTIVE";
};

// =========================================================
// SUPPLIER TAB
// =========================================================

type SupplierTab = {
  id: string;

  type: "LIST" | "DETAIL" | "NEW";

  supplierId?: number;

  title: string;
};

// =========================================================
// PAGE
// =========================================================

function SupplierPage() {
  const { scope, filterData } = useDataScopeData();

  console.log("SUPPLIER DATA SCOPE =", JSON.stringify(scope));

  // =======================================================
  // SUPPLIERS
  // =======================================================

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [supplierError, setSupplierError] = useState("");

  // =======================================================
  // LOAD SUPPLIERS
  // =======================================================

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoadingSuppliers(true);

        setSupplierError("");

        const response = await apiFetch("/api/suppliers");

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message ??
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();

        const mappedSuppliers: Supplier[] = data.map((item: any) => ({
          id: Number(item.supplierId ?? item.id),

          factoryId: Number(item.factoryId ?? 0),

          supplierId: Number(item.supplierId ?? item.id),

          code: item.supplierCode ?? "",

          name: item.supplierName ?? "",

          countryCode: item.countryCode ?? "",

          address: item.address ?? "",

          phoneNumber: item.phoneNumber ?? "",

          email: item.email ?? "",

          active:
            item.active ?? (item.isActive === false ? "INACTIVE" : "ACTIVE"),
        }));

        setSuppliers(mappedSuppliers);

        console.log("Suppliers từ API:", mappedSuppliers);
      } catch (error) {
        console.error("Lỗi đọc nhà cung cấp:", error);

        setSupplierError("Không thể đọc danh sách nhà cung cấp từ API.");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliers();
  }, []);

  // =======================================================
  // DATA SCOPE
  // =======================================================

  const scopedSuppliers = useMemo(
    () => filterData(suppliers),

    [suppliers, filterData],
  );

  // =======================================================
  // TABS
  // =======================================================

  const [tabs, setTabs] = useState<SupplierTab[]>([
    {
      id: "supplier-list",

      type: "LIST",

      title: "Danh sách nhà cung cấp",
    },
  ]);

  const [activeTabId, setActiveTabId] = useState("supplier-list");

  // =======================================================
  // ACTIVE TAB
  // =======================================================

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // =======================================================
  // SELECTED SUPPLIER
  // =======================================================

  const selectedSupplier = activeTab?.supplierId
    ? suppliers.find((supplier) => supplier.id === activeTab.supplierId)
    : undefined;

  // =======================================================
  // SELECT SUPPLIER
  // =======================================================

  const handleSelectSupplier = (supplier: Supplier) => {
    const tabId = `supplier-${supplier.id}`;

    setTabs((currentTabs) => {
      const exists = currentTabs.some((tab) => tab.id === tabId);

      if (exists) {
        return currentTabs;
      }

      return [
        ...currentTabs,

        {
          id: tabId,

          type: "DETAIL",

          supplierId: supplier.id,

          title: `${supplier.name} - ${supplier.code}`,
        },
      ];
    });

    setActiveTabId(tabId);
  };

  // =======================================================
  // NEW SUPPLIER
  // =======================================================

  const handleNewSupplier = () => {
    const tabId = "supplier-new";

    setTabs((currentTabs) => {
      const exists = currentTabs.some((tab) => tab.id === tabId);

      if (exists) {
        return currentTabs;
      }

      return [
        ...currentTabs,

        {
          id: tabId,

          type: "NEW",

          title: "Nhà cung cấp mới",
        },
      ];
    });

    setActiveTabId(tabId);
  };

  // =======================================================
  // CLOSE TAB
  // =======================================================

  const closeTab = (tabId: string) => {
    if (tabId === "supplier-list") {
      return;
    }

    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.id === tabId);

      const newTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (tabId === activeTabId) {
        const nextTab = newTabs[Math.max(0, index - 1)];

        if (nextTab) {
          setActiveTabId(nextTab.id);
        }
      }

      return newTabs;
    });
  };

  // =======================================================
  // DELETE SUPPLIER
  // =======================================================

  const handleDelete = async (supplierId: number) => {
    const supplier = suppliers.find((item) => item.id === supplierId);

    if (!supplier) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa nhà cung cấp "${supplier.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/suppliers/${supplier.supplierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(errorData?.message ?? "Không thể xóa nhà cung cấp.");

        return;
      }

      const data = await response.json();

      setSuppliers((currentSuppliers) =>
        currentSuppliers.filter((item) => item.id !== supplierId),
      );

      closeTab(`supplier-${supplierId}`);

      alert(data?.message ?? "Xóa nhà cung cấp thành công.");
    } catch (error) {
      console.error("DELETE SUPPLIER ERROR:", error);

      alert("Không kết nối được API.");
    }
  };

  // =======================================================
  // SAVE SUPPLIER
  // =======================================================

  const handleSaveSupplier = async (supplier: Supplier) => {
    try {
      const isNew = supplier.id === 0;

      const url = isNew
        ? "/api/suppliers"
        : `/api/suppliers/${supplier.supplierId}`;

      const method = isNew ? "POST" : "PUT";

      const response = await apiFetch(url, {
        method,

        body: JSON.stringify({
          supplierCode: supplier.code,

          supplierName: supplier.name,

          countryCode: supplier.countryCode,

          address: supplier.address,

          phoneNumber: supplier.phoneNumber,

          email: supplier.email,

          factoryId: supplier.factoryId,

          active: supplier.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("SAVE SUPPLIER ERROR:", errorText);

        alert(
          isNew
            ? "Không thể thêm nhà cung cấp."
            : "Không thể cập nhật nhà cung cấp.",
        );

        return;
      }

      const data = await response.json();

      const savedSupplier: Supplier = {
        id: Number(data.supplierId ?? data.id),

        factoryId: Number(data.factoryId ?? supplier.factoryId),

        supplierId: Number(data.supplierId ?? data.id),

        code: data.supplierCode ?? "",

        name: data.supplierName ?? "",

        countryCode: data.countryCode ?? "",

        address: data.address ?? "",

        phoneNumber: data.phoneNumber ?? "",

        email: data.email ?? "",

        active:
          data.active ??
          (data.isActive === false ? "INACTIVE" : supplier.active),
      };

      // ==================================================
      // CREATE
      // ==================================================

      if (isNew) {
        setSuppliers((currentSuppliers) => [
          ...currentSuppliers,
          savedSupplier,
        ]);

        const newTabId = "supplier-new";

        const detailTabId = `supplier-${savedSupplier.id}`;

        setTabs((currentTabs) =>
          currentTabs.map((tab) =>
            tab.id === newTabId
              ? {
                  id: detailTabId,

                  type: "DETAIL",

                  supplierId: savedSupplier.id,

                  title: `${savedSupplier.name} - ${savedSupplier.code}`,
                }
              : tab,
          ),
        );

        setActiveTabId(detailTabId);

        alert("Thêm nhà cung cấp thành công.");

        return;
      }

      // ==================================================
      // UPDATE
      // ==================================================

      setSuppliers((currentSuppliers) =>
        currentSuppliers.map((item) =>
          item.id === savedSupplier.id ? savedSupplier : item,
        ),
      );

      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.supplierId === savedSupplier.id
            ? {
                ...tab,

                title: `${savedSupplier.name} - ${savedSupplier.code}`,
              }
            : tab,
        ),
      );

      alert("Cập nhật nhà cung cấp thành công.");
    } catch (error) {
      console.error("SAVE SUPPLIER ERROR:", error);

      alert("Không kết nối được API.");
    }
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      style={{
        width: "100%",

        minHeight: "100vh",

        backgroundColor: "#f3f4f6",
      }}
    >
      {/* ==================================================
          INTERNAL SUPPLIER TABS
         ================================================== */}

      <div
        style={{
          display: "flex",

          alignItems: "center",

          gap: "2px",

          padding: "8px 12px 0 12px",

          backgroundColor: "#e5e7eb",

          borderBottom: "1px solid #d1d5db",

          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              display: "flex",

              alignItems: "center",

              gap: "8px",

              padding: "9px 12px",

              backgroundColor: activeTabId === tab.id ? "#ffffff" : "#d1d5db",

              border: "1px solid #d1d5db",

              borderBottom:
                activeTabId === tab.id
                  ? "1px solid #ffffff"
                  : "1px solid #d1d5db",

              borderRadius: "6px 6px 0 0",

              cursor: "pointer",

              whiteSpace: "nowrap",
            }}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span>{tab.title}</span>

            {tab.id !== "supplier-list" && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  closeTab(tab.id);
                }}
                style={{
                  border: "none",

                  background: "transparent",

                  cursor: "pointer",

                  fontSize: "16px",
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ==================================================
          SUPPLIER LIST
         ================================================== */}

      {activeTab?.type === "LIST" && (
        <div
          style={{
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                Danh sách nhà cung cấp
              </h2>

              <div
                style={{
                  marginTop: "5px",

                  color: "#6b7280",
                }}
              >
                Nhà máy: <strong>{scope.factoryName}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewSupplier}
              style={{
                padding: "9px 16px",

                border: "none",

                borderRadius: "6px",

                backgroundColor: "#2563eb",

                color: "#fff",

                cursor: "pointer",
              }}
            >
              + Thêm nhà cung cấp
            </button>
          </div>

          {/* LOADING */}

          {loadingSuppliers && (
            <div
              style={{
                padding: "30px",

                textAlign: "center",

                backgroundColor: "#fff",

                borderRadius: "8px",
              }}
            >
              Đang tải danh sách nhà cung cấp...
            </div>
          )}

          {/* ERROR */}

          {!loadingSuppliers && supplierError && (
            <div
              style={{
                padding: "20px",

                backgroundColor: "#fee2e2",

                color: "#b91c1c",

                borderRadius: "8px",

                marginBottom: "16px",
              }}
            >
              {supplierError}
            </div>
          )}

          {/* LIST */}

          {!loadingSuppliers && !supplierError && (
            <SupplierList
              suppliers={scopedSuppliers}
              selectedId={activeTab?.supplierId ?? null}
              onSelect={handleSelectSupplier}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* ==================================================
          NEW SUPPLIER
         ================================================== */}

      {activeTab?.type === "NEW" && (
        <div>
          <div
            style={{
              padding: "20px 24px 0 24px",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              Thêm nhà cung cấp
            </h2>
          </div>

          <SupplierForm
            supplier={{
              id: 0,

              factoryId: scope.factoryId ?? 0,

              supplierId: 0,

              code: "",

              name: "",

              countryCode: "VN",

              address: "",

              phoneNumber: "",

              email: "",

              active: "ACTIVE",
            }}
            onSave={handleSaveSupplier}
            onCancel={() => closeTab(activeTab.id)}
          />
        </div>
      )}

      {/* ==================================================
          SUPPLIER DETAIL
         ================================================== */}

      {activeTab?.type === "DETAIL" && selectedSupplier && (
        <div
          style={{
            padding: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,

              marginBottom: "16px",
            }}
          >
            {selectedSupplier.name}

            {" - "}

            {selectedSupplier.code}
          </h2>

          <div
            style={{
              backgroundColor: "#ffffff",

              border: "1px solid #d1d5db",

              borderRadius: "6px",
            }}
          >
            <SupplierForm
              supplier={selectedSupplier}
              onSave={handleSaveSupplier}
              onCancel={() => closeTab(activeTab.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierPage;
