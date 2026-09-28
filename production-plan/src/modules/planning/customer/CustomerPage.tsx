import { useEffect, useMemo, useState } from "react";

import type { CSSProperties } from "react";

import CustomerList from "./CustomerList";
import CustomerForm from "./CustomerForm";

import { useDataScopeData } from "../../../auth/useDataScope";

import { apiFetch } from "../../../api/apiClient";

// =========================================================
// CUSTOMER
// =========================================================

export type Customer = {
  id: number;
  factoryId: number;
  partyId: number;
  code: string;
  name: string;
  address: string;
  country: string;
  active: "ACTIVE" | "INACTIVE";
};

// =========================================================
// CUSTOMER BRAND
// Mapping với PRS_CUST_ACCOUNTS_TB
// =========================================================

export type CustomerBrand = {
  brandId: number;
  partyId: number;
  factoryId: number;
  brandName: string;
  active: "ACTIVE" | "INACTIVE";
};

// =========================================================
// CUSTOMER TAB
// =========================================================

type CustomerTab = {
  id: string;
  type: "LIST" | "DETAIL" | "NEW";
  customerId?: number;
  title: string;
};

// =========================================================
// PAGE
// =========================================================

function CustomerPage() {
  const { scope, filterData } = useDataScopeData();

  console.log("DATA SCOPE =", JSON.stringify(scope));

  // =======================================================
  // CUSTOMERS
  // =======================================================

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customerError, setCustomerError] = useState("");

  // =======================================================
  // LOAD CUSTOMERS
  // =======================================================

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomerError("");

        const response = await apiFetch("/api/customers");

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message ??
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        

        const data = await response.json();
        

        const mappedCustomers: Customer[] = data.map((item: any) => ({
          id: item.partyId,

          factoryId: item.factoryId,

          partyId: item.partyId,

          code: item.partyCode,

          name: item.partyName,

          address: item.address ?? "",

          country: item.countryCode ?? "",

          active: item.active ?? item.status ?? "ACTIVE",
        }));

        setCustomers(mappedCustomers);

        console.log("Customers từ API:", mappedCustomers);
      } catch (error) {
        console.error("Lỗi đọc khách hàng:", error);

        setCustomerError("Không thể đọc danh sách khách hàng từ API.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // =======================================================
  // DATA SCOPE
  // =======================================================

  const scopedCustomers = useMemo(
    () => filterData(customers),

    [customers, filterData],
  );

  // =======================================================
  // BRAND STATE
  // =======================================================

  const [brands, setBrands] = useState<CustomerBrand[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(false);

  const [brandError, setBrandError] = useState("");

  // =======================================================
  // BRAND FORM
  // =======================================================

  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);

  const [brandName, setBrandName] = useState("");

  const [brandStatus, setBrandStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE",
  );

  // =======================================================
  // TABS
  // =======================================================

  const [tabs, setTabs] = useState<CustomerTab[]>([
    {
      id: "customer-list",
      type: "LIST",
      title: "Danh sách khách hàng",
    },
  ]);

  const [activeTabId, setActiveTabId] = useState("customer-list");

  // =======================================================
  // DETAIL SUB TAB
  // =======================================================

  const [detailTab, setDetailTab] = useState<"INFO" | "BRAND">("INFO");

  // =======================================================
  // ACTIVE TAB
  // =======================================================

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // =======================================================
  // SELECTED CUSTOMER
  // =======================================================

  const selectedCustomer = activeTab?.customerId
    ? customers.find((customer) => customer.id === activeTab.customerId)
    : undefined;

  // =======================================================
  // RESET BRAND FORM
  // =======================================================

  const resetBrandForm = () => {
    setEditingBrandId(null);

    setBrandName("");

    setBrandStatus("ACTIVE");
  };

  // =======================================================
  // LOAD BRANDS
  // =======================================================

  useEffect(() => {
    if (!selectedCustomer) {
      setBrands([]);

      setBrandError("");

      resetBrandForm();

      return;
    }

    const partyId = selectedCustomer.partyId;

    const loadBrands = async () => {
      try {
        setLoadingBrands(true);

        setBrandError("");

        // Xóa danh sách cũ ngay khi đổi khách hàng
        setBrands([]);

        resetBrandForm();

        const response = await apiFetch(
          `/api/customer-accounts/party/${partyId}`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message ??
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();

        const mappedBrands: CustomerBrand[] = data.map((item: any) => ({
          brandId: item.custAccountId,

          partyId: item.partyId,

          factoryId: item.factoryId,

          brandName: item.accountName ?? "",

          active: item.active ?? "ACTIVE",
        }));

        setBrands(mappedBrands);

        console.log("Brands từ API:", mappedBrands);
      } catch (error) {
        console.error("LOAD CUSTOMER BRANDS ERROR:", error);

        setBrands([]);

        setBrandError(
          error instanceof Error
            ? error.message
            : "Không thể đọc danh sách thương hiệu.",
        );
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, [selectedCustomer?.partyId]);

  // =======================================================
  // SELECTED BRANDS
  // =======================================================

  const selectedBrands = selectedCustomer
    ? brands.filter(
        (brand) =>
          brand.partyId === selectedCustomer.partyId &&
          brand.factoryId === selectedCustomer.factoryId,
      )
    : [];

  // =======================================================
  // CLICK BRAND ROW
  //
  // Click một dòng thương hiệu
  // => fill dữ liệu lên form
  // =======================================================

  const handleSelectBrand = (brand: CustomerBrand) => {
    setEditingBrandId(brand.brandId);

    setBrandName(brand.brandName);

    setBrandStatus(brand.active);

    // Cuộn lên form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =======================================================
  // SELECT CUSTOMER
  // =======================================================

  const handleSelectCustomer = (customer: Customer) => {
    const tabId = `customer-${customer.id}`;

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
          customerId: customer.id,
          title: `${customer.name} - ${customer.code}`,
        },
      ];
    });

    setDetailTab("INFO");

    setActiveTabId(tabId);
  };

  // =======================================================
  // NEW CUSTOMER
  // =======================================================

  const handleNewCustomer = () => {
    const tabId = "customer-new";

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
          title: "Khách hàng mới",
        },
      ];
    });

    setDetailTab("INFO");

    setActiveTabId(tabId);
  };

  // =======================================================
  // CLOSE TAB
  // =======================================================

  const closeTab = (tabId: string) => {
    if (tabId === "customer-list") {
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
  // DELETE CUSTOMER
  // =======================================================

  const handleDelete = async (customerId: number) => {
    const customer = customers.find((item) => item.id === customerId);

    if (!customer) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khách hàng "${customer.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/customers/${customer.partyId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(errorData?.message ?? "Không thể xóa khách hàng.");

        return;
      }

      const data = await response.json();

      setCustomers((currentCustomers) =>
        currentCustomers.filter((item) => item.id !== customerId),
      );

      setBrands((currentBrands) =>
        currentBrands.filter(
          (brand) =>
            brand.partyId !== customer.partyId ||
            brand.factoryId !== customer.factoryId,
        ),
      );

      closeTab(`customer-${customerId}`);

      alert(data?.message ?? "Xóa khách hàng thành công.");
    } catch (error) {
      console.error("DELETE CUSTOMER ERROR:", error);

      alert("Không kết nối được API.");
    }
  };

  // =======================================================
  // SAVE CUSTOMER
  // =======================================================

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      const isNew = customer.id === 0;

      const url = isNew
        ? "/api/customers"
        : `/api/customers/${customer.partyId}`;

      const method = isNew ? "POST" : "PUT";

      const response = await apiFetch(url, {
        method,

        body: JSON.stringify({
          partyCode: customer.code,

          partyName: customer.name,

          countryCode: customer.country,

          address: customer.address,

          factoryId: customer.factoryId,

          active: customer.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("SAVE CUSTOMER ERROR:", errorText);

        alert(
          isNew
            ? "Không thể thêm khách hàng."
            : "Không thể cập nhật khách hàng.",
        );

        return;
      }

      const data = await response.json();

      const savedCustomer: Customer = {
        id: data.partyId,

        factoryId: data.factoryId,

        partyId: data.partyId,

        code: data.partyCode,

        name: data.partyName,

        address: data.address ?? "",

        country: data.countryCode ?? "",

        active: data.active ?? data.status ?? customer.active,
      };

      if (isNew) {
        setCustomers((currentCustomers) => [
          ...currentCustomers,
          savedCustomer,
        ]);

        const newTabId = "customer-new";

        const detailTabId = `customer-${savedCustomer.id}`;

        setTabs((currentTabs) =>
          currentTabs.map((tab) =>
            tab.id === newTabId
              ? {
                  id: detailTabId,

                  type: "DETAIL",

                  customerId: savedCustomer.id,

                  title: `${savedCustomer.name} - ${savedCustomer.code}`,
                }
              : tab,
          ),
        );

        setDetailTab("INFO");

        setActiveTabId(detailTabId);

        alert("Thêm khách hàng thành công.");

        return;
      }

      setCustomers((currentCustomers) =>
        currentCustomers.map((item) =>
          item.id === savedCustomer.id ? savedCustomer : item,
        ),
      );

      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.customerId === savedCustomer.id
            ? {
                ...tab,
                title: `${savedCustomer.name} - ${savedCustomer.code}`,
              }
            : tab,
        ),
      );

      alert("Cập nhật khách hàng thành công.");
    } catch (error) {
      console.error("SAVE CUSTOMER ERROR:", error);

      alert("Không kết nối được API.");
    }
  };

  // =======================================================
  // SAVE BRAND
  //
  // Nếu editingBrandId === null
  // => POST
  //
  // Nếu editingBrandId !== null
  // => PUT
  // =======================================================

  const handleSaveBrand = async () => {
    if (!selectedCustomer) {
      alert("Chưa chọn khách hàng.");

      return;
    }

    if (!brandName.trim()) {
      alert("Vui lòng nhập tên thương hiệu.");

      return;
    }

    const accountName = brandName.trim();

    const isEditing = editingBrandId !== null;

    try {
      // ==================================================
      // CREATE
      // ==================================================

      if (!isEditing) {
        const response = await apiFetch("/api/customer-accounts", {
          method: "POST",

          body: JSON.stringify({
            partyId: selectedCustomer.partyId,

            accountName: accountName,

            factoryId: selectedCustomer.factoryId,

            active: brandStatus,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          alert(errorData?.message ?? "Không thể thêm thương hiệu.");

          return;
        }

        const data = await response.json();

        const newBrand: CustomerBrand = {
          brandId: data.custAccountId,

          partyId: data.partyId,

          factoryId: data.factoryId,

          brandName: data.accountName ?? "",

          active: data.active ?? "ACTIVE",
        };

        setBrands((currentBrands) => [...currentBrands, newBrand]);

        resetBrandForm();

        alert("Thêm thương hiệu thành công.");

        return;
      }

      // ==================================================
      // UPDATE
      // ==================================================

      const response = await apiFetch(
        `/api/customer-accounts/${editingBrandId}`,
        {
          method: "PUT",

          body: JSON.stringify({
            accountName: accountName,

            active: brandStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(errorData?.message ?? "Không thể cập nhật thương hiệu.");

        return;
      }

      const data = await response.json();

      const updatedBrand: CustomerBrand = {
        brandId: data.custAccountId,

        partyId: data.partyId,

        factoryId: data.factoryId,

        brandName: data.accountName ?? "",

        active: data.active ?? brandStatus,
      };

      setBrands((currentBrands) =>
        currentBrands.map((brand) =>
          brand.brandId === updatedBrand.brandId ? updatedBrand : brand,
        ),
      );

      resetBrandForm();

      alert("Cập nhật thương hiệu thành công.");
    } catch (error) {
      console.error("SAVE BRAND ERROR:", error);

      alert("Không kết nối được API.");
    }
  };

  // =======================================================
  // DELETE BRAND
  // =======================================================

  const handleDeleteBrand = async (brand: CustomerBrand) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa thương hiệu "${brand.brandName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/customer-accounts/${brand.brandId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(errorData?.message ?? "Không thể xóa thương hiệu.");

        return;
      }

      const data = await response.json();

      // Xóa khỏi state
      setBrands((currentBrands) =>
        currentBrands.filter((item) => item.brandId !== brand.brandId),
      );

      // Nếu đang sửa dòng này
      // thì reset form
      if (editingBrandId === brand.brandId) {
        resetBrandForm();
      }

      alert(data?.message ?? "Xóa thương hiệu thành công.");
    } catch (error) {
      console.error("DELETE BRAND ERROR:", error);

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
      {/* ===================================================
          INTERNAL CUSTOMER TABS
      =================================================== */}

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

            {tab.id !== "customer-list" && (
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

      {/* ===================================================
          CUSTOMER LIST
      =================================================== */}

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
                Danh sách khách hàng
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
              onClick={handleNewCustomer}
              style={{
                padding: "9px 16px",

                border: "none",

                borderRadius: "6px",

                backgroundColor: "#2563eb",

                color: "#fff",

                cursor: "pointer",
              }}
            >
              + Thêm khách hàng
            </button>
          </div>

          {loadingCustomers && (
            <div
              style={{
                padding: "30px",

                textAlign: "center",

                backgroundColor: "#fff",

                borderRadius: "8px",
              }}
            >
              Đang tải danh sách khách hàng...
            </div>
          )}

          {!loadingCustomers && customerError && (
            <div
              style={{
                padding: "20px",

                backgroundColor: "#fee2e2",

                color: "#b91c1c",

                borderRadius: "8px",

                marginBottom: "16px",
              }}
            >
              {customerError}
            </div>
          )}

          {!loadingCustomers && !customerError && (
            <CustomerList
              customers={scopedCustomers}
              selectedId={activeTab?.customerId ?? null}
              onSelect={handleSelectCustomer}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* ===================================================
          NEW CUSTOMER
      =================================================== */}

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
              Thêm khách hàng
            </h2>
          </div>

          <CustomerForm
            customer={{
              id: 0,

              factoryId: scope.factoryId ?? 0,

              partyId: 0,

              code: "",

              name: "",

              address: "",

              country: "VN",

              active: "ACTIVE",
            }}
            onSave={handleSaveCustomer}
            onCancel={() => closeTab(activeTab.id)}
          />
        </div>
      )}

      {/* ===================================================
          CUSTOMER DETAIL
      =================================================== */}

      {activeTab?.type === "DETAIL" && selectedCustomer && (
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
            {selectedCustomer.name}

            {" - "}

            {selectedCustomer.code}
          </h2>

          {/* =================================================
              DETAIL SUB TABS
          ================================================= */}

          <div
            style={{
              display: "flex",

              gap: "2px",

              borderBottom: "1px solid #d1d5db",
            }}
          >
            <button
              type="button"
              onClick={() => setDetailTab("INFO")}
              style={{
                padding: "10px 20px",

                border: "1px solid #d1d5db",

                borderBottom:
                  detailTab === "INFO"
                    ? "1px solid #ffffff"
                    : "1px solid #d1d5db",

                backgroundColor: detailTab === "INFO" ? "#ffffff" : "#e5e7eb",

                borderRadius: "6px 6px 0 0",

                cursor: "pointer",

                fontWeight: detailTab === "INFO" ? 600 : 400,
              }}
            >
              Thông tin
            </button>

            <button
              type="button"
              onClick={() => setDetailTab("BRAND")}
              style={{
                padding: "10px 20px",

                border: "1px solid #d1d5db",

                borderBottom:
                  detailTab === "BRAND"
                    ? "1px solid #ffffff"
                    : "1px solid #d1d5db",

                backgroundColor: detailTab === "BRAND" ? "#ffffff" : "#e5e7eb",

                borderRadius: "6px 6px 0 0",

                cursor: "pointer",

                fontWeight: detailTab === "BRAND" ? 600 : 400,
              }}
            >
              Thương hiệu
            </button>
          </div>

          {/* =================================================
              INFO
          ================================================= */}

          {detailTab === "INFO" && (
            <div
              style={{
                backgroundColor: "#ffffff",

                border: "1px solid #d1d5db",

                borderTop: "none",
              }}
            >
              <CustomerForm
                customer={selectedCustomer}
                onSave={handleSaveCustomer}
                onCancel={() => closeTab(activeTab.id)}
              />
            </div>
          )}

          {/* =================================================
              BRAND
          ================================================= */}

          {detailTab === "BRAND" && (
            <div
              style={{
                backgroundColor: "#ffffff",

                border: "1px solid #d1d5db",

                borderTop: "none",

                padding: "20px",
              }}
            >
              {/* =============================================
                  BRAND FORM
              ============================================= */}

              <div
                style={{
                  padding: "16px",

                  backgroundColor: "#f9fafb",

                  border: "1px solid #e5e7eb",

                  borderRadius: "8px",

                  marginBottom: "20px",
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
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {editingBrandId !== null
                      ? "Chỉnh sửa thương hiệu"
                      : "Thêm thương hiệu"}
                  </h3>

                  {editingBrandId !== null && (
                    <span
                      style={{
                        color: "#6b7280",

                        fontSize: "14px",
                      }}
                    >
                      ID: {editingBrandId}
                    </span>
                  )}
                </div>

                {/* TÊN THƯƠNG HIỆU */}

                <div
                  style={{
                    marginBottom: "14px",
                  }}
                >
                  <label
                    style={{
                      display: "block",

                      marginBottom: "6px",

                      fontWeight: 500,
                    }}
                  >
                    Tên thương hiệu
                  </label>

                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    style={inputStyle}
                    placeholder="Nhập tên thương hiệu"
                  />
                </div>

                {/* TRẠNG THÁI */}

                <div
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  <label
                    style={{
                      display: "block",

                      marginBottom: "6px",

                      fontWeight: 500,
                    }}
                  >
                    Trạng thái
                  </label>

                  <select
                    value={brandStatus}
                    onChange={(e) =>
                      setBrandStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    style={selectStyle}
                  >
                    <option value="ACTIVE">Hoạt động</option>

                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>

                {/* BUTTONS */}

                <div
                  style={{
                    display: "flex",

                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSaveBrand}
                    style={{
                      padding: "8px 16px",

                      border: "none",

                      borderRadius: "6px",

                      backgroundColor:
                        editingBrandId !== null ? "#16a34a" : "#2563eb",

                      color: "#fff",

                      cursor: "pointer",
                    }}
                  >
                    {editingBrandId !== null ? "Lưu thay đổi" : "Thêm"}
                  </button>

                  <button
                    type="button"
                    onClick={resetBrandForm}
                    style={{
                      padding: "8px 16px",

                      border: "1px solid #d1d5db",

                      borderRadius: "6px",

                      backgroundColor: "#fff",

                      cursor: "pointer",
                    }}
                  >
                    {editingBrandId !== null ? "Hủy sửa" : "Làm mới"}
                  </button>
                </div>
              </div>

              {/* =============================================
                  BRAND LIST
              ============================================= */}

              <div>
                <div
                  style={{
                    display: "flex",

                    justifyContent: "space-between",

                    alignItems: "center",

                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    Danh sách thương hiệu
                  </h3>

                  <span
                    style={{
                      color: "#6b7280",

                      fontSize: "14px",
                    }}
                  >
                    Tổng: {selectedBrands.length}
                  </span>
                </div>

                {/* LOADING */}

                {loadingBrands && (
                  <div
                    style={{
                      padding: "30px",

                      textAlign: "center",

                      color: "#6b7280",
                    }}
                  >
                    Đang tải danh sách thương hiệu...
                  </div>
                )}

                {/* ERROR */}

                {!loadingBrands && brandError && (
                  <div
                    style={{
                      padding: "15px",

                      backgroundColor: "#fee2e2",

                      color: "#b91c1c",

                      borderRadius: "6px",

                      marginBottom: "15px",
                    }}
                  >
                    {brandError}
                  </div>
                )}

                {/* TABLE */}

                {!loadingBrands && !brandError && (
                  <table
                    style={{
                      width: "100%",

                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f3f4f6",
                        }}
                      >
                        <th style={tableHeaderStyle}>STT</th>

                        <th style={tableHeaderStyle}>CUST_ACCOUNT_ID</th>

                        <th style={tableHeaderStyle}>Tên thương hiệu</th>

                        <th style={tableHeaderStyle}>Trạng thái</th>

                        <th style={tableHeaderStyle}>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedBrands.map((brand, index) => (
                        <tr
                          key={brand.brandId}
                          onClick={() => handleSelectBrand(brand)}
                          style={{
                            cursor: "pointer",

                            backgroundColor:
                              editingBrandId === brand.brandId
                                ? "#eff6ff"
                                : "#ffffff",
                          }}
                        >
                          {/* STT */}

                          <td style={tableCellStyle}>{index + 1}</td>

                          {/* ID */}

                          <td style={tableCellStyle}>{brand.brandId}</td>

                          {/* NAME */}

                          <td style={tableCellStyle}>{brand.brandName}</td>

                          {/* STATUS */}

                          <td style={tableCellStyle}>
                            <span
                              style={{
                                display: "inline-block",

                                padding: "4px 8px",

                                borderRadius: "4px",

                                backgroundColor:
                                  brand.active === "ACTIVE"
                                    ? "#dcfce7"
                                    : "#fee2e2",

                                color:
                                  brand.active === "ACTIVE"
                                    ? "#166534"
                                    : "#991b1b",

                                fontSize: "13px",

                                fontWeight: 500,
                              }}
                            >
                              {brand.active === "ACTIVE"
                                ? "Hoạt động"
                                : "Ngừng hoạt động"}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td
                            style={tableCellStyle}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(brand)}
                              style={{
                                padding: "6px 12px",

                                border: "none",

                                borderRadius: "5px",

                                backgroundColor: "#dc2626",

                                color: "#ffffff",

                                cursor: "pointer",
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}

                      {selectedBrands.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              padding: "20px",

                              textAlign: "center",

                              color: "#6b7280",
                            }}
                          >
                            Chưa có thương hiệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const inputStyle: CSSProperties = {
  width: "100%",

  boxSizing: "border-box",

  padding: "9px 10px",

  marginTop: "6px",

  border: "1px solid #d1d5db",

  borderRadius: "6px",
};

const selectStyle: CSSProperties = {
  width: "250px",

  boxSizing: "border-box",

  padding: "9px 10px",

  border: "1px solid #d1d5db",

  borderRadius: "6px",

  backgroundColor: "#ffffff",

  cursor: "pointer",
};

const tableHeaderStyle: CSSProperties = {
  padding: "10px",

  border: "1px solid #d1d5db",

  textAlign: "left",
};

const tableCellStyle: CSSProperties = {
  padding: "10px",

  border: "1px solid #e5e7eb",
};

export default CustomerPage;
