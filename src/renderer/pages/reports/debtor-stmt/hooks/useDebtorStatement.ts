// src/renderer/pages/reports/debtor-stmt/hooks/useDebtorStatement.ts
import { useState, useEffect, useCallback } from "react";
import borrowersAPI from "../../../../api/core/borrower";
import debtsAPI from "../../../../api/core/debt";
import type { StatementData } from "../types";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";

const useDebtorStatement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDebtors = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await borrowersAPI.getAll({ search: searchTerm, includeDeleted: false, limit: 20 });
      if (res.status) setSearchResults(res.data);
      else setSearchResults([]);
    } catch (err: any) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const delay = setTimeout(searchDebtors, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, searchDebtors]);

  const loadStatement = useCallback(async (debtor: any) => {
    setLoading(true);
    setError(null);
    try {
      const debtsRes = await debtsAPI.getAll({ borrowerId: debtor.id, limit: 1000 });
      if (!debtsRes.status) throw new Error(debtsRes.message);
      const debts = debtsRes.data;

      let allPayments: any[] = [];
      for (const debt of debts) {
        const paymentsRes = await paymentsAPI.getByDebtId(debt.id);
        allPayments = allPayments.concat(paymentsRes);
      }

      let allPenalties: any[] = [];
      for (const debt of debts) {
        const penaltiesRes = await penaltiesAPI.getByDebtId(debt.id);
        allPenalties = allPenalties.concat(penaltiesRes);
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

  const selectDebtor = (debtor: any) => {
    setSelectedDebtor(debtor);
    loadStatement(debtor);
  };

  const clearSelection = () => {
    setSelectedDebtor(null);
    setStatement(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searching,
    selectedDebtor,
    statement,
    loading,
    error,
    selectDebtor,
    clearSelection,
  };
};

export default useDebtorStatement;