/**
 * TypeScript Interfaces — Agent A (Claude Code)
 * Generated from entity definitions in deep-research-report(1).md
 * Core domain models for BiteBlast.
 */

// ─── Core Entities ────────────────────────────────────────────────

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  trustScore: number; // 0-100
  addresses: Address[];
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  fssaiLicense: string;
  address: Address;
  menu: MenuItem[];
  trustScore: number;
  walletBalance: number;
  operatingHours: OperatingHours;
  status: 'pending' | 'approved' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  aadhaarId?: string;
  panId?: string;
  drivingLicense?: string;
  trustScore: number;
  walletBalance: number;
  earnings: AgentEarnings;
  kycStatus: 'pending' | 'verified' | 'rejected';
  availabilityStatus: 'online' | 'offline' | 'busy';
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'ops_admin' | 'finance_admin' | 'support_admin';
  lastLogin: string;
}

// ─── Order & Delivery ────────────────────────────────────────────

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  agentId?: string;
  items: OrderItem[];
  status: OrderStatus;
  deliveryAddress: Address;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryToken?: string; // In-app delivery token (Trust Kernel component)
  gpsTrail?: GpsPing[];
  createdAt: string;
  confirmedAt?: string;
  pickedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundAmount?: number;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup'
  | 'agent_assigned' | 'picked_up' | 'in_transit'
  | 'delivered' | 'cancelled' | 'refunded';

export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface DeliverySession {
  orderId: string;
  agentId: string;
  status: DeliveryStatus;
  acceptedAt: string;
  arrivedAtRestaurant?: string;
  pickedAt?: string;
  deliveredAt?: string;
  deliveryToken?: string;
  photoProofUrl?: string;
  codAmount?: number;
}

export type DeliveryStatus =
  | 'offered' | 'accepted' | 'navigating_to_restaurant'
  | 'arrived_at_restaurant' | 'picked_up'
  | 'navigating_to_customer' | 'delivered' | 'cancelled';

// ─── Support & Disputes ───────────────────────────────────────────

export interface SupportTicket {
  id: string;
  orderId?: string;
  customerId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: 'p0' | 'p1' | 'p2';
  status: TicketStatus;
  assignedTo?: string;
  evidence: EvidenceItem[];
  createdAt: string;
  resolvedAt?: string;
}

export type TicketCategory =
  | 'missing_item' | 'wrong_item' | 'food_quality'
  | 'delivery_delay' | 'agent_behavior' | 'payment_issue'
  | 'fraud_suspected' | 'other';

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';

export interface EvidenceItem {
  type: 'photo' | 'gps_log' | 'chat' | 'screenshot';
  url: string;
  description: string;
  timestamp: string;
}

// ─── Financial ────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  userId: string;
  userType: 'customer' | 'restaurant' | 'agent';
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  orderId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Payout {
  id: string;
  recipientId: string;
  recipientType: 'restaurant' | 'agent';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'clawed_back';
  bankRef?: string;
  createdAt: string;
  processedAt?: string;
}

// ─── Trust & Fraud ─────────────────────────────────────────────────

export interface TrustScore {
  userId: string;
  userType: 'customer' | 'restaurant' | 'agent';
  score: number; // 0-100
  factors: TrustFactor[];
  lastUpdated: string;
}

export interface TrustFactor {
  type: 'on_time_delivery' | 'dispute_rate' | 'refund_abuse' | 'kyc_completion' | 'activity_level';
  weight: number;
  delta: number;
  description: string;
}

export interface FraudAlert {
  id: string;
  type: FraudType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  involvedUsers: string[];
  orderId?: string;
  evidence: string[];
  status: 'detected' | 'under_review' | 'confirmed' | 'dismissed' | 'actioned';
  createdAt: string;
  resolvedAt?: string;
}

export type FraudType =
  | 'double_dip' | 'emotional_scam' | 'otp_extraction'
  | 'marked_not_delivered' | 'cod_bypass' | 'fake_customer_care'
  | 'item_tampering' | 'gps_spoofing';

// ─── GPS & Location ────────────────────────────────────────────────

export interface GpsPing {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed?: number;
  accuracy?: number;
  source: 'gps' | 'network';
}

export interface Address {
  id?: string;
  label?: string;
  flatNo?: string;
  building?: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface OperatingHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

// ─── Menu ─────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
  isBestseller?: boolean;
  preparationTime?: number; // minutes
}

// ─── KYC ───────────────────────────────────────────────────────────

export interface KycDocument {
  type: 'aadhaar' | 'pan' | 'driving_license' | 'fssai' | 'gstin' | 'bank_account';
  number: string;
  imageFront?: string;
  imageBack?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface AgentKyc {
  agentId: string;
  aadhaar: KycDocument;
  pan: KycDocument;
  drivingLicense: KycDocument;
  bankAccount: KycDocument;
  selfie?: string;
  overallStatus: 'pending' | 'in_review' | 'verified' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

// ─── Agent Earnings ───────────────────────────────────────────────

export interface AgentEarnings {
  totalEarnings: number;
  pendingPayout: number;
  thisWeek: number;
  thisMonth: number;
  deliveryCount: number;
  averageRating: number;
  acceptanceRate: number;
  onTimeRate: number;
}

// ─── API Response Shapes ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
