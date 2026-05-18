import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../layouts/Layout";
import AuditTrailPage from "../pages/AuditTrail";
import NotificationLogPage from "../pages/NotificationLog";
import SettingsPage from "../pages/Settings";
import { useEffect, useState } from "react";
import { LicenseModal } from "../components/Shared/LicenseModal";
import { Help } from "../pages/help";
import DebtDashboard from "../pages/dashboard/components/DebtDashboard";
// import DebtDashboard from "../pages/dashboard";

function App() {
  const [licenseAccepted, setLicenseAccepted] = useState(false);

  useEffect(() => {
    if (window.backendAPI?.notifyAppReady) {
      window.backendAPI.notifyAppReady();
      console.log("Notified main process: renderer is ready");
    }
  }, []);

  const handleAccept = () => {
    setLicenseAccepted(true);
  };

  const handleCommercialRequest = () => {
    // Open email or external page
    if ((window as any).backendAPI?.openExternal) {
      (window as any).backendAPI.openExternal(
        "mailto:cyberarcenal1@gmail.com?subject=Commercial%20License%20Inquiry"
      );
    } else {
      window.open(
        "mailto:cyberarcenal1@gmail.com?subject=Commercial%20License%20Inquiry",
        "_blank"
      );
    }
  };

  // Show modal on first visit if license not accepted
  if (!licenseAccepted && !localStorage.getItem("Debtify_license_accepted")) {
    return (
      <LicenseModal
        onAccept={handleAccept}
        onCommercialRequest={handleCommercialRequest}
      />
    );
  }
  return (
    <Routes>
      <Route path="/help" element={<Help />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Core POS */}
        <Route path="dashboard" element={<DebtDashboard />} />
        
        {/* System */}
        <Route path="system/audit" element={<AuditTrailPage />} />
        <Route path="notification-logs" element={<NotificationLogPage />} />
        <Route path="system/settings" element={<SettingsPage />} />

        {/* 404 Page */}
        <Route path="*" element={<div>Not found page</div>} />
      </Route>
    </Routes>
  );
}

export default App;
