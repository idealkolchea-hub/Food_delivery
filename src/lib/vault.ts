/**
 * Vault Reader Module — Agent A (Claude Code)
 *
 * Reads and parses all structured spec data from the BiteBlast Obsidian vault.
 * The vault is the single source of truth; this module never writes to it.
 *
 * Usage:
 *   import { loadVault, getScreensForRole, getRoleMeta } from '@/lib/vault';
 *   const vault = await loadVault();
 */

import fs from 'fs';
import path from 'path';

export const VAULT_PATH = process.env.VAULT_PATH || '/home/netwin/Desktop/demo 2';
const FOOD_DELIVERY = path.join(VAULT_PATH, 'raw/Food Delivery App');

// ─── Types ────────────────────────────────────────────────────────────

export type Role = 'customer' | 'partner' | 'agent' | 'admin';

export interface RoleMeta {
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
}

export interface Screen {
  id: number;
  title: string;
  filename: string;
  width: number;
  height: number;
}

export interface RoleScreen {
  filename: string;
  tab: string | null;
  label: string;
  order: number;
}

export interface RoleTab {
  key: string;
  label: string;
  icon: string;
}

export interface VaultData {
  roles: Record<Role, RoleMeta>;
  screens: Record<Role, Record<string, RoleScreen>>;
  tabs: Record<Role, RoleTab[]>;
  screenMap: Screen[];
  vaultPath: string;
}

// ─── Role Constants (mirrors source_flowConfig.js) ─────────────────

export const ROLES: Record<string, Role> = {
  CUSTOMER: 'customer',
  PARTNER: 'partner',
  AGENT: 'agent',
  ADMIN: 'admin',
};

export const ROLE_META: Record<Role, RoleMeta> = {
  customer: {
    label: 'Customer',
    subtitle: 'Order food, track deliveries',
    icon: '🍽️',
    color: '#8a0f0a',
    gradient: 'linear-gradient(135deg, #8a0f0a, #ac2a1f)',
  },
  partner: {
    label: 'Restaurant Partner',
    subtitle: 'Manage kitchen & orders',
    icon: '👨‍🍳',
    color: '#944b03',
    gradient: 'linear-gradient(135deg, #944b03, #c46b1a)',
  },
  agent: {
    label: 'Delivery Agent',
    subtitle: 'Pick up & deliver orders',
    icon: '🚴',
    color: '#1a6b47',
    gradient: 'linear-gradient(135deg, #1a6b47, #2d9b6a)',
  },
  admin: {
    label: 'Admin HQ',
    subtitle: 'Platform operations & analytics',
    icon: '🛡️',
    color: '#2c2c54',
    gradient: 'linear-gradient(135deg, #2c2c54, #474787)',
  },
};

export const CUSTOMER_TABS: RoleTab[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'orders', label: 'Orders', icon: 'receipt' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export const PARTNER_TABS: RoleTab[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { key: 'menu', label: 'Menu', icon: 'utensils' },
  { key: 'insights', label: 'Insights', icon: 'bar-chart-2' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export const AGENT_TABS: RoleTab[] = [
  { key: 'active', label: 'Active', icon: 'map-pin' },
  { key: 'earnings', label: 'Earnings', icon: 'indian-rupee' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export const ADMIN_TABS: RoleTab[] = [
  { key: 'overview', label: 'Overview', icon: 'gauge' },
  { key: 'entities', label: 'Entities', icon: 'building-2' },
  { key: 'operations', label: 'Ops', icon: 'shield' },
  { key: 'finance', label: 'Finance', icon: 'banknote' },
];

// ─── Customer Screens (27 screens) ─────────────────────────────────

export const CUSTOMER_SCREENS: Record<string, RoleScreen> = {
  auth_login:         { filename: 'BiteBlast_Login__Aligned__50.html', tab: null, label: 'Login', order: 0 },
  auth_otp:           { filename: 'BiteBlast_OTP__Aligned__15.html', tab: null, label: 'OTP Verify', order: 1 },
  auth_profile:       { filename: 'BiteBlast_Profile_Completion_73.html', tab: null, label: 'Profile Setup', order: 2 },
  home_guest:         { filename: 'BiteBlast_Home__Guest__47.html', tab: 'home', label: 'Home (Guest)', order: 3 },
  home_logged:        { filename: 'BiteBlast_Home__Logged_In__17.html', tab: 'home', label: 'Home', order: 4 },
  restaurant_detail:  { filename: 'Restaurant_Details_65.html', tab: 'home', label: 'Restaurant Details', order: 5 },
  kitchen_story:      { filename: 'Refined_Kitchen_Story_34.html', tab: 'home', label: 'Kitchen Story', order: 6 },
  spice_garden:       { filename: 'Spice_Garden_Details_49.html', tab: 'home', label: 'Spice Garden', order: 7 },
  offers:             { filename: 'Available_Offers_1.html', tab: 'home', label: 'Offers', order: 8 },
  cart:               { filename: 'Cart_Review___Adjust_55.html', tab: 'home', label: 'Cart', order: 9 },
  payment_select:     { filename: 'Payment_Selection__Updated_Logo__37.html', tab: 'home', label: 'Payment', order: 10 },
  checkout:           { filename: 'Finalized_Checkout___Bill_9.html', tab: 'home', label: 'Checkout', order: 11 },
  payment_failed:     { filename: 'Payment_Failed___Retry_66.html', tab: 'home', label: 'Payment Failed', order: 12 },
  order_confirm:      { filename: 'Updated_Order_Confirmation_44.html', tab: 'home', label: 'Order Confirmed', order: 13 },
  delivery_track:     { filename: 'Interactive_Delivery_Stage_Tracking_10.html', tab: 'home', label: 'Track Delivery', order: 14 },
  order_rejected:     { filename: 'Order_Rejected___Refunded_56.html', tab: 'home', label: 'Order Rejected', order: 15 },
  rate_experience:    { filename: 'Rate_Your_Experience_18.html', tab: 'home', label: 'Rate Experience', order: 16 },
  order_history:      { filename: 'Order_History_64.html', tab: 'orders', label: 'Order History', order: 17 },
  raise_ticket:       { filename: 'Raise_Support_Ticket_23.html', tab: 'orders', label: 'Raise Ticket', order: 18 },
  ticket_resolved:    { filename: 'Ticket_Status_Resolved_2.html', tab: 'orders', label: 'Ticket Status', order: 19 },
  report_issue:       { filename: 'Report_Delivery_Issue_63.html', tab: 'orders', label: 'Report Issue', order: 20 },
  wallet:             { filename: 'BiteBlast_Wallet_24.html', tab: 'wallet', label: 'Wallet', order: 21 },
  wallet_topup:       { filename: 'Wallet_Top_Up_57.html', tab: 'wallet', label: 'Top Up', order: 22 },
  profile:            { filename: 'Profile__Functional_Nav__69.html', tab: 'profile', label: 'Profile', order: 23 },
  addresses:          { filename: 'Manage_Addresses_77.html', tab: 'profile', label: 'Addresses', order: 24 },
  notifications:      { filename: 'Notification_Preferences_43.html', tab: 'profile', label: 'Notifications', order: 25 },
  delivery_feedback:  { filename: 'Refined_Delivery_Feedback_20.html', tab: 'profile', label: 'Delivery Feedback', order: 26 },
};

// ─── Partner Screens (21 screens) ───────────────────────────────────

export const PARTNER_SCREENS: Record<string, RoleScreen> = {
  partner_welcome:    { filename: 'Welcome_Hub__No_Nav__35.html', tab: null, label: 'Welcome', order: 0 },
  partner_dashboard: { filename: 'Partner_Dashboard__Order_Details_Added__61.html', tab: 'dashboard', label: 'Dashboard', order: 1 },
  partner_app:        { filename: 'BiteBlast_Partner_App_13.html', tab: 'dashboard', label: 'Partner App', order: 2 },
  partner_flow:       { filename: 'BiteBlast_Partner_App_Flow_60.html', tab: 'dashboard', label: 'Order Flow', order: 3 },
  partner_ecosystem: { filename: 'BiteBlast_Partner_Ecosystem_16.html', tab: 'dashboard', label: 'Ecosystem', order: 4 },
  packing_checklist:  { filename: 'Packing_Checklist_Modal_12.html', tab: 'dashboard', label: 'Packing Checklist', order: 5 },
  kitchen_mgmt:       { filename: 'BiteBlast_Partner_Kitchen_Management_75.html', tab: 'dashboard', label: 'Kitchen Mgmt', order: 6 },
  kitchen_restrict:   { filename: 'Manual_Kitchen_Restrictor_0.html', tab: 'dashboard', label: 'Kitchen Restrictor', order: 7 },
  menu_hub:           { filename: 'Functional_Menu_Hub_30.html', tab: 'menu', label: 'Menu Hub', order: 8 },
  menu_item_detail:   { filename: 'Item_Management_Detail_6.html', tab: 'menu', label: 'Item Detail', order: 9 },
  menu_edit_item:     { filename: 'Edit_Menu_Item__Nav_Updated__19.html', tab: 'menu', label: 'Edit Item', order: 10 },
  menu_add_item:      { filename: 'Add_Item__Operational_Focus__39.html', tab: 'menu', label: 'Add Item', order: 11 },
  menu_bulk:          { filename: 'Bulk_Menu_Manager_33.html', tab: 'menu', label: 'Bulk Manager', order: 12 },
  inventory_flags:     { filename: 'Inventory_Flags__Updated_Nav__46.html', tab: 'menu', label: 'Inventory Flags', order: 13 },
  partner_insights:   { filename: 'Partner_Insights__Nav_Adjusted__28.html', tab: 'insights', label: 'Insights', order: 14 },
  partner_analytics: { filename: 'Refined_Partner_Analytics_38.html', tab: 'insights', label: 'Analytics', order: 15 },
  partner_settings:   { filename: 'Partner_Settings_Hub__System_Sync__31.html', tab: 'settings', label: 'Settings', order: 16 },
  partner_payouts:    { filename: 'Payouts__Updated_Nav__70.html', tab: 'settings', label: 'Payouts', order: 17 },
  payout_methods:     { filename: 'Payout_Methods_67.html', tab: 'settings', label: 'Payout Methods', order: 18 },
  operating_hours:    { filename: 'Operating_Hours__Refined_Nav__72.html', tab: 'settings', label: 'Operating Hours', order: 19 },
  dispute_center:     { filename: 'R_09_Dispute_Center_7.html', tab: 'settings', label: 'Dispute Center', order: 20 },
};

// ─── Agent Screens (11 screens) ─────────────────────────────────────

export const AGENT_SCREENS: Record<string, RoleScreen> = {
  new_order_offer:   { filename: 'New_Order_Offer__Focus_View__58.html', tab: 'active', label: 'New Order', order: 0 },
  pickup_map:         { filename: 'Pickup_Run__Map_Focus_78.html', tab: 'active', label: 'Pickup Map', order: 1 },
  pickup_confirm:     { filename: 'Pickup_Confirmation__Checklist__76.html', tab: 'active', label: 'Pickup Confirm', order: 2 },
  delivery_nav:       { filename: 'Delivery_Navigation__Map_Fixed__29.html', tab: 'active', label: 'Delivery Nav', order: 3 },
  delivery_otp:       { filename: 'Delivery_Confirmation__OTP__40.html', tab: 'active', label: 'Deliver (OTP)', order: 4 },
  delivery_cod:       { filename: 'Delivery_Confirmation__COD__62.html', tab: 'active', label: 'Deliver (COD)', order: 5 },
  secure_handover:     { filename: 'Secure_Handover__Prepaid__59.html', tab: 'active', label: 'Secure Handover', order: 6 },
  availability:       { filename: 'Availability__Session_Summary_79.html', tab: 'active', label: 'Availability', order: 7 },
  earnings:           { filename: 'Agent_Earnings___History_32.html', tab: 'earnings', label: 'Earnings', order: 8 },
  agent_profile:      { filename: 'Agent_Profile___History_48.html', tab: 'profile', label: 'Profile', order: 9 },
  agent_kyc_status:   { filename: 'Aligned_Agent_KYC_Status_3.html', tab: 'profile', label: 'KYC Status', order: 10 },
};

// ─── Admin Screens (22 screens) ────────────────────────────────────

export const ADMIN_SCREENS: Record<string, RoleScreen> = {
  admin_dashboard:    { filename: 'Admin_Master_Dashboard_74.html', tab: 'overview', label: 'Dashboard', order: 0 },
  admin_desktop:      { filename: 'Admin_Master_Dashboard_42.html', tab: 'overview', label: 'Dashboard (Desktop)', order: 1 },
  live_heatmap:       { filename: 'Live_Heatmap___Modifiers_51.html', tab: 'overview', label: 'Live Heatmap', order: 2 },
  global_entities:    { filename: 'Global_Entity_Management_36.html', tab: 'entities', label: 'Entity Management', order: 3 },
  entity_mgmt_desk:   { filename: 'Global_User___Entity_Management_14.html', tab: 'entities', label: 'Users (Desktop)', order: 4 },
  customer_dir:       { filename: 'Global_Customer_Directory_54.html', tab: 'entities', label: 'Customer Directory', order: 5 },
  partner_detail:     { filename: 'Partner_Detail_Deep_Dive_41.html', tab: 'entities', label: 'Partner Detail', order: 6 },
  agent_workforce:    { filename: 'Agent_Workforce_Tracker_81.html', tab: 'entities', label: 'Agent Workforce', order: 7 },
  agent_kyc_queue:    { filename: 'Agent_KYC___Verification_Queue_22.html', tab: 'entities', label: 'Agent KYC Queue', order: 8 },
  onboarding_review:  { filename: 'Onboarding_Review__Mobile_Sync__8.html', tab: 'entities', label: 'Onboarding Review', order: 9 },
  team_members:       { filename: 'Manage_Team_Members_5.html', tab: 'entities', label: 'Team Members', order: 10 },
  security_login:     { filename: 'Security___Login_21.html', tab: 'entities', label: 'Security & Login', order: 11 },
  escalation:         { filename: 'Escalation___Triage_Center_11.html', tab: 'operations', label: 'Escalation Center', order: 12 },
  reassignment:       { filename: 'Manual_Reassignment_Console_25.html', tab: 'operations', label: 'Reassignment', order: 13 },
  agent_handoff:      { filename: 'R_07_Agent_Handoff_27.html', tab: 'operations', label: 'Agent Handoff', order: 14 },
  trust_score:        { filename: 'R_10_Trust_Score__Aligned__68.html', tab: 'operations', label: 'Trust Score', order: 15 },
  fraud_alerts:       { filename: 'R_11_Fraud_Alerts_80.html', tab: 'operations', label: 'Fraud Alerts', order: 16 },
  promotions:         { filename: 'Promotion___Campaign_Engine_71.html', tab: 'operations', label: 'Promotions', order: 17 },
  pricing_queue:      { filename: 'Pricing_Approval_Queue_53.html', tab: 'operations', label: 'Pricing Queue', order: 18 },
  financial_master:   { filename: 'Financial_Master_4.html', tab: 'finance', label: 'Financial Master', order: 19 },
  payouts_settle:     { filename: 'Payouts___Settlement_Master_45.html', tab: 'finance', label: 'Payouts & Settlements', order: 20 },
  commission:         { filename: 'Commission___Penalty_Manager_26.html', tab: 'finance', label: 'Commission & Penalty', order: 21 },
};

// ─── All Screens by Role ─────────────────────────────────────────────

export const ALL_SCREENS: Record<Role, Record<string, RoleScreen>> = {
  customer: CUSTOMER_SCREENS,
  partner: PARTNER_SCREENS,
  agent: AGENT_SCREENS,
  admin: ADMIN_SCREENS,
};

export const ALL_TABS: Record<Role, RoleTab[]> = {
  customer: CUSTOMER_TABS,
  partner: PARTNER_TABS,
  agent: AGENT_TABS,
  admin: ADMIN_TABS,
};

// ─── Query Functions ────────────────────────────────────────────────

export function getRoleMeta(role: Role): RoleMeta {
  return ROLE_META[role];
}

export function getScreensForRole(role: Role): Record<string, RoleScreen> {
  return ALL_SCREENS[role];
}

export function getTabsForRole(role: Role): RoleTab[] {
  return ALL_TABS[role];
}

export function getScreenById(role: Role, screenKey: string): RoleScreen | undefined {
  return ALL_SCREENS[role]?.[screenKey];
}

export function getScreensByTab(role: Role, tab: string): RoleScreen[] {
  const screens = ALL_SCREENS[role] || {};
  return Object.entries(screens)
    .filter(([, s]) => s.tab === tab)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, s]) => ({ key, ...s })) as any;
}

export function getAuthScreens(role: Role): RoleScreen[] {
  const screens = ALL_SCREENS[role] || {};
  return Object.entries(screens)
    .filter(([, s]) => s.tab === null)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, s]) => ({ key, ...s })) as any;
}

// ─── Vault Loader ───────────────────────────────────────────────────

export async function loadVault(): Promise<VaultData> {
  const screenMapPath = path.join(FOOD_DELIVERY, 'source_screenMap.json');
  let screenMap: Screen[] = [];

  if (fs.existsSync(screenMapPath)) {
    const raw = fs.readFileSync(screenMapPath, 'utf-8');
    try {
      screenMap = JSON.parse(raw);
    } catch {
      console.warn('[vault] Could not parse source_screenMap.json');
    }
  }

  return {
    roles: ROLE_META,
    screens: ALL_SCREENS,
    tabs: ALL_TABS,
    screenMap,
    vaultPath: VAULT_PATH,
  };
}

// ─── Route Generation ───────────────────────────────────────────────

/**
 * Converts a screen key (e.g. 'auth_login') to a Next.js route segment
 * e.g. 'auth_login' → 'auth-login'
 */
export function screenKeyToRoute(screenKey: string): string {
  return screenKey.replace(/_/g, '-');
}

/**
 * Gets the Next.js route path for a screen
 * e.g. { role: 'customer', screenKey: 'auth_login' } → '/customer/auth-login'
 */
export function getRoutePath(role: Role, screenKey: string): string {
  return `/${role}/${screenKeyToRoute(screenKey)}`;
}

// ─── Stats ──────────────────────────────────────────────────────────

export function getVaultStats() {
  return {
    totalScreens: Object.values(ALL_SCREENS).reduce((sum, s) => sum + Object.keys(s).length, 0),
    byRole: {
      customer: Object.keys(CUSTOMER_SCREENS).length,
      partner: Object.keys(PARTNER_SCREENS).length,
      agent: Object.keys(AGENT_SCREENS).length,
      admin: Object.keys(ADMIN_SCREENS).length,
    },
    vaultPath: VAULT_PATH,
    hasScreenMap: fs.existsSync(path.join(FOOD_DELIVERY, 'source_screenMap.json')),
    hasFlowConfig: fs.existsSync(path.join(FOOD_DELIVERY, 'source_flowConfig.js')),
  };
}
