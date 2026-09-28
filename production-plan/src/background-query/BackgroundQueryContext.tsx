import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import { AUTH_SESSION_CHANGED_EVENT } from "../auth/authStorage";


// ============================================================
// TYPES
// ============================================================

export type BackgroundQueryStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";


export type BackgroundQueryState<T = unknown> = {
  key: string;

  /*
    Tên hiển thị.

    Ví dụ:
    Production Line
    Material Report
    Inventory Report
  */
  title: string;

  /*
    Route của màn hình sở hữu query.

    Ví dụ:
    /report/production_line
  */
  route: string;

  status: BackgroundQueryStatus;

  data: T | null;

  error: string | null;

  startedAt: number | null;

  completedAt: number | null;

  requestId: number;
};


// ============================================================
// NOTIFICATION
// ============================================================

export type BackgroundQueryNotification = {
  id: string;

  queryKey: string;

  title: string;

  route: string;

  type:
    | "success"
    | "error";

  message: string;

  createdAt: number;
};


// ============================================================
// RUN QUERY
// ============================================================

export type RunBackgroundQueryParams<T> = {
  /*
    Key duy nhất của chức năng.

    Ví dụ:
    report-production-line
  */
  key: string;

  /*
    Tên dùng trong notification.
  */
  title: string;

  /*
    Route của màn hình.

    Provider dùng route này để kiểm tra:

    Nếu user vẫn đang ở màn hình này
    => KHÔNG notification.

    Nếu user đang ở màn hình khác
    => notification.
  */
  route: string;

  /*
    Promise thực sự chạy API.
  */
  request: () => Promise<T>;

  /*
    Có notification khi thành công hay không.

    Mặc định = true.
  */
  notifyOnSuccess?: boolean;

  /*
    Có notification khi lỗi hay không.

    Mặc định = true.
  */
  notifyOnError?: boolean;

  /*
    Message thành công.

    Mặc định:
    "Đã có dữ liệu."
  */
  successMessage?: string;
};


// ============================================================
// CONTEXT TYPE
// ============================================================

type BackgroundQueryContextValue = {
  queries: Record<
    string,
    BackgroundQueryState<unknown>
  >;

  notifications:
    BackgroundQueryNotification[];

  runQuery: <T>(
    params: RunBackgroundQueryParams<T>,
  ) => Promise<T | null>;

  clearQuery: (
    key: string,
  ) => void;

  clearAllQueries:
    () => void;

  dismissNotification: (
    id: string,
  ) => void;

  clearNotifications:
    () => void;
};


// ============================================================
// CONTEXT
// ============================================================

const BackgroundQueryContext =
  createContext<
    BackgroundQueryContextValue | undefined
  >(undefined);


// ============================================================
// HELPERS
// ============================================================

function normalizePath(
  path: string,
) {
  /*
    Bỏ query string.

    Ví dụ:

    /report/production_line?page=1

    thành:

    /report/production_line
  */

  const withoutQuery =
    path.split("?")[0];


  /*
    Bỏ dấu / cuối route.

    /report/production_line/

    thành:

    /report/production_line
  */

  if (
    withoutQuery.length > 1 &&
    withoutQuery.endsWith("/")
  ) {
    return withoutQuery.slice(
      0,
      -1,
    );
  }


  return withoutQuery;
}


// ============================================================
// PROVIDER
// ============================================================

export function BackgroundQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ==========================================================
  // QUERY STATE
  // ==========================================================

  const [
    queries,
    setQueries,
  ] = useState<
    Record<
      string,
      BackgroundQueryState<unknown>
    >
  >({});


  /*
    Ref giữ query mới nhất.

    Callback async dùng ref để tránh stale state.
  */
  const queriesRef =
    useRef<
      Record<
        string,
        BackgroundQueryState<unknown>
      >
    >({});


  /*
    Request counter riêng cho từng query key.

    Dùng để chống response cũ ghi đè response mới.
  */
  const requestCounterRef =
    useRef<
      Record<string, number>
    >({});


  // ==========================================================
  // NOTIFICATION STATE
  // ==========================================================

  const [
    notifications,
    setNotifications,
  ] = useState<
    BackgroundQueryNotification[]
  >([]);


  // ==========================================================
  // AUTH SESSION CHANGE: CLEAR USER/FACTORY-SCOPED CACHE
  // ==========================================================

  useEffect(() => {
    const clearForAuthChange = () => {
      queriesRef.current = {};
      requestCounterRef.current = {};
      setQueries({});
      setNotifications([]);
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, clearForAuthChange);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, clearForAuthChange);
    };
  }, []);


  // ==========================================================
  // SET QUERY
  // ==========================================================

  const setQueryState =
    useCallback(
      (
        key: string,
        state:
          BackgroundQueryState<unknown>,
      ) => {
        const next = {
          ...queriesRef.current,

          [key]:
            state,
        };


        queriesRef.current =
          next;


        setQueries(next);
      },
      [],
    );


  // ==========================================================
  // DISMISS NOTIFICATION
  // ==========================================================

  const dismissNotification =
    useCallback(
      (
        id: string,
      ) => {
        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id,
            ),
        );
      },
      [],
    );


  // ==========================================================
  // CLEAR NOTIFICATIONS
  // ==========================================================

  const clearNotifications =
    useCallback(
      () => {
        setNotifications(
          [],
        );
      },
      [],
    );


  // ==========================================================
  // ADD NOTIFICATION
  // ==========================================================

  const addNotification =
    useCallback(
      (
        notification:
          Omit<
            BackgroundQueryNotification,
            "id" | "createdAt"
          >,
      ) => {
        const id =
          `${notification.queryKey}-` +
          `${Date.now()}-` +
          `${Math.random()
            .toString(36)
            .slice(2)}`;


        const newNotification:
          BackgroundQueryNotification = {
            ...notification,

            id,

            createdAt:
              Date.now(),
          };


        /*
          Giữ tối đa 5 notification.

          Thực tế toast chỉ sống 3 giây,
          nhưng giới hạn này giúp store sạch.
        */
        setNotifications(
          (current) => {
            const next = [
              ...current,
              newNotification,
            ];


            return next.slice(
              -5,
            );
          },
        );
      },
      [],
    );


  // ==========================================================
  // SHOULD NOTIFY?
  // ==========================================================

  const shouldNotify =
    useCallback(
      (
        ownerRoute: string,
      ) => {
        /*
          QUAN TRỌNG:

          Kiểm tra location tại THỜI ĐIỂM
          request hoàn thành.

          Không lấy location khi bắt đầu request.
        */

        const currentPath =
          normalizePath(
            window.location.pathname,
          );


        const queryPath =
          normalizePath(
            ownerRoute,
          );


        /*
          Đang ở đúng màn hình report
          => không cần notification.
        */

        return (
          currentPath !==
          queryPath
        );
      },
      [],
    );


  // ==========================================================
  // RUN QUERY
  // ==========================================================

  const runQuery =
    useCallback(
      async <T,>({
        key,
        title,
        route,
        request,
        notifyOnSuccess = true,
        notifyOnError = true,
        successMessage = "Đã có dữ liệu.",
      }: RunBackgroundQueryParams<T>): Promise<
        T | null
      > => {
        // ----------------------------------------------------
        // REQUEST ID
        // ----------------------------------------------------

        const requestId =
          (
            requestCounterRef
              .current[key] ??
            0
          ) + 1;


        requestCounterRef.current[
          key
        ] = requestId;


        // ----------------------------------------------------
        // OLD QUERY
        // ----------------------------------------------------

        const previous =
          queriesRef.current[
            key
          ];


        const startedAt =
          Date.now();


        // ----------------------------------------------------
        // LOADING
        // ----------------------------------------------------

        const loadingState:
          BackgroundQueryState<T> = {
            key,

            title,

            route,

            status:
              "loading",

            /*
              Giữ data cũ trong khi query mới chạy.
            */
            data:
              (previous?.data ??
                null) as T | null,

            error: null,

            startedAt,

            completedAt:
              null,

            requestId,
          };


        setQueryState(
          key,

          loadingState as BackgroundQueryState<unknown>,
        );


        try {
          // --------------------------------------------------
          // REQUEST
          //
          // Promise nằm trong Provider.
          //
          // Page có unmount do chuyển menu,
          // Provider vẫn sống.
          // --------------------------------------------------

          const result =
            await request();


          // --------------------------------------------------
          // OLD REQUEST CHECK
          // --------------------------------------------------

          if (
            requestCounterRef
              .current[key] !==
            requestId
          ) {
            return null;
          }


          // --------------------------------------------------
          // SUCCESS
          // --------------------------------------------------

          const successState:
            BackgroundQueryState<T> = {
              key,

              title,

              route,

              status:
                "success",

              data:
                result,

              error:
                null,

              startedAt,

              completedAt:
                Date.now(),

              requestId,
            };


          setQueryState(
            key,

            successState as BackgroundQueryState<unknown>,
          );


          // --------------------------------------------------
          // SUCCESS NOTIFICATION
          // --------------------------------------------------

          if (
            notifyOnSuccess &&
            shouldNotify(
              route,
            )
          ) {
            addNotification({
              queryKey:
                key,

              title,

              route,

              type:
                "success",

              message:
                successMessage,
            });
          }


          return result;
        } catch (error) {
          // --------------------------------------------------
          // OLD REQUEST CHECK
          // --------------------------------------------------

          if (
            requestCounterRef
              .current[key] !==
            requestId
          ) {
            return null;
          }


          const message =
            error instanceof Error
              ? error.message
              : "Có lỗi khi tải dữ liệu.";


          // --------------------------------------------------
          // ERROR
          // --------------------------------------------------

          const errorState:
            BackgroundQueryState<T> = {
              key,

              title,

              route,

              status:
                "error",

              /*
                Giữ data thành công trước đó.
              */
              data:
                (previous?.data ??
                  null) as T | null,

              error:
                message,

              startedAt,

              completedAt:
                Date.now(),

              requestId,
            };


          setQueryState(
            key,

            errorState as BackgroundQueryState<unknown>,
          );


          // --------------------------------------------------
          // ERROR NOTIFICATION
          // --------------------------------------------------

          if (
            notifyOnError &&
            shouldNotify(
              route,
            )
          ) {
            addNotification({
              queryKey:
                key,

              title,

              route,

              type:
                "error",

              message,
            });
          }


          return null;
        }
      },
      [
        addNotification,
        setQueryState,
        shouldNotify,
      ],
    );


  // ==========================================================
  // CLEAR QUERY
  // ==========================================================

  const clearQuery =
    useCallback(
      (
        key: string,
      ) => {
        /*
          Vô hiệu hóa response của request hiện tại.
        */

        requestCounterRef.current[
          key
        ] =
          (
            requestCounterRef
              .current[key] ??
            0
          ) + 1;


        const next = {
          ...queriesRef.current,
        };


        delete next[key];


        queriesRef.current =
          next;


        setQueries(
          next,
        );


        /*
          Xóa luôn notification thuộc query đó.
        */

        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.queryKey !==
                key,
            ),
        );
      },
      [],
    );


  // ==========================================================
  // CLEAR ALL QUERIES
  // ==========================================================

  const clearAllQueries =
    useCallback(
      () => {
        Object.keys(
          requestCounterRef.current,
        ).forEach(
          (key) => {
            requestCounterRef
              .current[key] =
              (
                requestCounterRef
                  .current[key] ??
                0
              ) + 1;
          },
        );


        queriesRef.current =
          {};


        setQueries(
          {},
        );


        setNotifications(
          [],
        );
      },
      [],
    );


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value =
    useMemo<
      BackgroundQueryContextValue
    >(
      () => ({
        queries,

        notifications,

        runQuery,

        clearQuery,

        clearAllQueries,

        dismissNotification,

        clearNotifications,
      }),
      [
        queries,
        notifications,
        runQuery,
        clearQuery,
        clearAllQueries,
        dismissNotification,
        clearNotifications,
      ],
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <BackgroundQueryContext.Provider
      value={value}
    >
      {children}
    </BackgroundQueryContext.Provider>
  );
}


// ============================================================
// MAIN HOOK
// ============================================================

export function useBackgroundQuery() {
  const context =
    useContext(
      BackgroundQueryContext,
    );


  if (!context) {
    throw new Error(
      "useBackgroundQuery phải được sử dụng bên trong BackgroundQueryProvider.",
    );
  }


  return {
    runQuery:
      context.runQuery,

    clearQuery:
      context.clearQuery,

    clearAllQueries:
      context.clearAllQueries,
  };
}


// ============================================================
// QUERY STATE HOOK
//
// Component subscribe trực tiếp vào query.
// ============================================================

export function useBackgroundQueryState<T>(
  key: string,
):
  | BackgroundQueryState<T>
  | undefined {
  const context =
    useContext(
      BackgroundQueryContext,
    );


  if (!context) {
    throw new Error(
      "useBackgroundQueryState phải được sử dụng bên trong BackgroundQueryProvider.",
    );
  }


  return context.queries[
    key
  ] as
    | BackgroundQueryState<T>
    | undefined;
}


// ============================================================
// NOTIFICATION HOOK
// ============================================================

export function useBackgroundQueryNotifications() {
  const context =
    useContext(
      BackgroundQueryContext,
    );


  if (!context) {
    throw new Error(
      "useBackgroundQueryNotifications phải được sử dụng bên trong BackgroundQueryProvider.",
    );
  }


  return {
    notifications:
      context.notifications,

    dismissNotification:
      context.dismissNotification,

    clearNotifications:
      context.clearNotifications,
  };
}