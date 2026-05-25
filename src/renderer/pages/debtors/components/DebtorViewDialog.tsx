// src/renderer/pages/debtors/components/DebtorViewDialog.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { 
  User, Mail, Phone, MapPin, FileText, DollarSign,
  CreditCard, Receipt, FileSignature
} from "lucide-react";
import borrowersAPI from "../../../api/core/borrower";
import debtsAPI from "../../../api/core/debt";
import type { Borrower } from "../../../api/core/borrower";
import type { Debt } from "../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import type { LoanAgreement } from "../../../api/core/loan_agreement";
import type { PaymentTransaction } from "../../../api/core/payment_transaction";
import loanAgreementsAPI from "../../../api/core/loan_agreement";
import paymentsAPI from "../../../api/core/payment_transaction";

interface DebtorViewDialogProps {
  debtorId: number | null;
  isOpen: boolean;
  editable?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

type TabType = "details" | "debts" | "agreements" | "payments";

const DebtorViewDialog: React.FC<DebtorViewDialogProps> = ({ 
  debtorId, editable, isOpen, onClose, onEdit 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [debtor, setDebtor] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Additional data states
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [debtsError, setDebtsError] = useState<string | null>(null);
  
  const [agreements, setAgreements] = useState<LoanAgreement[]>([]);
  const [agreementsLoading, setAgreementsLoading] = useState(false);
  const [agreementsError, setAgreementsError] = useState<string | null>(null);
  
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  
  // Summary stats
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  
  // Track if data has been fetched for this debtor (to avoid repeated fetches)
  const fetchedRef = useRef(false);
  
  // Helper to fetch borrower details
  const fetchBorrower = useCallback(async () => {
    if (!debtorId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await borrowersAPI.getById(debtorId);
      if (response.status) {
        setDebtor(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load debtor details");
      setDebtor(null);
    } finally {
      setLoading(false);
    }
  }, [debtorId]);
  
  // Fetch debts for this debtor
  const fetchDebts = useCallback(async () => {
    if (!debtorId) return;
    setDebtsLoading(true);
    setDebtsError(null);
    try {
      const response = await debtsAPI.getAll({ borrowerId: debtorId, limit: 100, includeDeleted: false });
      if (response.status) {
        const debtsList = response.data.data;
        setDebts(debtsList);
        const total = debtsList.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);
        setTotalOutstanding(total);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setDebtsError(err.message || "Failed to load debts");
      setDebts([]);
    } finally {
      setDebtsLoading(false);
    }
  }, [debtorId]);
  
  const fetchAgreements = useCallback(async () => {
    if (!debtorId) return;
    setAgreementsLoading(true);
    setAgreementsError(null);
    try {
      const response = await loanAgreementsAPI.getAll({ borrowerId: debtorId, limit: 100, includeDeleted: false });
      if (response.status) {
        setAgreements(response.data.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setAgreementsError(err.message || "Failed to load agreements");
      setAgreements([]);
    } finally {
      setAgreementsLoading(false);
    }
  }, [debtorId]);
  
  const fetchPayments = useCallback(async () => {
    if (!debtorId) return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const response = await paymentsAPI.getAll({ borrowerId: debtorId, limit: 100, includeDeleted: false });
      if (response.status) {
        setPayments(response.data.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setPaymentsError(err.message || "Failed to load payments");
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [debtorId]);
  
  // Load all data when modal opens or debtorId changes
  useEffect(() => {
    if (isOpen && debtorId) {
      // Reset fetch flag for new debtor
      fetchedRef.current = false;
      // Clear previous data
      setDebts([]);
      setAgreements([]);
      setPayments([]);
      setTotalOutstanding(0);
      // Fetch all in parallel
      fetchBorrower();
      fetchDebts();
      fetchAgreements();
      fetchPayments();
      fetchedRef.current = true;
    } else if (!isOpen) {
      // Reset everything when modal closes
      setDebtor(null);
      setError(null);
      setDebts([]);
      setDebtsLoading(false);
      setDebtsError(null);
      setAgreements([]);
      setAgreementsLoading(false);
      setAgreementsError(null);
      setPayments([]);
      setPaymentsLoading(false);
      setPaymentsError(null);
      setActiveTab("details");
      fetchedRef.current = false;
    }
  }, [debtorId, isOpen, fetchBorrower, fetchDebts, fetchAgreements, fetchPayments]);
  
  // Skeleton components
  const SkeletonRow: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="flex-1">
            <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
  
  const SkeletonTableRow: React.FC = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
    </tr>
  );
  
  // Render functions for each tab
  const renderDetailsTab = () => {
    if (loading) return <SkeletonRow count={5} />;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
    if (!debtor) return <div className="text-center py-4 text-[var(--text-tertiary)]">No debtor data.</div>;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-16 h-16 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--primary-color)]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{debtor.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">ID: {debtor.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Phone className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Contact</p>
              <p className="font-medium">{debtor.contact || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Mail className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Email</p>
              <p className="font-medium">{debtor.email || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)] md:col-span-2">
            <MapPin className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Address</p>
              <p className="font-medium">{debtor.address || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <DollarSign className="w-5 h-5 text-[var(--debt-high)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Outstanding Debt</p>
              <p className="font-bold text-lg" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <FileText className="w-5 h-5 text-[var(--accent-amber)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Status</p>
              <p className="font-medium">
                {debtor.deletedAt ? (
                  <span className="text-red-500">Deleted</span>
                ) : (
                  <span className="text-green-500">Active</span>
                )}
              </p>
            </div>
          </div>
        </div>
        {debtor.notes && (
          <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Notes</p>
            <p className="whitespace-pre-wrap">{debtor.notes}</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderDebtsTab = () => {
    if (debtsLoading) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-left">Due Date</th></tr>
            </thead>
            <tbody><SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow /></tbody>
          </table>
        </div>
      );
    }
    if (debtsError) return <div className="text-red-500 text-center py-4">{debtsError}</div>;
    if (debts.length === 0) return <div className="text-center py-8 text-[var(--text-tertiary)]">No debts found for this debtor.</div>;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[var(--card-secondary-bg)]">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Total Amount</th>
              <th className="px-3 py-2 text-right">Remaining</th>
              <th className="px-3 py-2 text-left">Due Date</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {debts.map(debt => (
              <tr key={debt.id} className="border-b border-[var(--border-color)]">
                <td className="px-3 py-2 font-medium">{debt.name}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(debt.totalAmount)}</td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--debt-high)" }}>{formatCurrency(debt.remainingAmount)}</td>
                <td className="px-3 py-2">{formatDate(debt.dueDate)}</td>
                <td className="px-3 py-2 capitalize">{debt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderAgreementsTab = () => {
    if (agreementsLoading) return <div className="animate-pulse space-y-2"><div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div><div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div></div>;
    if (agreementsError) return <div className="text-red-500 text-center py-4">{agreementsError}</div>;
    if (agreements.length === 0) return <div className="text-center py-8 text-[var(--text-tertiary)]">No loan agreements found.</div>;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[var(--card-secondary-bg)]">
            <tr>
              <th className="px-3 py-2 text-left">Lender</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Signed By</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map(ag => (
              <tr key={ag.id} className="border-b border-[var(--border-color)]">
                <td className="px-3 py-2">{ag.lenderName || "—"}</td>
                <td className="px-3 py-2">{ag.agreementDate ? formatDate(ag.agreementDate) : "—"}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${ag.status === "signed" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}>{ag.status}</span></td>
                <td className="px-3 py-2">{ag.signedBy || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderPaymentsTab = () => {
    if (paymentsLoading) return <div className="animate-pulse space-y-2"><div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div><div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div></div>;
    if (paymentsError) return <div className="text-red-500 text-center py-4">{paymentsError}</div>;
    if (payments.length === 0) return <div className="text-center py-8 text-[var(--text-tertiary)]">No payment records found.</div>;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[var(--card-secondary-bg)]">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Debt</th>
              <th className="px-3 py-2 text-left">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-[var(--border-color)]">
                <td className="px-3 py-2">{formatDate(p.paymentDate)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(p.amount)}</td>
                <td className="px-3 py-2">{p.debt?.name || "—"}</td>
                <td className="px-3 py-2">{p.reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debtor Profile: ${debtor ? debtor.name : 'Loading...'}`} size="lg">
      {/* Tabs */}
      <div className="flex border-b mb-4" style={{ borderColor: "var(--border-color)" }}>
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "details" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "debts" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Debts ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab("agreements")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "agreements" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Agreements ({agreements.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "payments" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Payments ({payments.length})
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "debts" && renderDebtsTab()}
        {activeTab === "agreements" && renderAgreementsTab()}
        {activeTab === "payments" && renderPaymentsTab()}
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t mt-4" style={{ borderColor: "var(--border-color)" }}>
        {editable && debtor && !debtor.deletedAt && onEdit && (
          <Button variant="primary" onClick={onEdit}>Edit Debtor</Button>
        )}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default DebtorViewDialog;