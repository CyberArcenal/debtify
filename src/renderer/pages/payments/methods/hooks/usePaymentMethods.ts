import { useState, useEffect, useCallback } from 'react';
import { dialogs } from '../../../../utils/dialogs';
import type { PaymentMethod } from '../types';
import { createMethod, deleteMethod, getMethods, getUsageForMethod, setDefaultMethod, updateMethod } from '../mockMethodService';

interface UsePaymentMethodsReturn {
  methods: PaymentMethod[];
  loading: boolean;
  refresh: () => void;
  create: (data: any) => Promise<void>;
  update: (id: number, data: any) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
  getUsageCount: (methodId: number) => number;
}

const usePaymentMethods = (): UsePaymentMethodsReturn => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMethods = useCallback(() => {
    setLoading(true);
    try {
      const data = getMethods();
      setMethods(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMethods(); }, [loadMethods]);

  const create = async (data: any) => {
    try {
      createMethod(data);
      loadMethods();
      dialogs.success('Payment method created');
    } catch (err: any) { dialogs.error(err.message); }
  };

  const update = async (id: number, data: any) => {
    try {
      updateMethod(id, data);
      loadMethods();
      dialogs.success('Payment method updated');
    } catch (err: any) { dialogs.error(err.message); }
  };

  const remove = async (id: number) => {
    try {
      deleteMethod(id);
      loadMethods();
      dialogs.success('Payment method deleted');
    } catch (err: any) { dialogs.error(err.message); }
  };

  const setDefault = async (id: number) => {
    try {
      setDefaultMethod(id);
      loadMethods();
      dialogs.success('Default method updated');
    } catch (err: any) { dialogs.error(err.message); }
  };

  const getUsageCount = (methodId: number) => getUsageForMethod(methodId);

  return { methods, loading, refresh: loadMethods, create, update, remove, setDefault, getUsageCount };
};

export default usePaymentMethods;