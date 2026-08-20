// Types mirroring backend/inventory/models.py and serializers.py.
// DRF DecimalFields serialize as strings by default, so all decimal-backed
// fields below are typed `string` (parse with Number(...) before arithmetic).

export type UserRole = "admin" | "manager" | "staff";

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_main: boolean;
}

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  branch?: number | null;
  branch_name?: string | null;
  is_active?: boolean;
  date_joined?: string;
}

export interface Category {
  id: number;
  name: string;
  parent?: number | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  category?: number | null;
  category_name?: string | null;
  unit: string;
  hsn_code?: string;
  purchase_price: string;
  selling_price: string;
  gst_rate: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_low_stock: boolean;
  image?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchStock {
  id: number;
  branch: number;
  branch_name: string;
  product: number;
  product_name: string;
  quantity: string;
  reserved_quantity: string;
}

export type MovementType = "in" | "out" | "adjustment";

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  branch: number | null;
  movement_type: MovementType;
  quantity: string;
  unit_cost?: string | null;
  reference_type: string;
  reference_id: string;
  reference_note: string;
  created_by: number | null;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  created_at: string;
}

export type PurchaseStatus = "draft" | "received" | "partially_paid" | "paid" | "cancelled";

export interface PurchaseItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: string;
  purchase_price: string;
  gst_rate: string;
}

export interface Purchase {
  id: number;
  supplier: number;
  supplier_name: string;
  branch: number | null;
  invoice_number: string;
  invoice_file?: string | null;
  purchase_date: string;
  status: PurchaseStatus;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  created_by: number | null;
  created_at: string;
  items: PurchaseItem[];
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  outstanding_balance: string;
  loyalty_points: number;
  created_at: string;
}

export type PaymentMode = "cash" | "upi" | "card" | "credit" | "split";
export type SaleStatus = "draft" | "completed" | "cancelled";

export interface SaleItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  taxable_amount?: string;
  cgst_rate?: string;
  sgst_rate?: string;
  igst_rate?: string;
  cgst_amount?: string;
  sgst_amount?: string;
  igst_amount?: string;
  total_amount?: string;
}

export interface Payment {
  id?: number;
  mode: PaymentMode;
  amount: string;
  reference_number?: string;
  paid_at?: string;
}

export interface Sale {
  id: number;
  invoice_number: string | null;
  customer: number | null;
  customer_name: string | null;
  branch: number | null;
  status: SaleStatus;
  payment_mode: PaymentMode;
  subtotal: string;
  discount_percent: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  sale_date: string;
  created_by: number | null;
  items: SaleItem[];
  payments: Payment[];
}

export interface SaleReturnItem {
  id?: number;
  sale_item: number;
  quantity: string;
  refund_amount?: string;
}

export interface SaleReturn {
  id: number;
  sale: number;
  reason?: string;
  total_refund_amount: string;
  created_by: number | null;
  created_at: string;
  items: SaleReturnItem[];
}

export interface ShopProfile {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  logo?: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  tax_inclusive_pricing: boolean;
}

// -- Dashboard summary (DashboardSummaryView) ------------------------------

export interface DashboardPaymentBreakdown {
  payment_mode: PaymentMode;
  total: string | number;
}

export interface DashboardLowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: string;
  low_stock_threshold: string;
}

export interface DashboardTopProduct {
  product__id: number;
  product__name: string;
  quantity_sold: string | number;
  revenue: string | number;
}

export interface DashboardRecentSale {
  id: number;
  invoice_number: string | null;
  customer: string;
  total_amount: string;
  sale_date: string;
}

export interface DashboardSummary {
  today: {
    total_sales: string | number;
    sales_count: number;
    payment_breakdown: DashboardPaymentBreakdown[];
  };
  month: {
    total_sales: string | number;
    sales_count: number;
  };
  low_stock_products: DashboardLowStockProduct[];
  top_products: DashboardTopProduct[];
  recent_sales: DashboardRecentSale[];
}

// -- Generic API helpers ----------------------------------------------------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
