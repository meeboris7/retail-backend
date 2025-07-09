// app/types.ts
export interface Product {
  id: string;
  name: string;
  currentQuantity: number;
  reorderPoint: number;
  // Add more fields if your actual products have them
}

export interface Supplier {
  id: string;
  name: string;
  leadTimeDays: number; // For lead time calculation
  reliability: number; // e.g., 0.95 for 95% on-time delivery
  costFactor: number; // Multiplier for product cost
  email: string; // For sending emails
}

export interface PurchaseOrder {
  poId: string;
  productId: string;
  supplierId: string;
  quantityOrdered: number;
  orderDate: string; // ISO string
  expectedDeliveryDate: string; // ISO string
  status: 'pending' | 'shipped' | 'delivered' | 'delayed';
  // >>> ADD THIS NEW FIELD <<<
  actualDeliveryDate?: string; // ISO string, optional, for delivered POs
  chosenSupplierReason: string;
  // New fields for email status
  emailNotificationStatus?: 'sent' | 'failed' | 'not_attempted';
  emailErrorMessage?: string | null;
}

export interface ProductReorderSuggestion {
  product_id: string;
  product_name: string;
  current_quantity_on_hand: number;
  calculated_reorder_point: number;
  suggested_order_quantity: number;
  reason: string;
}

export interface PoStatusReport {
  po_id: string;
  product_id: string;
  supplier_id: string;
  current_status: 'pending' | 'shipped' | 'delivered' | 'delayed'; // 'delivered' should ideally not appear if filtered
  days_overdue: number | null;
  message: string;
}

export interface ReminderSentConfirmation {
  reminder_id: string;
  po_id: string;
  supplier_id: string;
  message: string;
  sent_date: string; // ISO string
  // New fields for email status
  email_notification_status?: 'sent' | 'failed' | 'not_attempted';
  email_error_message?: string | null;
}

// For shared mock data
export interface MockData {
    products: Product[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    // You might add sales history or other data here later
}