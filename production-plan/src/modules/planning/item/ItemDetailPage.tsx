import {

  useCallback,

  useEffect,

  useState,

} from "react";

import type { CSSProperties } from "react";


import { apiFetch } from "../../../api/apiClient";



type DetailTab = "COLOR" | "SIZE" | "DETAIL_ITEMS";

interface ItemDetailPageProps {
  itemId: number;
  itemCode?: string;
  description?: string;
  onClose?: () => void;
}




interface ItemInfo {

  inventoryItemId: number;

  itemCode: string;

  description: string;

}



interface ItemColor {

  headerColorId: number;

  colorId: number;

  colorCode: string;

  colorName: string | null;

  colorDesc: string | null;

  active: boolean;

  description: string | null;

  remark: string | null;

  soCutting: number | null;

  attribute1: string | null;

  attribute2: string | null;

  usedInBomStyle: boolean;

}



interface AvailableColor {

  colorId: number;

  colorCode: string;

  colorName: string | null;

  colorDesc: string | null;

}



interface ItemSize {

  headerSizeId: number;

  sizeId: number;

  mtlSizeCode: string;

  mtlSizeValue: number;

  mtlSizeDesc: string | null;

  active: boolean;

  description: string | null;

  remark: string | null;

  usedInBomStyle: boolean;

}



interface AvailableSize {

  sizeId: number;

  mtlSizeCode: string;

  mtlSizeValue: number;

  mtlSizeDesc: string | null;

}



interface ItemColorsResponse {

  item: ItemInfo;

  colors: ItemColor[];

}



interface ItemSizesResponse {

  item: ItemInfo;

  sizes: ItemSize[];

}



interface DetailFinishedItem {

  inventoryItemId: number;

  itemCode: string;

  colorCode: string | null;

  colorName: string | null;

  mtlSizeCode: string | null;

}



interface DetailFinishedItemsResponse {

  item: ItemInfo;

  detailItems: DetailFinishedItem[];

}



async function getErrorMessage(

  response: Response,

  fallback: string,

) {

  try {

    const data = await response.json();



    if (

      data &&

      typeof data.message === "string"

    ) {

      return data.message;

    }

  } catch {

    // Không có JSON body.

  }



  return fallback;

}



function ItemDetailPage({
  itemId,
  itemCode = "",
  description = "",
  onClose,
}: ItemDetailPageProps) {



  const [activeTab, setActiveTab] =

    useState<DetailTab>("COLOR");



  const [item, setItem] =

    useState<ItemInfo | null>({
      inventoryItemId: itemId,
      itemCode,
      description,
    });



  const [loading, setLoading] =

    useState(false);



  const [message, setMessage] =

    useState("");



  const [error, setError] =

    useState("");



  // ==========================================================

  // COLOR

  // ==========================================================



  const [colors, setColors] =

    useState<ItemColor[]>([]);



  const [colorCode, setColorCode] =

    useState("");



  const [colorName, setColorName] =

    useState("");



  const [colorDesc, setColorDesc] =

    useState("");



  const [savingColor, setSavingColor] =

    useState(false);



  const [savingColorAttributes, setSavingColorAttributes] =

    useState(false);



  const [showColorModal, setShowColorModal] =

    useState(false);



  const [availableColors, setAvailableColors] =

    useState<AvailableColor[]>([]);



  const [selectedColorIds, setSelectedColorIds] =

    useState<number[]>([]);



  const [colorSearch, setColorSearch] =

    useState("");



  const [loadingAvailableColors, setLoadingAvailableColors] =

    useState(false);



  // ==========================================================

  // SIZE

  // ==========================================================



  const [sizes, setSizes] =

    useState<ItemSize[]>([]);



  const [sizeCode, setSizeCode] =

    useState("");



  const [sizeValue, setSizeValue] =

    useState("");



  const [sizeDesc, setSizeDesc] =

    useState("");



  const [savingSize, setSavingSize] =

    useState(false);



  const [showSizeModal, setShowSizeModal] =

    useState(false);



  const [availableSizes, setAvailableSizes] =

    useState<AvailableSize[]>([]);



  const [selectedSizeIds, setSelectedSizeIds] =

    useState<number[]>([]);



  const [sizeSearch, setSizeSearch] =

    useState("");



  const [loadingAvailableSizes, setLoadingAvailableSizes] =

    useState(false);



  // ==========================================================

  // DETAIL ITEMS / BOM STYLE

  // ==========================================================

  const [detailItems, setDetailItems] =

    useState<DetailFinishedItem[]>([]);

  const [loadingDetailItems, setLoadingDetailItems] =

    useState(false);

  const [creatingBomStyle, setCreatingBomStyle] =

    useState(false);



  // ==========================================================

  // MESSAGE

  // ==========================================================



  const clearMessages = () => {

    setMessage("");

    setError("");

  };



  const showSuccess = (text: string) => {

    setError("");

    setMessage(text);

  };



  const showError = (text: string) => {

    setMessage("");

    setError(text);

  };



  // ==========================================================

  // LOAD COLOR OF ITEM

  // ==========================================================



  const loadItemColors = useCallback(async () => {

    if (!Number.isFinite(itemId) || itemId <= 0) {

      return;

    }



    try {

      setLoading(true);



      const response = await apiFetch(

        `/api/item-details/${itemId}/colors`,

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không tải được danh sách màu.",

          ),

        );

      }



      const data =

        (await response.json()) as ItemColorsResponse;



      setItem(data.item);

      setColors(data.colors ?? []);

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không tải được danh sách màu.",

      );

    } finally {

      setLoading(false);

    }

  }, [itemId]);



  // ==========================================================

  // LOAD SIZE OF ITEM

  // ==========================================================



  const loadItemSizes = useCallback(async () => {

    if (!Number.isFinite(itemId) || itemId <= 0) {

      return;

    }



    try {

      setLoading(true);



      const response = await apiFetch(

        `/api/item-details/${itemId}/sizes`,

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không tải được danh sách cỡ.",

          ),

        );

      }



      const data =

        (await response.json()) as ItemSizesResponse;



      setItem(data.item);

      setSizes(data.sizes ?? []);

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không tải được danh sách cỡ.",

      );

    } finally {

      setLoading(false);

    }

  }, [itemId]);



  // ==========================================================

  // LOAD DETAIL FINISHED GOODS

  // ==========================================================

  const loadDetailItems = useCallback(async () => {

    if (!Number.isFinite(itemId) || itemId <= 0) {

      return;

    }

    try {

      setLoadingDetailItems(true);

      const response = await apiFetch(

        `/api/item-details/${itemId}/detail-items`,

      );

      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không tải được mã hàng chi tiết.",

          ),

        );

      }

      const data =

        (await response.json()) as DetailFinishedItemsResponse;

      setItem(data.item);

      setDetailItems(data.detailItems ?? []);

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không tải được mã hàng chi tiết.",

      );

    } finally {

      setLoadingDetailItems(false);

    }

  }, [itemId]);



  // ==========================================================

  // INITIAL LOAD

  // ==========================================================



  useEffect(() => {

    clearMessages();



    if (!Number.isFinite(itemId) || itemId <= 0) {

      showError("ID mã hàng không hợp lệ.");

      return;

    }



    if (activeTab === "COLOR") {

      void loadItemColors();

    } else if (activeTab === "SIZE") {

      void loadItemSizes();

    } else {

      void loadDetailItems();

    }

  }, [

    activeTab,

    itemId,

    loadItemColors,

    loadItemSizes,

    loadDetailItems,

  ]);



  // ==========================================================

  // CREATE COLOR MASTER

  // ==========================================================



  const handleCreateColor = async () => {

    clearMessages();



    const normalizedCode =

      colorCode.trim().toUpperCase();



    if (!normalizedCode) {

      showError("Vui lòng nhập mã màu.");

      return;

    }

    const normalizedName = colorName.trim();

    if (!normalizedName) {

      showError("Vui lòng nhập tên màu.");

      return;

    }



    try {

      setSavingColor(true);



      const response = await apiFetch(

        "/api/item-details/colors",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            colorCode: normalizedCode,

            colorName: normalizedName,

            colorDesc: colorDesc.trim() || null,

          }),

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể tạo mã màu.",

          ),

        );

      }



      setColorCode("");

      setColorName("");

      setColorDesc("");



      showSuccess(

        `Đã tạo mã màu ${normalizedCode}.`,

      );

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể tạo mã màu.",

      );

    } finally {

      setSavingColor(false);

    }

  };



  // ==========================================================

  // CREATE SIZE MASTER

  // ==========================================================



  const handleCreateSize = async () => {

    clearMessages();



    const normalizedCode =

      sizeCode.trim().toUpperCase();



    if (!normalizedCode) {

      showError("Vui lòng nhập mã cỡ.");

      return;

    }



    if (!sizeValue.trim()) {

      showError("Vui lòng nhập giá trị cỡ.");

      return;

    }



    const parsedValue = Number(sizeValue);



    if (!Number.isFinite(parsedValue)) {

      showError("Giá trị cỡ không hợp lệ.");

      return;

    }



    try {

      setSavingSize(true);



      const response = await apiFetch(

        "/api/item-details/sizes",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            mtlSizeCode: normalizedCode,

            mtlSizeValue: parsedValue,

            mtlSizeDesc:

              sizeDesc.trim() || null,

          }),

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể tạo mã cỡ.",

          ),

        );

      }



      setSizeCode("");

      setSizeValue("");

      setSizeDesc("");



      showSuccess(

        `Đã tạo mã cỡ ${normalizedCode}.`,

      );

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể tạo mã cỡ.",

      );

    } finally {

      setSavingSize(false);

    }

  };



  // ==========================================================

  // AVAILABLE COLORS

  // ==========================================================



  const loadAvailableColors =

    useCallback(async () => {

      if (!Number.isFinite(itemId) || itemId <= 0) {

        return;

      }



      try {

        setLoadingAvailableColors(true);



        const query = colorSearch.trim()

          ? `?keyword=${encodeURIComponent(

              colorSearch.trim(),

            )}`

          : "";



        const response = await apiFetch(

          `/api/item-details/${itemId}/colors/available${query}`,

        );



        if (!response.ok) {

          throw new Error(

            await getErrorMessage(

              response,

              "Không tải được danh sách màu.",

            ),

          );

        }



        const data =

          (await response.json()) as AvailableColor[];



        setAvailableColors(data ?? []);

      } catch (err) {

        showError(

          err instanceof Error

            ? err.message

            : "Không tải được danh sách màu.",

        );

      } finally {

        setLoadingAvailableColors(false);

      }

    }, [itemId, colorSearch]);



  useEffect(() => {

    if (!showColorModal) {

      return;

    }



    const timer = window.setTimeout(() => {

      void loadAvailableColors();

    }, 300);



    return () => {

      window.clearTimeout(timer);

    };

  }, [

    showColorModal,

    colorSearch,

    loadAvailableColors,

  ]);



  const openColorModal = () => {

    clearMessages();

    setColorSearch("");

    setSelectedColorIds([]);

    setAvailableColors([]);

    setShowColorModal(true);

  };



  const toggleColor = (colorId: number) => {

    setSelectedColorIds((current) => {

      if (current.includes(colorId)) {

        return current.filter(

          (idValue) => idValue !== colorId,

        );

      }



      return [...current, colorId];

    });

  };



  const handleAssignColors = async () => {

    clearMessages();



    if (selectedColorIds.length === 0) {

      showError(

        "Vui lòng chọn ít nhất một màu.",

      );

      return;

    }



    try {

      const response = await apiFetch(

        `/api/item-details/${itemId}/colors/assign`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            colorIds: selectedColorIds,

          }),

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể thêm màu vào mã hàng.",

          ),

        );

      }



      setShowColorModal(false);

      setSelectedColorIds([]);

      setColorSearch("");



      showSuccess(

        "Đã thêm màu vào mã hàng.",

      );



      await loadItemColors();

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể thêm màu vào mã hàng.",

      );

    }

  };



  // ==========================================================

  // UPDATE COLOR ATTRIBUTES

  // ==========================================================



  const handleColorAttributeChange = (

    colorId: number,

    field: "attribute1" | "attribute2",

    value: string | null,

  ) => {

    setColors((current) =>

      current.map((color) =>

        color.colorId === colorId

          ? { ...color, [field]: value }

          : color,

      ),

    );

  };



  const handleSaveColorAttributes = async () => {

    clearMessages();



    try {

      setSavingColorAttributes(true);



      const response = await apiFetch(

        `/api/item-details/${itemId}/colors/attributes`,

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            colors: colors.map((color) => ({

              colorId: color.colorId,

              attribute1: color.attribute1 || null,

              attribute2:

                color.attribute2 === "Y" ? "Y" : null,

            })),

          }),

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể lưu thông tin màu.",

          ),

        );

      }



      showSuccess("Đã lưu thông tin màu.");

      await loadItemColors();

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể lưu thông tin màu.",

      );

    } finally {

      setSavingColorAttributes(false);

    }

  };



  // ==========================================================

  // REMOVE COLOR

  // ==========================================================



  const handleRemoveColor = async (

    color: ItemColor,

  ) => {

    const confirmed = window.confirm(

      `Xóa màu "${color.colorCode}" khỏi mã hàng?\n\nMaster màu sẽ không bị xóa.`,

    );



    if (!confirmed) {

      return;

    }



    clearMessages();



    try {

      const response = await apiFetch(

        `/api/item-details/${itemId}/colors/${color.colorId}`,

        {

          method: "DELETE",

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể xóa màu khỏi mã hàng.",

          ),

        );

      }



      showSuccess(

        `Đã xóa màu ${color.colorCode} khỏi mã hàng.`,

      );



      await loadItemColors();

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể xóa màu khỏi mã hàng.",

      );

    }

  };



  // ==========================================================

  // AVAILABLE SIZES

  // ==========================================================



  const loadAvailableSizes =

    useCallback(async () => {

      if (!Number.isFinite(itemId) || itemId <= 0) {

        return;

      }



      try {

        setLoadingAvailableSizes(true);



        const query = sizeSearch.trim()

          ? `?keyword=${encodeURIComponent(

              sizeSearch.trim(),

            )}`

          : "";



        const response = await apiFetch(

          `/api/item-details/${itemId}/sizes/available${query}`,

        );



        if (!response.ok) {

          throw new Error(

            await getErrorMessage(

              response,

              "Không tải được danh sách cỡ.",

            ),

          );

        }



        const data =

          (await response.json()) as AvailableSize[];



        setAvailableSizes(data ?? []);

      } catch (err) {

        showError(

          err instanceof Error

            ? err.message

            : "Không tải được danh sách cỡ.",

        );

      } finally {

        setLoadingAvailableSizes(false);

      }

    }, [itemId, sizeSearch]);



  useEffect(() => {

    if (!showSizeModal) {

      return;

    }



    const timer = window.setTimeout(() => {

      void loadAvailableSizes();

    }, 300);



    return () => {

      window.clearTimeout(timer);

    };

  }, [

    showSizeModal,

    sizeSearch,

    loadAvailableSizes,

  ]);



  const openSizeModal = () => {

    clearMessages();

    setSizeSearch("");

    setSelectedSizeIds([]);

    setAvailableSizes([]);

    setShowSizeModal(true);

  };



  const toggleSize = (sizeId: number) => {

    setSelectedSizeIds((current) => {

      if (current.includes(sizeId)) {

        return current.filter(

          (idValue) => idValue !== sizeId,

        );

      }



      return [...current, sizeId];

    });

  };



  const handleAssignSizes = async () => {

    clearMessages();



    if (selectedSizeIds.length === 0) {

      showError(

        "Vui lòng chọn ít nhất một cỡ.",

      );

      return;

    }



    try {

      const response = await apiFetch(

        `/api/item-details/${itemId}/sizes/assign`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            sizeIds: selectedSizeIds,

          }),

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể thêm cỡ vào mã hàng.",

          ),

        );

      }



      setShowSizeModal(false);

      setSelectedSizeIds([]);

      setSizeSearch("");



      showSuccess(

        "Đã thêm cỡ vào mã hàng.",

      );



      await loadItemSizes();

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể thêm cỡ vào mã hàng.",

      );

    }

  };



  // ==========================================================

  // REMOVE SIZE

  // ==========================================================



  const handleRemoveSize = async (

    size: ItemSize,

  ) => {

    const confirmed = window.confirm(

      `Xóa cỡ "${size.mtlSizeCode}" khỏi mã hàng?\n\nMaster cỡ sẽ không bị xóa.`,

    );



    if (!confirmed) {

      return;

    }



    clearMessages();



    try {

      const response = await apiFetch(

        `/api/item-details/${itemId}/sizes/${size.sizeId}`,

        {

          method: "DELETE",

        },

      );



      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể xóa cỡ khỏi mã hàng.",

          ),

        );

      }



      showSuccess(

        `Đã xóa cỡ ${size.mtlSizeCode} khỏi mã hàng.`,

      );



      await loadItemSizes();

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể xóa cỡ khỏi mã hàng.",

      );

    }

  };



  // ==========================================================

  // BOM STYLE

  // ==========================================================

  const handleBomStyle = async () => {

    clearMessages();

    try {

      setCreatingBomStyle(true);

      const response = await apiFetch(

        `/api/item-details/${itemId}/bom-style`,

        { method: "POST" },

      );

      if (!response.ok) {

        throw new Error(

          await getErrorMessage(

            response,

            "Không thể tạo BOM STYLE.",

          ),

        );

      }

      const data = await response.json().catch(() => null);

      showSuccess(data?.message || "Đã xử lý BOM STYLE.");

      await Promise.all([

        loadDetailItems(),

        loadItemColors(),

        loadItemSizes(),

      ]);

    } catch (err) {

      showError(

        err instanceof Error

          ? err.message

          : "Không thể tạo BOM STYLE.",

      );

    } finally {

      setCreatingBomStyle(false);

    }

  };



  // ==========================================================

  // INVALID ID

  // ==========================================================



  if (!Number.isFinite(itemId) || itemId <= 0) {

    return (

      <div style={styles.page}>

        <div style={styles.invalidCard}>

          ID mã hàng không hợp lệ.



          <button

            type="button"

            style={styles.primaryButton}

            onClick={() => onClose?.()}

          >

            Quay lại

          </button>

        </div>

      </div>

    );

  }



  // ==========================================================

  // RENDER

  // ==========================================================



  return (

    <div style={styles.page}>

      {/* HEADER */}



      <div style={styles.pageHeader}>

        <div style={styles.headerLeft}>

          <button

            type="button"

            style={styles.backButton}

            onClick={() => onClose?.()}

          >

            ←

          </button>



          <div>

            <h1 style={styles.title}>

              Chi tiết mã hàng

            </h1>



            <div style={styles.subtitle}>

              Quản lý màu và cỡ của mã hàng

            </div>

          </div>

        </div>



        <div style={styles.itemHeaderInfo}>

          <span style={styles.itemCodeBadge}>

            {item?.itemCode ?? "..."}

          </span>



          <span style={styles.itemDescription}>

            {item?.description || ""}

          </span>

        </div>

      </div>



      {/* MESSAGE */}



      {message && (

        <div style={styles.successMessage}>

          {message}

        </div>

      )}



      {error && (

        <div style={styles.errorMessage}>

          {error}

        </div>

      )}



      {/* MAIN CARD */}



      <div style={styles.mainCard}>

        {/* TABS */}



        <div style={styles.tabs}>

          <button

            type="button"

            style={{

              ...styles.tabButton,

              ...(activeTab === "COLOR"

                ? styles.activeTab

                : {}),

            }}

            onClick={() =>

              setActiveTab("COLOR")

            }

          >

            Màu

          </button>



          <button

            type="button"

            style={{

              ...styles.tabButton,

              ...(activeTab === "SIZE"

                ? styles.activeTab

                : {}),

            }}

            onClick={() =>

              setActiveTab("SIZE")

            }

          >

            Cỡ

          </button>




          <button

            type="button"

            style={{

              ...styles.tabButton,

              ...(activeTab === "DETAIL_ITEMS"

                ? styles.activeTab

                : {}),

            }}

            onClick={() =>

              setActiveTab("DETAIL_ITEMS")

            }

          >

            Mã hàng chi tiết

          </button>

        </div>



        {/* ====================================================

            COLOR TAB

        ===================================================== */}



        {activeTab === "COLOR" && (

          <div style={styles.tabContent}>

            {/* TOP */}



            <section style={styles.topSection}>

              <div style={styles.sectionHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>

                    Khai báo code màu mới

                  </h2>



                  <div

                    style={

                      styles.sectionDescription

                    }

                  >

                    Tạo master màu mới cho nhà máy

                    hiện tại.

                  </div>

                </div>

              </div>



              <div style={styles.formGrid}>

                <div style={styles.field}>

                  <label style={styles.label}>

                    Mã màu \*

                  </label>



                  <input

                    value={colorCode}

                    style={styles.input}

                    placeholder="VD: BLK"

                    maxLength={15}

                    onChange={(event) =>

                      setColorCode(

                        event.target.value.toUpperCase(),

                      )

                    }

                  />

                </div>



                <div style={styles.field}>

                  <label style={styles.label}>

                    Tên màu <span style={styles.required}>*</span>

                  </label>



                  <input

                    value={colorName}

                    style={styles.input}

                    placeholder="VD: Black"

                    maxLength={255}

                    onChange={(event) =>

                      setColorName(

                        event.target.value,

                      )

                    }

                  />

                </div>



                <div style={styles.fieldWide}>

                  <label style={styles.label}>

                    Mô tả

                  </label>



                  <input

                    value={colorDesc}

                    style={styles.input}

                    placeholder="Nhập mô tả màu"

                    maxLength={255}

                    onChange={(event) =>

                      setColorDesc(

                        event.target.value,

                      )

                    }

                  />

                </div>

              </div>



              <div style={styles.formActions}>

                <button

                  type="button"

                  style={styles.secondaryButton}

                  onClick={() => {

                    setColorCode("");

                    setColorName("");

                    setColorDesc("");

                    clearMessages();

                  }}

                >

                  Làm mới

                </button>



                <button

                  type="button"

                  style={{

                    ...styles.primaryButton,

                    ...(savingColor

                      ? styles.disabledButton

                      : {}),

                  }}

                  disabled={savingColor}

                  onClick={() =>

                    void handleCreateColor()

                  }

                >

                  {savingColor

                    ? "Đang lưu..."

                    : "Lưu màu"}

                </button>

              </div>

            </section>



            {/* BOTTOM */}



            <section style={styles.bottomSection}>

              <div style={styles.listHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>

                    Màu đã khai báo cho mã hàng

                  </h2>



                  <div

                    style={

                      styles.sectionDescription

                    }

                  >

                    {item?.itemCode

                      ? `Mã hàng: ${item.itemCode}`

                      : "Danh sách màu của mã hàng"}

                  </div>

                </div>



                <div style={{ display: "flex", gap: "8px" }}>

                  <button

                    type="button"

                    style={{

                      ...styles.primaryButton,

                      ...(savingColorAttributes

                        ? styles.disabledButton

                        : {}),

                    }}

                    disabled={savingColorAttributes}

                    onClick={() =>

                      void handleSaveColorAttributes()

                    }

                  >

                    {savingColorAttributes

                      ? "Đang lưu..."

                      : "Lưu"}

                  </button>



                  <button

                    type="button"

                    style={styles.primaryButton}

                    onClick={openColorModal}

                  >

                    + Thêm màu cho mã hàng

                  </button>

                </div>

              </div>



              <div style={styles.tableContainer}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>

                        Mã màu

                      </th>



                      <th style={styles.th}>

                        Tên màu

                      </th>



                      <th style={styles.th}>

                        Mô tả

                      </th>



                      <th style={styles.th}>

                        Tác nghiệp cắt

                      </th>



                      <th style={styles.th}>

                        Nhóm thành phẩm

                      </th>



                      <th style={styles.th}>

                        Trạng thái

                      </th>



                      <th

                        style={{

                          ...styles.th,

                          width: "150px",

                        }}

                      >

                        Thao tác

                      </th>

                    </tr>

                  </thead>



                  <tbody>

                    {loading ? (

                      <tr>

                        <td

                          colSpan={7}

                          style={styles.empty}

                        >

                          Đang tải...

                        </td>

                      </tr>

                    ) : colors.length === 0 ? (

                      <tr>

                        <td

                          colSpan={7}

                          style={styles.empty}

                        >

                          Mã hàng chưa được khai

                          báo màu.

                        </td>

                      </tr>

                    ) : (

                      colors.map((color) => (

                        <tr

                          key={

                            color.headerColorId

                          }

                        >

                          <td style={styles.td}>

                            <strong>

                              {color.colorCode}

                            </strong>

                          </td>



                          <td style={styles.td}>

                            {color.colorName ||

                              "-"}

                          </td>



                          <td style={styles.td}>

                            {color.colorDesc ||

                              "-"}

                          </td>



                          <td style={styles.td}>

                            <select

                              value={color.attribute1 || ""}

                              style={styles.input}

                              onChange={(event) =>

                                handleColorAttributeChange(

                                  color.colorId,

                                  "attribute1",

                                  event.target.value || null,

                                )

                              }

                            >

                              <option value="">-- Chọn --</option>

                              <option value="TACH">TACH</option>

                              <option value="GOP">GOP</option>

                            </select>

                          </td>



                          <td style={styles.td}>

                            <input

                              type="checkbox"

                              checked={color.attribute2 === "Y"}

                              onChange={(event) =>

                                handleColorAttributeChange(

                                  color.colorId,

                                  "attribute2",

                                  event.target.checked ? "Y" : null,

                                )

                              }

                            />

                          </td>



                          <td style={styles.td}>

                            <span

                              style={

                                color.active

                                  ? styles.activeBadge

                                  : styles.inactiveBadge

                              }

                            >

                              {color.active

                                ? "Hoạt động"

                                : "Ngừng"}

                            </span>

                          </td>



                          <td style={styles.td}>

                            <button

                              type="button"

                              style={{

                                ...styles.removeButton,

                                ...(color.usedInBomStyle

                                  ? styles.disabledButton

                                  : {}),

                              }}

                              disabled={color.usedInBomStyle}

                              title={color.usedInBomStyle

                                ? "Màu đã được tạo BOM STYLE nên không thể xóa."

                                : undefined}

                              onClick={() =>

                                void handleRemoveColor(

                                  color,

                                )

                              }

                            >

                              Xóa khỏi mã

                            </button>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        )}



        {/* ====================================================

            SIZE TAB

        ===================================================== */}



        {activeTab === "SIZE" && (

          <div style={styles.tabContent}>

            {/* TOP */}



            <section style={styles.topSection}>

              <div style={styles.sectionHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>

                    Khai báo code cỡ mới

                  </h2>



                  <div

                    style={

                      styles.sectionDescription

                    }

                  >

                    Tạo master cỡ mới cho nhà máy

                    hiện tại.

                  </div>

                </div>

              </div>



              <div style={styles.formGrid}>

                <div style={styles.field}>

                  <label style={styles.label}>

                    Mã cỡ \*

                  </label>



                  <input

                    value={sizeCode}

                    style={styles.input}

                    placeholder="VD: SIZE-38"

                    maxLength={50}

                    onChange={(event) =>

                      setSizeCode(

                        event.target.value.toUpperCase(),

                      )

                    }

                  />

                </div>



                <div style={styles.field}>

                  <label style={styles.label}>

                    Giá trị cỡ \*

                  </label>



                  <input

                    value={sizeValue}

                    style={styles.input}

                    type="number"

                    step="0.0001"

                    placeholder="VD: 38"

                    onChange={(event) =>

                      setSizeValue(

                        event.target.value,

                      )

                    }

                  />

                </div>



                <div style={styles.fieldWide}>

                  <label style={styles.label}>

                    Mô tả

                  </label>



                  <input

                    value={sizeDesc}

                    style={styles.input}

                    placeholder="Nhập mô tả cỡ"

                    maxLength={250}

                    onChange={(event) =>

                      setSizeDesc(

                        event.target.value,

                      )

                    }

                  />

                </div>

              </div>



              <div style={styles.formActions}>

                <button

                  type="button"

                  style={styles.secondaryButton}

                  onClick={() => {

                    setSizeCode("");

                    setSizeValue("");

                    setSizeDesc("");

                    clearMessages();

                  }}

                >

                  Làm mới

                </button>



                <button

                  type="button"

                  style={{

                    ...styles.primaryButton,

                    ...(savingSize

                      ? styles.disabledButton

                      : {}),

                  }}

                  disabled={savingSize}

                  onClick={() =>

                    void handleCreateSize()

                  }

                >

                  {savingSize

                    ? "Đang lưu..."

                    : "Lưu cỡ"}

                </button>

              </div>

            </section>



            {/* BOTTOM */}



            <section style={styles.bottomSection}>

              <div style={styles.listHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>

                    Cỡ đã khai báo cho mã hàng

                  </h2>



                  <div

                    style={

                      styles.sectionDescription

                    }

                  >

                    {item?.itemCode

                      ? `Mã hàng: ${item.itemCode}`

                      : "Danh sách cỡ của mã hàng"}

                  </div>

                </div>



                <button

                  type="button"

                  style={styles.primaryButton}

                  onClick={openSizeModal}

                >

                  + Thêm cỡ cho mã hàng

                </button>

              </div>



              <div style={styles.tableContainer}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>

                        Mã cỡ

                      </th>



                      <th style={styles.th}>

                        Giá trị

                      </th>



                      <th style={styles.th}>

                        Mô tả

                      </th>



                      <th style={styles.th}>

                        Trạng thái

                      </th>



                      <th

                        style={{

                          ...styles.th,

                          width: "150px",

                        }}

                      >

                        Thao tác

                      </th>

                    </tr>

                  </thead>



                  <tbody>

                    {loading ? (

                      <tr>

                        <td

                          colSpan={5}

                          style={styles.empty}

                        >

                          Đang tải...

                        </td>

                      </tr>

                    ) : sizes.length === 0 ? (

                      <tr>

                        <td

                          colSpan={5}

                          style={styles.empty}

                        >

                          Mã hàng chưa được khai

                          báo cỡ.

                        </td>

                      </tr>

                    ) : (

                      sizes.map((size) => (

                        <tr

                          key={

                            size.headerSizeId

                          }

                        >

                          <td style={styles.td}>

                            <strong>

                              {size.mtlSizeCode}

                            </strong>

                          </td>



                          <td style={styles.td}>

                            {size.mtlSizeValue}

                          </td>



                          <td style={styles.td}>

                            {size.mtlSizeDesc ||

                              "-"}

                          </td>



                          <td style={styles.td}>

                            <span

                              style={

                                size.active

                                  ? styles.activeBadge

                                  : styles.inactiveBadge

                              }

                            >

                              {size.active

                                ? "Hoạt động"

                                : "Ngừng"}

                            </span>

                          </td>



                          <td style={styles.td}>

                            <button

                              type="button"

                              style={{

                                ...styles.removeButton,

                                ...(size.usedInBomStyle

                                  ? styles.disabledButton

                                  : {}),

                              }}

                              disabled={size.usedInBomStyle}

                              title={size.usedInBomStyle

                                ? "Cỡ đã được tạo BOM STYLE nên không thể xóa."

                                : undefined}

                              onClick={() =>

                                void handleRemoveSize(

                                  size,

                                )

                              }

                            >

                              Xóa khỏi mã

                            </button>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        )}



        {activeTab === "DETAIL_ITEMS" && (

          <div style={styles.tabContent}>

            <section style={styles.bottomSection}>

              <div style={styles.listHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>Mã hàng chi tiết</h2>

                  <div style={styles.sectionDescription}>

                    {item?.itemCode

                      ? `Mã hàng: ${item.itemCode}`

                      : "Danh sách mã hàng chi tiết"}

                  </div>

                </div>

              </div>

              <div style={{ ...styles.tableContainer, maxHeight: "460px", overflowY: "auto" }}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>Mã hàng</th>

                      <th style={styles.th}>Code màu</th>

                      <th style={styles.th}>Tên màu</th>

                      <th style={styles.th}>Size</th>

                    </tr>

                  </thead>

                  <tbody>

                    {loadingDetailItems ? (

                      <tr><td colSpan={4} style={styles.empty}>Đang tải...</td></tr>

                    ) : detailItems.length === 0 ? (

                      <tr><td colSpan={4} style={styles.empty}>Chưa có mã hàng chi tiết.</td></tr>

                    ) : (

                      detailItems.map((detail) => (

                        <tr key={detail.inventoryItemId}>

                          <td style={styles.td}><strong>{detail.itemCode}</strong></td>

                          <td style={styles.td}>{detail.colorCode || "-"}</td>

                          <td style={styles.td}>{detail.colorName || "-"}</td>

                          <td style={styles.td}>{detail.mtlSizeCode || "-"}</td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

              <div style={styles.formActions}>

                <button

                  type="button"

                  style={{ ...styles.primaryButton, ...(creatingBomStyle ? styles.disabledButton : {}) }}

                  disabled={creatingBomStyle}

                  onClick={() => void handleBomStyle()}

                >

                  {creatingBomStyle ? "Đang xử lý..." : "BOM STYLE"}

                </button>

              </div>

            </section>

          </div>

        )}

      </div>



      {/* ======================================================

          COLOR MODAL

      ======================================================= */}



      {showColorModal && (

        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            <div style={styles.modalHeader}>

              <div>

                <h2 style={styles.modalTitle}>

                  Chọn màu cho mã hàng

                </h2>



                <div

                  style={

                    styles.sectionDescription

                  }

                >

                  {item?.itemCode ?? ""}

                </div>

              </div>



              <button

                type="button"

                style={styles.closeButton}

                onClick={() =>

                  setShowColorModal(false)

                }

              >

                ×

              </button>

            </div>



            <div style={styles.modalSearch}>

              <input

                autoFocus

                value={colorSearch}

                style={styles.input}

                placeholder="Tìm mã màu, tên màu..."

                onChange={(event) =>

                  setColorSearch(

                    event.target.value,

                  )

                }

              />

            </div>



            <div style={styles.modalList}>

              {loadingAvailableColors ? (

                <div style={styles.modalEmpty}>

                  Đang tải...

                </div>

              ) : availableColors.length === 0 ? (

                <div style={styles.modalEmpty}>

                  Không còn màu phù hợp để thêm.

                </div>

              ) : (

                availableColors.map((color) => {

                  const checked =

                    selectedColorIds.includes(

                      color.colorId,

                    );



                  return (

                    <label

                      key={color.colorId}

                      style={{

                        ...styles.selectRow,

                        ...(checked

                          ? styles.selectedSelectRow

                          : {}),

                      }}

                    >

                      <input

                        type="checkbox"

                        checked={checked}

                        onChange={() =>

                          toggleColor(

                            color.colorId,

                          )

                        }

                      />



                      <div

                        style={

                          styles.selectRowContent

                        }

                      >

                        <strong>

                          {color.colorCode}

                        </strong>



                        <span>

                          {color.colorName ||

                            "-"}

                        </span>



                        <span

                          style={

                            styles.selectDescription

                          }

                        >

                          {color.colorDesc ||

                            "-"}

                        </span>

                      </div>

                    </label>

                  );

                })

              )}

            </div>



            <div style={styles.modalFooter}>

              <span style={styles.selectedCount}>

                Đã chọn:{" "}

                {selectedColorIds.length}

              </span>



              <div style={styles.modalActions}>

                <button

                  type="button"

                  style={styles.secondaryButton}

                  onClick={() =>

                    setShowColorModal(false)

                  }

                >

                  Hủy

                </button>



                <button

                  type="button"

                  style={styles.primaryButton}

                  onClick={() =>

                    void handleAssignColors()

                  }

                >

                  Thêm vào mã hàng

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* ======================================================

          SIZE MODAL

      ======================================================= */}



      {showSizeModal && (

        <div style={styles.modalOverlay}>

          <div style={styles.modal}>

            <div style={styles.modalHeader}>

              <div>

                <h2 style={styles.modalTitle}>

                  Chọn cỡ cho mã hàng

                </h2>



                <div

                  style={

                    styles.sectionDescription

                  }

                >

                  {item?.itemCode ?? ""}

                </div>

              </div>



              <button

                type="button"

                style={styles.closeButton}

                onClick={() =>

                  setShowSizeModal(false)

                }

              >

                ×

              </button>

            </div>



            <div style={styles.modalSearch}>

              <input

                autoFocus

                value={sizeSearch}

                style={styles.input}

                placeholder="Tìm mã cỡ..."

                onChange={(event) =>

                  setSizeSearch(

                    event.target.value,

                  )

                }

              />

            </div>



            <div style={styles.modalList}>

              {loadingAvailableSizes ? (

                <div style={styles.modalEmpty}>

                  Đang tải...

                </div>

              ) : availableSizes.length === 0 ? (

                <div style={styles.modalEmpty}>

                  Không còn cỡ phù hợp để thêm.

                </div>

              ) : (

                availableSizes.map((size) => {

                  const checked =

                    selectedSizeIds.includes(

                      size.sizeId,

                    );



                  return (

                    <label

                      key={size.sizeId}

                      style={{

                        ...styles.selectRow,

                        ...(checked

                          ? styles.selectedSelectRow

                          : {}),

                      }}

                    >

                      <input

                        type="checkbox"

                        checked={checked}

                        onChange={() =>

                          toggleSize(size.sizeId)

                        }

                      />



                      <div

                        style={

                          styles.selectRowContent

                        }

                      >

                        <strong>

                          {size.mtlSizeCode}

                        </strong>



                        <span>

                          {size.mtlSizeValue}

                        </span>



                        <span

                          style={

                            styles.selectDescription

                          }

                        >

                          {size.mtlSizeDesc ||

                            "-"}

                        </span>

                      </div>

                    </label>

                  );

                })

              )}

            </div>



            <div style={styles.modalFooter}>

              <span style={styles.selectedCount}>

                Đã chọn:{" "}

                {selectedSizeIds.length}

              </span>



              <div style={styles.modalActions}>

                <button

                  type="button"

                  style={styles.secondaryButton}

                  onClick={() =>

                    setShowSizeModal(false)

                  }

                >

                  Hủy

                </button>



                <button

                  type="button"

                  style={styles.primaryButton}

                  onClick={() =>

                    void handleAssignSizes()

                  }

                >

                  Thêm vào mã hàng

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



// ============================================================

// STYLES

// ============================================================



const styles: Record<string, CSSProperties> = {

  page: {

    width: "100%",

    height: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    flexDirection: "column",

    padding: "18px 24px",

    background: "#f7f8fa",

    overflow: "hidden",

    boxSizing: "border-box",

  },



  pageHeader: {

    flexShrink: 0,

    minHeight: "54px",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "20px",

    marginBottom: "12px",

  },



  headerLeft: {

    display: "flex",

    alignItems: "center",

    gap: "12px",

  },



  backButton: {

    width: "38px",

    height: "38px",

    border: "1px solid #d1d5db",

    borderRadius: "7px",

    background: "#ffffff",

    color: "#374151",

    cursor: "pointer",

    fontSize: "20px",

    fontWeight: 700,

  },



  title: {

    margin: 0,

    color: "#111827",

    fontSize: "23px",

    fontWeight: 700,

  },



  subtitle: {

    marginTop: "3px",

    color: "#6b7280",

    fontSize: "12px",

  },



  itemHeaderInfo: {

    display: "flex",

    alignItems: "center",

    gap: "10px",

  },



  itemCodeBadge: {

    padding: "7px 12px",

    borderRadius: "6px",

    background: "#e8f2ff",

    color: "#1565c0",

    fontSize: "14px",

    fontWeight: 700,

  },



  itemDescription: {

    color: "#4b5563",

    fontSize: "13px",

  },



  successMessage: {

    flexShrink: 0,

    marginBottom: "10px",

    padding: "9px 12px",

    border: "1px solid #bbf7d0",

    borderRadius: "6px",

    background: "#f0fdf4",

    color: "#15803d",

    fontSize: "13px",

  },



  errorMessage: {

    flexShrink: 0,

    marginBottom: "10px",

    padding: "9px 12px",

    border: "1px solid #fecaca",

    borderRadius: "6px",

    background: "#fef2f2",

    color: "#b91c1c",

    fontSize: "13px",

  },



  mainCard: {

    flex: 1,

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    border: "1px solid #e1e5ea",

    borderRadius: "9px",

    background: "#ffffff",

  },



  tabs: {

    flexShrink: 0,

    height: "48px",

    display: "flex",

    alignItems: "stretch",

    paddingLeft: "16px",

    gap: "4px",

    borderBottom: "1px solid #e5e7eb",

    background: "#fafbfc",

  },



  tabButton: {

    minWidth: "110px",

    padding: "0 22px",

    border: "none",

    borderBottom: "3px solid transparent",

    background: "transparent",

    color: "#6b7280",

    cursor: "pointer",

    fontSize: "14px",

    fontWeight: 600,

  },



  activeTab: {

    borderBottomColor: "#1976d2",

    background: "#ffffff",

    color: "#1976d2",

  },



  tabContent: {

    flex: 1,

    minWidth: 0,

    minHeight: 0,

    display: "grid",

    gridTemplateRows: "auto minmax(0, 1fr)",

    overflow: "hidden",

  },



  topSection: {

    flexShrink: 0,

    padding: "14px 18px",

    borderBottom: "1px solid #e5e7eb",

    background: "#ffffff",

  },



  sectionHeader: {

    marginBottom: "12px",

  },



  sectionTitle: {

    margin: "0 0 3px",

    color: "#111827",

    fontSize: "16px",

    fontWeight: 700,

  },



  sectionDescription: {

    color: "#6b7280",

    fontSize: "12px",

  },



  formGrid: {

    display: "grid",

    gridTemplateColumns:

      "minmax(160px, 0.7fr) minmax(200px, 1fr) minmax(260px, 1.5fr)",

    gap: "12px",

  },



  field: {

    minWidth: 0,

  },



  fieldWide: {

    minWidth: 0,

  },



  label: {

    display: "block",

    marginBottom: "5px",

    color: "#374151",

    fontSize: "12px",

    fontWeight: 600,

  },



  input: {

    width: "100%",

    height: "37px",

    padding: "0 11px",

    border: "1px solid #d1d5db",

    borderRadius: "6px",

    outline: "none",

    background: "#ffffff",

    color: "#111827",

    fontSize: "13px",

    boxSizing: "border-box",

  },



  formActions: {

    display: "flex",

    justifyContent: "flex-end",

    gap: "8px",

    marginTop: "12px",

  },



  primaryButton: {

    minHeight: "36px",

    padding: "0 15px",

    border: "none",

    borderRadius: "6px",

    background: "#1976d2",

    color: "#ffffff",

    cursor: "pointer",

    fontSize: "12px",

    fontWeight: 600,

    whiteSpace: "nowrap",

  },



  secondaryButton: {

    minHeight: "36px",

    padding: "0 15px",

    border: "1px solid #d1d5db",

    borderRadius: "6px",

    background: "#ffffff",

    color: "#374151",

    cursor: "pointer",

    fontSize: "12px",

    fontWeight: 600,

  },



  disabledButton: {

    opacity: 0.6,

    cursor: "not-allowed",

  },



  bottomSection: {

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    flexDirection: "column",

    padding: "14px 18px 16px",

    overflow: "hidden",

  },



  listHeader: {

    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "15px",

    marginBottom: "10px",

  },



  tableContainer: {

    flex: 1,

    minWidth: 0,

    minHeight: 0,

    overflowY: "auto",

    overflowX: "auto",

    border: "1px solid #e5e7eb",

    borderRadius: "7px",

  },



  table: {

    width: "100%",

    borderCollapse: "separate",

    borderSpacing: 0,

    tableLayout: "fixed",

  },



  th: {

    position: "sticky",

    top: 0,

    zIndex: 2,

    height: "39px",

    padding: "0 12px",

    borderBottom: "1px solid #e5e7eb",

    background: "#f8f9fa",

    color: "#374151",

    textAlign: "left",

    fontSize: "12px",

    fontWeight: 700,

  },



  td: {

    height: "47px",

    padding: "0 12px",

    borderBottom: "1px solid #eeeeee",

    color: "#111827",

    fontSize: "13px",

    overflow: "hidden",

    whiteSpace: "nowrap",

    textOverflow: "ellipsis",

  },



  empty: {

    height: "90px",

    textAlign: "center",

    color: "#6b7280",

    fontSize: "13px",

  },



  activeBadge: {

    display: "inline-block",

    padding: "4px 8px",

    borderRadius: "999px",

    background: "#dcfce7",

    color: "#15803d",

    fontSize: "11px",

    fontWeight: 600,

  },



  inactiveBadge: {

    display: "inline-block",

    padding: "4px 8px",

    borderRadius: "999px",

    background: "#f3f4f6",

    color: "#6b7280",

    fontSize: "11px",

    fontWeight: 600,

  },



  removeButton: {

    height: "29px",

    padding: "0 10px",

    border: "1px solid #fecaca",

    borderRadius: "5px",

    background: "#ffffff",

    color: "#dc2626",

    cursor: "pointer",

    fontSize: "11px",

  },



  // MODAL



  modalOverlay: {

    position: "fixed",

    inset: 0,

    zIndex: 9999,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "20px",

    background: "rgba(17, 24, 39, 0.45)",

    boxSizing: "border-box",

  },



  modal: {

    width: "680px",

    maxWidth: "100%",

    maxHeight: "78vh",

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    borderRadius: "10px",

    background: "#ffffff",

    boxShadow:

      "0 20px 50px rgba(0, 0, 0, 0.20)",

  },



  modalHeader: {

    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    padding: "15px 18px",

    borderBottom: "1px solid #e5e7eb",

  },



  modalTitle: {

    margin: "0 0 3px",

    color: "#111827",

    fontSize: "17px",

    fontWeight: 700,

  },



  closeButton: {

    width: "32px",

    height: "32px",

    border: "none",

    borderRadius: "5px",

    background: "#f3f4f6",

    color: "#374151",

    cursor: "pointer",

    fontSize: "21px",

  },



  modalSearch: {

    flexShrink: 0,

    padding: "12px 18px",

    borderBottom: "1px solid #e5e7eb",

    background: "#fafbfc",

  },



  modalList: {

    flex: 1,

    minHeight: "220px",

    overflowY: "auto",

    padding: "8px",

  },



  selectRow: {

    minHeight: "48px",

    display: "flex",

    alignItems: "center",

    gap: "11px",

    padding: "7px 10px",

    marginBottom: "4px",

    border: "1px solid transparent",

    borderRadius: "6px",

    cursor: "pointer",

    boxSizing: "border-box",

  },



  selectedSelectRow: {

    borderColor: "#bfdbfe",

    background: "#eff6ff",

  },



  selectRowContent: {

    flex: 1,

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:

      "110px 160px minmax(0, 1fr)",

    gap: "10px",

    alignItems: "center",

    color: "#111827",

    fontSize: "12px",

  },



  selectDescription: {

    overflow: "hidden",

    whiteSpace: "nowrap",

    textOverflow: "ellipsis",

    color: "#6b7280",

  },



  modalEmpty: {

    padding: "60px 20px",

    textAlign: "center",

    color: "#6b7280",

    fontSize: "13px",

  },



  modalFooter: {

    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "15px",

    padding: "12px 18px",

    borderTop: "1px solid #e5e7eb",

    background: "#fafbfc",

  },



  modalActions: {

    display: "flex",

    gap: "8px",

  },



  selectedCount: {

    color: "#6b7280",

    fontSize: "12px",

  },



  invalidCard: {

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: "15px",

    margin: "auto",

    padding: "30px",

    border: "1px solid #e5e7eb",

    borderRadius: "9px",

    background: "#ffffff",

    color: "#dc2626",

  },

};



export default ItemDetailPage;