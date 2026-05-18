import type { PaymentMethod, MethodUsage } from './types';

const METHODS_KEY = 'payment_methods';
const USAGE_KEY = 'payment_method_usage';

const defaultMethods: PaymentMethod[] = [
  { id: 1, name: 'Cash', description: 'Physical cash payment', icon: 'Banknote', isDefault: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: 'Bank Transfer', description: 'Direct bank transfer', icon: 'Building2', isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: 'Check', description: 'Check payment', icon: 'FileText', isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: 'Mobile Money', description: 'GCash, PayMaya, etc.', icon: 'Smartphone', isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let nextId = 5;

// Define these as function declarations (hoisted) so init can call them
export function getMethods(): PaymentMethod[] {
  const raw = localStorage.getItem(METHODS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getUsage(): MethodUsage[] {
  const raw = localStorage.getItem(USAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function init() {
  if (!localStorage.getItem(METHODS_KEY)) {
    localStorage.setItem(METHODS_KEY, JSON.stringify(defaultMethods));
    nextId = defaultMethods.length + 1;
  } else {
    const methods = getMethods();
    nextId = Math.max(...methods.map(m => m.id), 0) + 1;
  }
  if (!localStorage.getItem(USAGE_KEY)) {
    const usage: MethodUsage[] = defaultMethods.map(m => ({ methodId: m.id, transactionCount: Math.floor(Math.random() * 50) }));
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  }
}
init();

export function getMethodById(id: number): PaymentMethod | undefined {
  return getMethods().find(m => m.id === id);
}

export function createMethod(data: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): PaymentMethod {
  const methods = getMethods();
  const newMethod: PaymentMethod = { ...data, id: nextId++, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  methods.push(newMethod);
  localStorage.setItem(METHODS_KEY, JSON.stringify(methods));
  // Initialize usage
  const usage = getUsage();
  usage.push({ methodId: newMethod.id, transactionCount: 0 });
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return newMethod;
}

export function updateMethod(id: number, data: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>): PaymentMethod | null {
  const methods = getMethods();
  const index = methods.findIndex(m => m.id === id);
  if (index === -1) return null;
  methods[index] = { ...methods[index], ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(METHODS_KEY, JSON.stringify(methods));
  return methods[index];
}

export function deleteMethod(id: number): boolean {
  const methods = getMethods();
  const method = methods.find(m => m.id === id);
  if (method?.isDefault) throw new Error('Cannot delete default method');
  const filtered = methods.filter(m => m.id !== id);
  if (filtered.length === methods.length) return false;
  localStorage.setItem(METHODS_KEY, JSON.stringify(filtered));
  // Remove usage
  const usage = getUsage().filter(u => u.methodId !== id);
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return true;
}

export function setDefaultMethod(id: number): void {
  const methods = getMethods();
  const updated = methods.map(m => ({ ...m, isDefault: m.id === id, updatedAt: new Date().toISOString() }));
  localStorage.setItem(METHODS_KEY, JSON.stringify(updated));
}

export function getUsageForMethod(methodId: number): number {
  const usage = getUsage().find(u => u.methodId === methodId);
  return usage?.transactionCount || 0;
}