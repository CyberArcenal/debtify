import React from "react";
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, FileSignature, Download } from "lucide-react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import { formatDate } from "../../../../utils/formatters";

interface LoanAgreementsTableProps {
  agreements: LoanAgreement[];
  onView: (agreement: LoanAgreement) => void;
  onEdit: (agreement: LoanAgreement) => void;
  onSign: (agreement: LoanAgreement) => void;
  onDelete: (agreement: LoanAgreement) => void;
  onDownload: (agreement: LoanAgreement) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSort: (key: string) => void;
}

const LoanAgreementsTable: React.FC<LoanAgreementsTableProps> = ({
  agreements,
  onView,
  onEdit,
  onSign,
  onDelete,
  onDownload,
  sortConfig,
  onSort,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "signed") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Signed</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Draft</span>;
  };

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("agreementDate")}>
              <div className="flex items-center gap-1">Date {getSortIcon("agreementDate")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("lenderName")}>
              <div className="flex items-center gap-1">Lender {getSortIcon("lenderName")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Debt / Borrower</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("status")}>
              <div className="flex items-center gap-1">Status {getSortIcon("status")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Signed By</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => (
            <tr key={agreement.id} className="hover:bg-[var(--card-hover-bg)] transition-colors border-b" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-4 py-3">{agreement.agreementDate ? formatDate(agreement.agreementDate) : "—"}</td>
              <td className="px-4 py-3">{agreement.lenderName || "—"}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{agreement.debt?.name || "—"}</div>
                <div className="text-xs text-[var(--text-secondary)]">{agreement.debt?.borrower?.name || ""}</div>
              </td>
              <td className="px-4 py-3">{getStatusBadge(agreement.status)}</td>
              <td className="px-4 py-3">
                {agreement.signedBy ? (
                  <div>
                    <div>{agreement.signedBy}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{agreement.signedAt ? formatDate(agreement.signedAt) : ""}</div>
                  </div>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onView(agreement)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" title="View">
                    <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                  </button>
                  {agreement.status === "draft" && (
                    <>
                      <button onClick={() => onEdit(agreement)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" title="Edit">
                        <Edit className="w-4 h-4 text-[var(--accent-orange)]" />
                      </button>
                      <button onClick={() => onSign(agreement)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" title="Sign">
                        <FileSignature className="w-4 h-4 text-[var(--success-color)]" />
                      </button>
                    </>
                  )}
                  {agreement.filePath && (
                    <button onClick={() => onDownload(agreement)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" title="Download">
                      <Download className="w-4 h-4 text-[var(--accent-purple)]" />
                    </button>
                  )}
                  <button onClick={() => onDelete(agreement)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LoanAgreementsTable;