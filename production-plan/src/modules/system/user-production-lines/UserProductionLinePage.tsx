import { useEffect, useState } from "react";
import "./UserProductionLinePage.css";
import { apiFetch } from "../../../api/apiClient";

interface UserItem {
  userId: number;
  username: string;
  fullName: string;
  factoryId: number | null;
  departmentId: number | null;
  roleCode: string | null;
}

interface FactoryItem {
  id: number;
  name: string;
}

interface DepartmentItem {
  id: number;
  name: string;
}

interface ProductionLine {
  productionLineId: number;
  factoryId: number;
  lineCode: string;
  lineName: string;
  isActive: boolean;
  sortOrder: number;
}

interface UserProductionLineResponse {
  user: UserItem;
  productionLines: {
    productionLineId: number;
    factoryId: number;
    lineCode: string;
    lineName: string;
    sortOrder: number;
  }[];
}

export default function UserProductionLinePage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD USERS + FACTORIES + DEPARTMENTS
  // =========================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingUsers(true);
      setLoadingMasterData(true);
      setError("");

      const [usersResponse, factoriesResponse, departmentsResponse] =
        await Promise.all([
          apiFetch("/api/user-functions/users"),
          apiFetch("/api/factories"),
          apiFetch("/api/departments"),
        ]);

      if (!usersResponse.ok) {
        throw new Error("Không thể lấy danh sách User.");
      }

      if (!factoriesResponse.ok) {
        throw new Error("Không thể lấy danh sách nhà máy.");
      }

      if (!departmentsResponse.ok) {
        throw new Error("Không thể lấy danh sách phòng ban.");
      }

      const usersData: UserItem[] = await usersResponse.json();
      const factoriesData = await factoriesResponse.json();
      const departmentsData = await departmentsResponse.json();

      setUsers(usersData);

      setFactories(
        factoriesData.map((x: any) => ({
          id: Number(x.id ?? x.factoryId),
          name: x.name ?? x.factoryName ?? "",
        })),
      );

      setDepartments(
        departmentsData.map((x: any) => ({
          id: Number(x.id ?? x.departmentId),
          name: x.name ?? x.departmentName ?? "",
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi tải dữ liệu.");
    } finally {
      setLoadingUsers(false);
      setLoadingMasterData(false);
    }
  };

  // =========================================================
  // GET FACTORY NAME
  // =========================================================

  const getFactoryName = (factoryId: number | null | undefined) => {
    if (!factoryId) {
      return "";
    }

    return (
      factories.find((x) => x.id === factoryId)?.name ?? `Factory ${factoryId}`
    );
  };

  // =========================================================
  // GET DEPARTMENT NAME
  // =========================================================

  const getDepartmentName = (departmentId: number | null | undefined) => {
    if (!departmentId) {
      return "";
    }

    return (
      departments.find((x) => x.id === departmentId)?.name ??
      `Department ${departmentId}`
    );
  };

  // =========================================================
  // CHỌN USER
  // =========================================================

  const handleUserChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setMessage("");
    setError("");

    if (!value) {
      setSelectedUserId("");
      setSelectedUser(null);
      setProductionLines([]);
      setSelectedLineIds([]);
      return;
    }

    const userId = Number(value);

    setSelectedUserId(userId);

    const user = users.find((x) => x.userId === userId) ?? null;

    setSelectedUser(user);
    setProductionLines([]);
    setSelectedLineIds([]);

    if (!user) {
      return;
    }

    if (!user.factoryId) {
      setError("User này chưa được gán nhà máy.");
      return;
    }

    await loadUserProductionLines(userId);
  };

  // =========================================================
  // LOAD CHUYỀN THEO FACTORY HIỆN TẠI (JWT DATASCOPE)
  // =========================================================

  const loadUserProductionLines = async (userId: number) => {
    try {
      setLoadingLines(true);
      setError("");

      // ---------------------------------------------
      // Backend tự scope Factory theo JWT.
      // Không truyền FactoryId từ frontend.
      // ---------------------------------------------

      const linesResponse = await apiFetch("/api/production-lines");

      if (!linesResponse.ok) {
        throw new Error("Không thể lấy danh sách chuyền.");
      }

      const lines: ProductionLine[] = await linesResponse.json();

      setProductionLines(
        lines
          .filter((x) => x.isActive)
          .sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }

            return a.productionLineId - b.productionLineId;
          }),
      );

      // ---------------------------------------------
      // Lấy các chuyền hiện đang được phân cho User
      // ---------------------------------------------

      const assignedResponse = await apiFetch(`/api/user-functions/${userId}`);

      if (!assignedResponse.ok) {
        throw new Error("Không thể lấy danh sách chuyền đã phân cho User.");
      }

      const data: UserProductionLineResponse = await assignedResponse.json();

      setSelectedLineIds(data.productionLines.map((x) => x.productionLineId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi tải dữ liệu.");
    } finally {
      setLoadingLines(false);
    }
  };

  // =========================================================
  // CHECKBOX
  // =========================================================

  const handleLineChange = (lineId: number) => {
    setSelectedLineIds((current) => {
      if (current.includes(lineId)) {
        return current.filter((id) => id !== lineId);
      }

      return [...current, lineId];
    });

    setMessage("");
    setError("");
  };

  // =========================================================
  // CHỌN TẤT CẢ
  // =========================================================

  const handleSelectAll = () => {
    setSelectedLineIds(productionLines.map((x) => x.productionLineId));

    setMessage("");
    setError("");
  };

  // =========================================================
  // BỎ CHỌN TẤT CẢ
  // =========================================================

  const handleClearAll = () => {
    setSelectedLineIds([]);

    setMessage("");
    setError("");
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    if (!selectedUserId) {
      setError("Vui lòng chọn User.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await apiFetch(`/api/user-functions/${selectedUserId}`, {
        method: "PUT",

        body: JSON.stringify({
          productionLineIds: selectedLineIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Không thể lưu phân chuyền.");
      }

      setMessage(
        `Đã lưu phân chuyền cho User ${selectedUser?.username ?? ""}.`,
      );

      // Load lại dữ liệu sau khi save.
      // Backend tiếp tục enforce Factory theo JWT.
      await loadUserProductionLines(Number(selectedUserId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi khi lưu phân chuyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="user-production-line-page">
      <div className="upl-header">
        <div>
          <h1>Phân chuyền SX cho User</h1>

          <div className="upl-subtitle">
            Phân quyền User được sử dụng các chuyền sản xuất trong nhà máy.
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* USER */}
      {/* ================================================= */}

      <div className="upl-card">
        <div className="upl-card-title">Thông tin User</div>

        <div className="upl-user-row">
          <div className="upl-field upl-user-select">
            <label>User</label>

            <select
              value={selectedUserId}
              onChange={handleUserChange}
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers ? "Đang tải..." : "-- Chọn User --"}
              </option>

              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.username} - {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="upl-field">
            <label>Nhà máy</label>

            <input value={getFactoryName(selectedUser?.factoryId)} readOnly />
          </div>

          <div className="upl-field">
            <label>Phòng ban</label>

            <input
              value={getDepartmentName(selectedUser?.departmentId)}
              readOnly
            />
          </div>

          <div className="upl-field">
            <label>Role</label>

            <input value={selectedUser?.roleCode ?? ""} readOnly />
          </div>
        </div>

        {loadingMasterData && (
          <div className="upl-loading">
            Đang tải thông tin nhà máy và phòng ban...
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* MESSAGE */}
      {/* ================================================= */}

      {message && <div className="upl-message success">{message}</div>}

      {error && <div className="upl-message error">{error}</div>}

      {/* ================================================= */}
      {/* PRODUCTION LINES */}
      {/* ================================================= */}

      {selectedUser && (
        <div className="upl-card">
          <div className="upl-line-header">
            <div>
              <div className="upl-card-title">Chuyền sản xuất</div>

              <div className="upl-line-summary">
                Đã chọn: <strong>{selectedLineIds.length}</strong> /{" "}
                {productionLines.length} chuyền
              </div>
            </div>

            <div className="upl-actions">
              <button
                type="button"
                className="upl-btn secondary"
                onClick={handleSelectAll}
                disabled={loadingLines || productionLines.length === 0}
              >
                Chọn tất cả
              </button>

              <button
                type="button"
                className="upl-btn secondary"
                onClick={handleClearAll}
                disabled={loadingLines || productionLines.length === 0}
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {loadingLines ? (
            <div className="upl-loading">Đang tải danh sách chuyền...</div>
          ) : productionLines.length === 0 ? (
            <div className="upl-empty">
              Factory này chưa có chuyền sản xuất.
            </div>
          ) : (
            <div className="upl-line-table-wrapper">
              <table className="upl-line-table">
                <thead>
                  <tr>
                    <th className="check-column">Chọn</th>

                    <th>STT</th>

                    <th>Mã chuyền</th>

                    <th>Tên chuyền</th>

                    <th>Nhà máy</th>
                  </tr>
                </thead>

                <tbody>
                  {productionLines.map((line, index) => {
                    const checked = selectedLineIds.includes(
                      line.productionLineId,
                    );

                    return (
                      <tr
                        key={line.productionLineId}
                        className={checked ? "selected-row" : ""}
                      >
                        <td className="check-column">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleLineChange(line.productionLineId)
                            }
                          />
                        </td>

                        <td>{index + 1}</td>

                        <td>
                          <strong>{line.lineCode}</strong>
                        </td>

                        <td>{line.lineName}</td>

                        <td>{getFactoryName(line.factoryId)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ================================================= */}
          {/* SAVE */}
          {/* ================================================= */}

          <div className="upl-footer">
            <button
              type="button"
              className="upl-btn primary"
              onClick={handleSave}
              disabled={saving || loadingLines || !selectedUserId}
            >
              {saving ? "Đang lưu..." : "Lưu phân chuyền"}
            </button>
          </div>
        </div>
      )}

      {!selectedUser && !loadingUsers && (
        <div className="upl-empty-main">
          Vui lòng chọn User để phân chuyền sản xuất.
        </div>
      )}
    </div>
  );
}
