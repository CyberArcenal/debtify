// src/components/Shared/NotificationToastListener.tsx
import { useEffect } from "react";
import { showToast } from "../../utils/notification";

// Map backend notification types to toast types
const mapType = (type: string): "success" | "error" | "warning" | "info" | "critical" => {
  switch (type) {
    case "payment_confirmation":
      return "success";
    case "overdue":
      return "warning";
    case "error":
      return "error";
    case "critical":
      return "critical";
    default:
      return "info";
  }
};

export const NotificationToastListener = () => {
  useEffect(() => {
    const handleNotificationCreated = (_event: any, data: any) => {
      const { title, message, type } = data;
      console.log("Received notification from main process:", data);

      // Use the existing toast system
      showToast(`${title}: ${message}`, mapType(type), {
        duration: 5000,
        autoClose: true,
      });
    };

    // Listen for the event from main process
    if (window.backendAPI?.on) {
      window.backendAPI.on("notification:created", handleNotificationCreated);
    }

    return () => {
      if (window.backendAPI?.off) {
        window.backendAPI.off("notification:created", handleNotificationCreated);
      }
    };
  }, []);

  // This component does not render anything
  return null;
};