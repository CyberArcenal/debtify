// src/renderer/pages/reports/debtor-stmt/hooks/useDebtorStatement.ts
import { useState, useCallback } from "react";
import borrowersAPI from "../../../../api/core/borrower";
import debtsAPI from "../../../../api/core/debt";
import type { StatementData } from "../types";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";

const useDebtorStatement = () => {
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatement = useCallback(async (debtor: any) => {
    setLoading(true);
    setError(null);
    try {
      const debtsRes = await debtsAPI.getAll({ borrowerId: debtor.id, limit: 1000 });
      if (!debtsRes.status) throw new Error(debtsRes.message);
      const debts = debtsRes.data.data; // ✅ access nested data array

      let allPayments: any[] = [];
      for (const debt of debts) {
        const payments = await paymentsAPI.getByDebtId(debt.id);
        allPayments = allPayments.concat(payments);
      }

      let allPenalties: any[] = [];
      for (const debt of debts) {
        const penalties = await penaltiesAPI.getByDebtId(debt.id);
        allPenalties = allPenalties.concat(penalties);
      }

      const totalBorrowed = debts.reduce((sum, d) => sum + d.totalAmount, 0);
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPenalties = allPenalties.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = totalBorrowed - totalPaid;

      setStatement({
        debtor: {
          id: debtor.id,
          name: debtor.name,
          contact: debtor.contact,
          email: debtor.email,
          address: debtor.address,
        },
        summary: { totalBorrowed, totalPaid, totalPenalties, outstanding },
        debts,
        payments: allPayments,
        penalties: allPenalties,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDebtor = useCallback((debtor: any) => {
    setSelectedDebtor(debtor);
    loadStatement(debtor);
  }, [loadStatement]);

  const clearSelection = useCallback(() => {
    setSelectedDebtor(null);
    setStatement(null);
  }, []);

  return {
    selectedDebtor,
    statement,
    loading,
    error,
    selectDebtor,
    clearSelection,
  };
};

export default useDebtorStatement;