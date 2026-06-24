export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in INR
  category: string;
  imageColor: string; // TailWind background color for standard beautiful iconography
  features: string[];
}

export interface Transaction {
  id: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'success' | 'failed';
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  isSimulated: boolean;
  notes?: string;
}

export interface ConfigInfo {
  success: boolean;
  hasKeys: boolean;
  keyId: string | null;
}
