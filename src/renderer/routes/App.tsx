import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../layouts/Layout";
import AuditTrailPage from "../pages/AuditTrail";
import NotificationLogPage from "../pages/NotificationLog";
import SettingsPage from "../pages/Settings";
import { useEffect, useState } from "react";
import { LicenseModal } from "../components/Shared/LicenseModal";
import { Help } from "../pages/help";
import DebtDashboard from "../pages/dashboard/components/DebtDashboard";
import DebtorDirectory from "../pages/debtors";
import CreditCheckPage from "../pages/debtors/credit-check";
import DebtorGroupsPage from "../pages/debtors/group";
import ActiveLoansPage from "../pages/loans/active";
import OverdueLoansPage from "../pages/loans/overdue";
import ClosedLoansPage from "../pages/loans/closed";
import LoanApplicationsPage from "../pages/loans/applications";
import PaymentSchedulePage from "../pages/payments/schedule";
import TransactionsPage from "../pages/payments/transactions";
import PaymentMethodsPage from "../pages/payments/methods";
import AgingAnalysisPage from "../pages/reports/aging";
import CollectionReportPage from "../pages/reports/collection";
import DebtorStatementPage from "../pages/reports/debtor-stmt";
import ExpectedPaymentsPage from "../pages/reports/expected";
import DevicesPage from "../pages/devices";
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
        <Route path="debtors/list" element={<DebtorDirectory />} />
        <Route path="debtors/credit-check" element={<CreditCheckPage />} />
        <Route path="debtors/group" element={<DebtorGroupsPage />} />
        <Route path="loans/active" element={<ActiveLoansPage />} />
        <Route path="loans/overdue" element={<OverdueLoansPage />} />
        <Route path="loans/closed" element={<ClosedLoansPage />} />
        <Route path="loans/applications" element={<LoanApplicationsPage />} />
        <Route path="payments/schedule" element={<PaymentSchedulePage />} />
        <Route path="payments/transactions" element={<TransactionsPage />} />
        <Route path="payments/methods" element={<PaymentMethodsPage />} />
        <Route path="reports/aging" element={<AgingAnalysisPage />} />
        <Route path="reports/collection" element={<CollectionReportPage />} />
        <Route path="reports/debtor-stmt" element={<DebtorStatementPage />} />
        <Route path="reports/expected" element={<ExpectedPaymentsPage />} />
        <Route path="devices" element={<DevicesPage />} />

        {/* 404 Page */}
        <Route path="*" element={<div>Not found page</div>} />
      </Route>
    </Routes>
  );
}

export default App;
