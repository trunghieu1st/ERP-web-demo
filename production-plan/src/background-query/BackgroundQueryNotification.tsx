import {
  useEffect,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useBackgroundQueryNotifications,
} from "./BackgroundQueryContext";

import type {
  BackgroundQueryNotification as BackgroundQueryNotificationType,
} from "./BackgroundQueryContext";


// ============================================================
// CONFIG
// ============================================================

const AUTO_CLOSE_MS =
  3000;


// ============================================================
// MAIN COMPONENT
// ============================================================

function BackgroundQueryNotification() {
  const navigate =
    useNavigate();


  const {
    notifications,
    dismissNotification,
  } =
    useBackgroundQueryNotifications();


  // ==========================================================
  // NOTHING TO SHOW
  // ==========================================================

  if (
    notifications.length ===
    0
  ) {
    return null;
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        position: "fixed",

        /*
          Export notification của bạn có thể cũng
          nằm góc dưới phải.

          Mình đặt Background Query cao hơn một chút
          để 2 notification không đè nhau.
        */
        right: "18px",

        bottom: "110px",

        width: "350px",

        maxWidth:
          "calc(100vw - 36px)",

        display: "flex",

        flexDirection:
          "column",

        gap: "8px",

        zIndex: 99999,

        pointerEvents:
          "none",
      }}
    >
      {notifications.map(
        (notification) => (
          <NotificationItem
            key={
              notification.id
            }
            notification={
              notification
            }
            onClose={() =>
              dismissNotification(
                notification.id,
              )
            }
            onOpen={() => {
              /*
                Xóa notification trước,
                sau đó điều hướng về report.
              */

              dismissNotification(
                notification.id,
              );


              navigate(
                notification.route,
              );
            }}
          />
        ),
      )}
    </div>
  );
}


// ============================================================
// ITEM PROPS
// ============================================================

type NotificationItemProps = {
  notification:
    BackgroundQueryNotificationType;

  onClose:
    () => void;

  onOpen:
    () => void;
};


// ============================================================
// NOTIFICATION ITEM
// ============================================================

function NotificationItem({
  notification,
  onClose,
  onOpen,
}: NotificationItemProps) {
  // ==========================================================
  // AUTO CLOSE 3 SECONDS
  // ==========================================================

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          onClose();
        },

        AUTO_CLOSE_MS,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    notification.id,
    onClose,
  ]);


  const isSuccess =
    notification.type ===
    "success";


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        pointerEvents:
          "auto",

        backgroundColor:
          "#ffffff",

        border:
          isSuccess
            ? "1px solid #bbf7d0"
            : "1px solid #fecaca",

        borderRadius:
          "9px",

        boxShadow:
          "0 8px 24px rgba(0, 0, 0, 0.16)",

        overflow:
          "hidden",

        animation:
          "backgroundQueryNotificationIn 180ms ease-out",
      }}
    >
      {/* TOP COLOR */}

      <div
        style={{
          height: "4px",

          backgroundColor:
            isSuccess
              ? "#16a34a"
              : "#dc2626",
        }}
      />


      {/* CONTENT */}

      <div
        style={{
          padding:
            "12px 13px",

          display: "flex",

          alignItems:
            "flex-start",

          gap: "10px",
        }}
      >
        {/* ICON */}

        <div
          style={{
            flexShrink: 0,

            width: "30px",

            height: "30px",

            borderRadius:
              "50%",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            backgroundColor:
              isSuccess
                ? "#dcfce7"
                : "#fee2e2",

            color:
              isSuccess
                ? "#15803d"
                : "#b91c1c",

            fontSize:
              "16px",

            fontWeight:
              800,
          }}
        >
          {isSuccess
            ? "✓"
            : "!"}
        </div>


        {/* TEXT */}

        <div
          style={{
            flex: 1,

            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                "#111827",

              fontSize:
                "14px",

              fontWeight:
                700,

              lineHeight:
                1.35,
            }}
          >
            {notification.title}
          </div>


          <div
            style={{
              marginTop:
                "3px",

              color:
                "#4b5563",

              fontSize:
                "13px",

              lineHeight:
                1.4,
            }}
          >
            {notification.message}
          </div>


          {isSuccess && (
            <button
              type="button"
              onClick={
                onOpen
              }
              style={{
                marginTop:
                  "7px",

                padding: 0,

                background:
                  "transparent",

                border:
                  "none",

                color:
                  "#2563eb",

                cursor:
                  "pointer",

                fontSize:
                  "12px",

                fontWeight:
                  700,
              }}
            >
              Xem kết quả →
            </button>
          )}
        </div>


        {/* CLOSE */}

        <button
          type="button"
          onClick={
            onClose
          }
          aria-label="Đóng thông báo"
          style={{
            flexShrink: 0,

            width: "25px",

            height: "25px",

            padding: 0,

            border:
              "none",

            borderRadius:
              "4px",

            backgroundColor:
              "transparent",

            color:
              "#9ca3af",

            cursor:
              "pointer",

            fontSize:
              "17px",

            lineHeight:
              "25px",
          }}
        >
          ×
        </button>
      </div>


      {/* AUTO CLOSE BAR */}

      <div
        style={{
          height: "2px",

          backgroundColor:
            isSuccess
              ? "#22c55e"
              : "#ef4444",

          animation:
            `backgroundQueryNotificationTimer ${AUTO_CLOSE_MS}ms linear forwards`,
        }}
      />


      {/* ANIMATION */}

      <style>
        {`
          @keyframes backgroundQueryNotificationIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes backgroundQueryNotificationTimer {
            from {
              width: 100%;
            }

            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
}


export default BackgroundQueryNotification;