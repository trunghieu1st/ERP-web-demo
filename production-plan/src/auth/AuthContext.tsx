import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { RoleCode } from "./permissionConfig";

import { API_BASE_URL } from "../api/apiConfig";
import {
  AUTH_SYNC_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  clearAuthStorage,
  notifyAuthSessionChanged,
} from "./authStorage";


// =======================================================
// USER
// =======================================================

export interface User {
  userId: number;
  username: string;
  fullName: string;

  factoryId: number;
  factoryName: string;

  departmentId: number;
  departmentName: string;

  interfaceType: "WEB" | "PWA";

  role: RoleCode;
  roleName: string;
}


// =======================================================
// AUTH CONTEXT TYPE
// =======================================================

interface AuthContextType {
  user: User | null;

  accessToken: string | null;

  isAuthenticated: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<boolean>;

  updateUser: (
    updatedUser: User
  ) => void;

  logout: () => void;
}


// =======================================================
// CONTEXT
// =======================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );


// =======================================================
// AUTH PROVIDER
// =======================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  // =====================================================
  // USER STATE
  // =====================================================

  const [user, setUser] =
    useState<User | null>(() => {

      const savedUser =
        localStorage.getItem(
          USER_STORAGE_KEY
        );

      if (!savedUser) {
        return null;
      }

      try {
        return JSON.parse(
          savedUser
        ) as User;
      } catch {

        localStorage.removeItem(
          USER_STORAGE_KEY
        );

        return null;
      }
    });


  // =====================================================
  // ACCESS TOKEN STATE
  // =====================================================

  const [
    accessToken,
    setAccessToken,
  ] = useState<string | null>(() => {

    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );
  });


  // =====================================================
  // CROSS-TAB AUTH SYNC
  // One browser profile = one authenticated identity.
  // =====================================================

  useEffect(() => {
    const reloadSessionFromStorage = () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (!token || !savedUser) {
        setAccessToken(null);
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(savedUser) as User);
        setAccessToken(token);
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setAccessToken(null);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_SYNC_STORAGE_KEY) {
        return;
      }

      reloadSessionFromStorage();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);


  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/api/Auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username,
              password,
            }),
          }
        );


      // ===============================================
      // LOGIN FAILED
      // ===============================================

      if (!response.ok) {

        console.error(
          "LOGIN: API trả lỗi",
          response.status
        );

        return false;
      }


      // ===============================================
      // RESPONSE
      // ===============================================

      const data =
        await response.json();

      console.log(
        "LOGIN RESPONSE:",
        data
      );


      // ===============================================
      // CHECK ACCESS TOKEN
      // ===============================================

      if (!data.accessToken) {

        console.error(
          "LOGIN: API không trả accessToken"
        );

        return false;
      }


      // ===============================================
      // CHECK USER
      // ===============================================

      if (!data.user) {

        console.error(
          "LOGIN: API không trả user"
        );

        return false;
      }


      const apiUser =
        data.user;


      if (
        apiUser.userId == null ||
        !apiUser.username
      ) {

        console.error(
          "LOGIN: Thông tin user không hợp lệ"
        );

        return false;
      }


      if (
        apiUser.factoryId == null
      ) {

        console.error(
          "LOGIN: User chưa được gán Factory"
        );

        return false;
      }


      if (
        apiUser.departmentId == null
      ) {

        console.error(
          "LOGIN: User chưa được gán Department"
        );

        return false;
      }


      if (!apiUser.role) {

        console.error(
          "LOGIN: User chưa được gán Role"
        );

        return false;
      }


      // ===============================================
      // CREATE USER
      // ===============================================

      const loggedInUser: User = {

        userId:
          Number(
            apiUser.userId
          ),

        username:
          apiUser.username,

        fullName:
          apiUser.fullName ?? "",


        factoryId:
          Number(
            apiUser.factoryId
          ),

        factoryName:
          apiUser.factoryName ?? "",


        departmentId:
          Number(
            apiUser.departmentId
          ),

        departmentName:
          apiUser.departmentName ?? "",


        interfaceType:
          apiUser.interfaceType === "PWA"
            ? "PWA"
            : "WEB",


        role:
          apiUser.role as RoleCode,

        roleName:
          apiUser.roleName ?? "",
      };


      // ===============================================
      // SAVE USER
      // ===============================================

      setUser(
        loggedInUser
      );

      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(
          loggedInUser
        )
      );


      // ===============================================
      // SAVE ACCESS TOKEN
      // ===============================================

      setAccessToken(
        data.accessToken
      );

      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        data.accessToken
      );

      // Notify this tab and every other tab only after
      // both user + token have been written.
      notifyAuthSessionChanged("LOGIN");


      console.log(
        "LOGIN: đăng nhập thành công",
        loggedInUser
      );


      return true;

    } catch (error) {

      console.error(
        "LOGIN: lỗi gọi API",
        error
      );

      return false;
    }
  };


  // =====================================================
  // UPDATE CURRENT USER
  // =====================================================

  const updateUser = (
    updatedUser: User
  ) => {

    // React state
    setUser(
      updatedUser
    );


    // LocalStorage
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(
        updatedUser
      )
    );

    notifyAuthSessionChanged("USER_UPDATED");


    console.log(
      "AUTH: user đã được cập nhật =",
      updatedUser
    );
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    // React state
    setUser(null);

    setAccessToken(null);


    // LocalStorage + notify every tab in this browser profile.
    clearAuthStorage("LOGOUT");
  };


  // =====================================================
  // AUTHENTICATED
  // =====================================================

  const isAuthenticated =
    user !== null &&
    accessToken !== null;


  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        user,

        accessToken,

        isAuthenticated,

        login,

        updateUser,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =======================================================
// USE AUTH
// =======================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }


  return context;
}