// src/renderer/pages/loans/applications/index.tsx
import React, { useState } from "react";
import { FileText, Plus, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import Button from "../../../components/UI/Button";
import useLoanApplications from "./hooks/useLoanApplications";
import ApplicationCard from "./components/ApplicationCard";
import ApplicationFormModal from "./components/ApplicationFormModal";
import ApplicationDetailModal from "./components/ApplicationDetailModal";
import ApprovalConfirmationModal from "./components/ApprovalConfirmationModal";
import { dialogs } from "../../../utils/dialogs";

const LoanApplicationsPage: React.FC = () => {
  const {
    pendingApps,
    approvedApps,
    rejectedApps,
    loading,
    refresh,
    approve,
    reject,
    activeTab,
    setActiveTab,
  } = useLoanApplications();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: "approve" | "reject"; app: any }>({ open: false, type: "approve", app: null });

  const openDetail = (app: any) => { setSelectedApp(app); setDetailOpen(true); };
  const handleApprove = (app: any) => { setConfirmModal({ open: true, type: "approve", app }); };
  const handleReject = (app: any) => { setConfirmModal({ open: true, type: "reject", app }); };
  const confirmAction = async (reason?: string) => {
    const { type, app } = confirmModal;
    try {
      if (type === "approve") {
        await approve(app.id);
        dialogs.success(`Application approved. Active loan created.`);
      } else {
        await reject(app.id, reason);
        dialogs.success(`Application rejected.`);
      }
      refresh();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setConfirmModal({ open: false, type: "approve", app: null });
      setDetailOpen(false);
    }
  };

  const currentApps = activeTab === "pending" ? pendingApps : activeTab === "approved" ? approvedApps : rejectedApps;

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock, count: pendingApps.length, colorKey: "warning" },
    { id: "approved", label: "Approved", icon: CheckCircle, count: approvedApps.length, colorKey: "success" },
    { id: "rejected", label: "Rejected", icon: XCircle, count: rejectedApps.length, colorKey: "danger" },
  ];

  const getTabStyle = (tabId: string) => {
    if (activeTab !== tabId) return { color: "var(--text-secondary)", borderColor: "transparent" };
    switch (tabId) {
      case "pending": return { color: "var(--warning-color)", borderColor: "var(--warning-color)" };
      case "approved": return { color: "var(--success-color)", borderColor: "var(--success-color)" };
      case "rejected": return { color: "var(--danger-color)", borderColor: "var(--danger-color)" };
      default: return { color: "var(--text-primary)", borderColor: "var(--primary-color)" };
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2"><FileText className="w-6 h-6" style={{ color: "var(--primary-color)" }} /><h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Loan Applications</h1></div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            <Button onClick={() => setFormOpen(true)} variant="success" icon={Plus}>New Application</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4" style={{ borderColor: "var(--border-color)" }}>
          {tabs.map(tab => {
            const style = getTabStyle(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="px-4 py-2 text-sm font-medium transition-colors border-b-2"
                style={{ color: style.color, borderBottomColor: style.borderColor }}
              >
                <div className="flex items-center gap-2"><tab.icon className="w-4 h-4" />{tab.label} <span className="ml-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "var(--card-secondary-bg)", color: "var(--text-secondary)" }}>{tab.count}</span></div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>
        ) : currentApps.length === 0 ? (
          <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No {activeTab} applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentApps.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onView={openDetail}
                onApprove={handleApprove}
                onReject={handleReject}
                showActions={app.status === "pending"}
              />
            ))}
          </div>
        )}
      </div>

      <ApplicationFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={refresh} />
      <ApplicationDetailModal isOpen={detailOpen} application={selectedApp} onClose={() => setDetailOpen(false)} onApprove={() => handleApprove(selectedApp)} onReject={() => handleReject(selectedApp)} />
      <ApprovalConfirmationModal isOpen={confirmModal.open} application={confirmModal.app} type={confirmModal.type} onClose={() => setConfirmModal({ open: false, type: "approve", app: null })} onConfirm={confirmAction} />
    </div>
  );
};

export default LoanApplicationsPage;