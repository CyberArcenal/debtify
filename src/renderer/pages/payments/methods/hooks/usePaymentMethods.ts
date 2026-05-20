// src/renderer/pages/payments/methods/hooks/usePaymentMethods.ts
import { useState, useEffect, useCallback } from 'react';
import { dialogs } from '../../../../utils/dialogs';
import type { PaymentMethod, PaymentMethodStats } from '../../../../api/core/payment_method';
import paymentMethodsAPI from '../../../../api/core/payment_method';

interface UsePaymentMethodsReturn {
  methods: PaymentMethod[];
  stats: Record<number, PaymentMethodStats>;
  loading: boolean;
  refresh: () => Promise<void>;
  create: (data: { name: string; description?: string; icon?: string; isDefault?: boolean }) => Promise<void>;
  update: (id: number, data: Partial<PaymentMethod>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
}

const usePaymentMethods = (): UsePaymentMethodsReturn => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<Record<number, PaymentMethodStats>>({});
  const [loading, setLoading] = useState(true);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentMethodsAPI.getAll();
      if (response.status) {
        setMethods(response.data);
        // Load stats for each method
        const statsMap: Record<number, PaymentMethodStats> = {};
        for (const method of response.data) {
          try {
            const statsRes = await paymentMethodsAPI.getStats(method.id);
            if (statsRes.status) {
              statsMap[method.id] = statsRes.data;
            }
          } catch (err) {
            console.error(`Failed to load stats for method ${method.id}:`, err);
          }
        }
        setStats(statsMap);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error(err);
      dialogs.error(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const create = async (data: { name: string; description?: string; icon?: string; isDefault?: boolean }) => {
    try {
      const response = await paymentMethodsAPI.create(data);
      if (response.status) {
        await loadMethods();
        dialogs.success('Payment method created');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const update = async (id: number, data: Partial<PaymentMethod>) => {
    try {
      const response = await paymentMethodsAPI.update(id, data);
      if (response.status) {
        await loadMethods();
        dialogs.success('Payment method updated');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const remove = async (id: number) => {
    try {
      const response = await paymentMethodsAPI.delete(id);
      if (response.status) {
        await loadMethods();
        dialogs.success('Payment method deleted');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const setDefault = async (id: number) => {
    try {
      const response = await paymentMethodsAPI.setDefault(id);
      if (response.status) {
        await loadMethods();
        dialogs.success('Default method updated');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const refresh = async () => {
    await loadMethods();
  };

  return {
    methods,
    stats,
    loading,
    refresh,
    create,
    update,
    remove,
    setDefault,
  };
};

export default usePaymentMethods;