export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  icon: string; // icon name from lucide-react or custom
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MethodUsage {
  methodId: number;
  transactionCount: number;
}