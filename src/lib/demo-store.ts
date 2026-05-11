import type {
  Address,
  Agent,
  AgentEarnings,
  Customer,
  DeliverySession,
  FraudAlert,
  MenuItem,
  OperatingHours,
  Order,
  OrderItem,
  PaymentMethod,
  Payout,
  Restaurant,
  SupportTicket,
  WalletTransaction,
} from '@/types';

export interface DemoRestaurant extends Restaurant {
  cuisine_types: string[];
  rating: string;
  delivery_time_min: number;
  min_order: number;
  is_active: boolean;
  image_url?: string;
  delivery_fee: number;
  avgPrepMinutes: number;
  completionRate: number;
}

export interface DemoAgent extends Agent {
  zone: string;
  vehicle: string;
  rating: string;
  completedTrips: number;
}

export interface DemoOrder extends Order {
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  etaMinutes: number;
}

interface DemoState {
  customers: Customer[];
  restaurants: DemoRestaurant[];
  agents: DemoAgent[];
  orders: DemoOrder[];
  tickets: SupportTicket[];
  walletTransactions: WalletTransaction[];
  deliverySessions: DeliverySession[];
  payouts: Payout[];
  fraudAlerts: FraudAlert[];
}

function ts(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function orderItem(
  menuItemId: string,
  name: string,
  quantity: number,
  unitPrice: number,
): OrderItem {
  return {
    menuItemId,
    name,
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,
  };
}

const operatingHours: OperatingHours = {
  monday: { open: '09:00', close: '23:00', closed: false },
  tuesday: { open: '09:00', close: '23:00', closed: false },
  wednesday: { open: '09:00', close: '23:00', closed: false },
  thursday: { open: '09:00', close: '23:00', closed: false },
  friday: { open: '09:00', close: '23:30', closed: false },
  saturday: { open: '09:00', close: '23:30', closed: false },
  sunday: { open: '10:00', close: '22:30', closed: false },
};

const baseAddresses: Address[] = [
  {
    id: 'addr_home',
    label: 'Home',
    flatNo: '304',
    building: 'Skyline Residency',
    street: 'Lane 6',
    area: 'Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    latitude: 18.5362,
    longitude: 73.8939,
  },
  {
    id: 'addr_work',
    label: 'Work',
    flatNo: '12',
    building: 'Alpha Tech Park',
    street: 'Viman Nagar Road',
    area: 'Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    latitude: 18.5679,
    longitude: 73.9143,
  },
];

const menus: Record<string, MenuItem[]> = {
  seed_1: [
    { id: 'm1', restaurantId: 'seed_1', name: 'Chicken Biryani', description: 'Saffron basmati, slow-cooked chicken.', price: 299, category: 'Biryani', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 24 },
    { id: 'm2', restaurantId: 'seed_1', name: 'Paneer Tikka', description: 'Tandoor roasted paneer with mint dip.', price: 249, category: 'Starters', isAvailable: true, isVeg: true, isBestseller: true, preparationTime: 18 },
    { id: 'm3', restaurantId: 'seed_1', name: 'Dal Makhani', description: 'Slow-simmered black lentils and cream.', price: 199, category: 'Main Course', isAvailable: true, isVeg: true, preparationTime: 16 },
    { id: 'm4', restaurantId: 'seed_1', name: 'Butter Naan', description: 'Charred tandoor bread finished with butter.', price: 49, category: 'Breads', isAvailable: true, isVeg: true, preparationTime: 8 },
  ],
  seed_2: [
    { id: 'p1', restaurantId: 'seed_2', name: 'Margherita', description: 'Fresh basil, mozzarella, San Marzano.', price: 249, category: 'Pizza', isAvailable: true, isVeg: true, isBestseller: true, preparationTime: 15 },
    { id: 'p2', restaurantId: 'seed_2', name: 'Pepperoni Feast', description: 'Double pepperoni, smoked cheese blend.', price: 349, category: 'Pizza', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 18 },
    { id: 'p3', restaurantId: 'seed_2', name: 'Garlic Bread', description: 'Roasted garlic and herb butter.', price: 129, category: 'Sides', isAvailable: true, isVeg: true, preparationTime: 9 },
  ],
  seed_3: [
    { id: 'b1', restaurantId: 'seed_3', name: 'Classic Smash', description: 'Double patty, cheddar, pickles.', price: 229, category: 'Burgers', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 14 },
    { id: 'b2', restaurantId: 'seed_3', name: 'Veggie Stack', description: 'Crispy veggie patty and herb mayo.', price: 199, category: 'Burgers', isAvailable: true, isVeg: true, preparationTime: 14 },
    { id: 'b3', restaurantId: 'seed_3', name: 'Loaded Fries', description: 'Cheese sauce, jalapenos, crisp fries.', price: 129, category: 'Sides', isAvailable: true, isVeg: true, preparationTime: 10 },
  ],
  seed_4: [
    { id: 's1', restaurantId: 'seed_4', name: 'Rainbow Roll', description: 'California roll with assorted sashimi.', price: 349, category: 'Rolls', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 17 },
    { id: 's2', restaurantId: 'seed_4', name: 'Edamame', description: 'Steamed soy beans and sea salt.', price: 99, category: 'Starters', isAvailable: true, isVeg: true, preparationTime: 6 },
    { id: 's3', restaurantId: 'seed_4', name: 'Miso Soup', description: 'White miso, tofu, wakame.', price: 79, category: 'Soup', isAvailable: true, isVeg: true, preparationTime: 6 },
  ],
  seed_5: [
    { id: 'bb1', restaurantId: 'seed_5', name: 'Hyderabadi Chicken Biryani', description: 'Dum-cooked with saffron and mint.', price: 279, category: 'Biryani', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 20 },
    { id: 'bb2', restaurantId: 'seed_5', name: 'Chicken 65', description: 'Spicy fried chicken with curry leaves.', price: 229, category: 'Starters', isAvailable: true, isVeg: false, isBestseller: true, preparationTime: 12 },
    { id: 'bb3', restaurantId: 'seed_5', name: 'Sheer Khurma', description: 'Sweet vermicelli with dates and nuts.', price: 99, category: 'Desserts', isAvailable: true, isVeg: true, isBestseller: false, preparationTime: 8 },
  ],
};

const customers: Customer[] = [
  {
    id: 'cust_demo_1',
    phone: '9876543210',
    name: 'Aarav Mehta',
    email: 'aarav@biteblast.app',
    trustScore: 92,
    addresses: baseAddresses,
    walletBalance: 420,
    createdAt: ts(-43_200),
    updatedAt: ts(-35),
  },
];

const restaurants: DemoRestaurant[] = [
  {
    id: 'seed_1',
    name: 'Spice Garden',
    ownerName: 'Karan Sethi',
    phone: '9812345678',
    email: 'ops@spicegarden.in',
    fssaiLicense: '11522032000122',
    address: baseAddresses[0],
    menu: menus.seed_1,
    trustScore: 94,
    walletBalance: 18240,
    operatingHours,
    status: 'approved',
    createdAt: ts(-80_000),
    updatedAt: ts(-22),
    cuisine_types: ['North Indian', 'Biryani', 'Mughlai'],
    rating: '4.3',
    delivery_time_min: 35,
    min_order: 200,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=300&fit=crop',
    delivery_fee: 20,
    avgPrepMinutes: 19,
    completionRate: 98,
  },
  {
    id: 'seed_2',
    name: 'The Pizza Forge',
    ownerName: 'Sara Dsouza',
    phone: '9823001234',
    email: 'hello@pizzaforge.in',
    fssaiLicense: '11522032000123',
    address: baseAddresses[1],
    menu: menus.seed_2,
    trustScore: 95,
    walletBalance: 22640,
    operatingHours,
    status: 'approved',
    createdAt: ts(-70_000),
    updatedAt: ts(-15),
    cuisine_types: ['Italian', 'Pizza', 'Pasta'],
    rating: '4.6',
    delivery_time_min: 28,
    min_order: 150,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28d10f96910?w=600&h=300&fit=crop',
    delivery_fee: 15,
    avgPrepMinutes: 16,
    completionRate: 99,
  },
  {
    id: 'seed_3',
    name: 'Burger Brigade',
    ownerName: 'Raghav Arora',
    phone: '9823401122',
    email: 'ops@burgerbrigade.in',
    fssaiLicense: '11522032000124',
    address: baseAddresses[1],
    menu: menus.seed_3,
    trustScore: 89,
    walletBalance: 15400,
    operatingHours,
    status: 'approved',
    createdAt: ts(-65_000),
    updatedAt: ts(-30),
    cuisine_types: ['American', 'Burgers', 'Fast Food'],
    rating: '4.1',
    delivery_time_min: 22,
    min_order: 100,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=300&fit=crop',
    delivery_fee: 15,
    avgPrepMinutes: 12,
    completionRate: 96,
  },
  {
    id: 'seed_4',
    name: 'Sushi Zen',
    ownerName: 'Mika Rao',
    phone: '9867004567',
    email: 'chef@sushizen.in',
    fssaiLicense: '11522032000125',
    address: baseAddresses[0],
    menu: menus.seed_4,
    trustScore: 97,
    walletBalance: 26500,
    operatingHours,
    status: 'approved',
    createdAt: ts(-60_000),
    updatedAt: ts(-55),
    cuisine_types: ['Japanese', 'Sushi', 'Asian'],
    rating: '4.7',
    delivery_time_min: 40,
    min_order: 300,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce73f870f1?w=600&h=300&fit=crop',
    delivery_fee: 25,
    avgPrepMinutes: 21,
    completionRate: 99,
  },
  {
    id: 'seed_5',
    name: 'Biryani Boulevard',
    ownerName: 'Nafisa Khan',
    phone: '9899121234',
    email: 'ops@biryaniblvd.in',
    fssaiLicense: '11522032000126',
    address: baseAddresses[0],
    menu: menus.seed_5,
    trustScore: 91,
    walletBalance: 19300,
    operatingHours,
    status: 'approved',
    createdAt: ts(-58_000),
    updatedAt: ts(-44),
    cuisine_types: ['Hyderabadi', 'Biryani', 'South Indian'],
    rating: '4.4',
    delivery_time_min: 38,
    min_order: 180,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=300&fit=crop',
    delivery_fee: 20,
    avgPrepMinutes: 18,
    completionRate: 97,
  },
];

function agentEarnings(overrides: Partial<AgentEarnings>): AgentEarnings {
  return {
    totalEarnings: 0,
    pendingPayout: 0,
    thisWeek: 0,
    thisMonth: 0,
    deliveryCount: 0,
    averageRating: 0,
    acceptanceRate: 0,
    onTimeRate: 0,
    ...overrides,
  };
}

const agents: DemoAgent[] = [
  {
    id: 'agent_demo_1',
    name: 'Rohan Patil',
    phone: '9001234567',
    email: 'rohan@biteblast.app',
    trustScore: 93,
    walletBalance: 1860,
    earnings: agentEarnings({
      totalEarnings: 68420,
      pendingPayout: 980,
      thisWeek: 4320,
      thisMonth: 16440,
      deliveryCount: 342,
      averageRating: 4.8,
      acceptanceRate: 94,
      onTimeRate: 96,
    }),
    kycStatus: 'verified',
    availabilityStatus: 'online',
    createdAt: ts(-50_000),
    updatedAt: ts(-12),
    zone: 'Koregaon Park',
    vehicle: 'Honda Activa',
    rating: '4.8',
    completedTrips: 342,
  },
  {
    id: 'agent_demo_2',
    name: 'Pooja Nair',
    phone: '9001234568',
    email: 'pooja@biteblast.app',
    trustScore: 91,
    walletBalance: 1320,
    earnings: agentEarnings({
      totalEarnings: 55210,
      pendingPayout: 740,
      thisWeek: 3980,
      thisMonth: 14890,
      deliveryCount: 281,
      averageRating: 4.7,
      acceptanceRate: 91,
      onTimeRate: 94,
    }),
    kycStatus: 'verified',
    availabilityStatus: 'online',
    createdAt: ts(-48_000),
    updatedAt: ts(-19),
    zone: 'Viman Nagar',
    vehicle: 'TVS Jupiter',
    rating: '4.7',
    completedTrips: 281,
  },
  {
    id: 'agent_demo_3',
    name: 'Imran Shaikh',
    phone: '9001234569',
    email: 'imran@biteblast.app',
    trustScore: 86,
    walletBalance: 980,
    earnings: agentEarnings({
      totalEarnings: 40110,
      pendingPayout: 420,
      thisWeek: 3020,
      thisMonth: 11200,
      deliveryCount: 207,
      averageRating: 4.5,
      acceptanceRate: 88,
      onTimeRate: 91,
    }),
    kycStatus: 'pending',
    availabilityStatus: 'offline',
    createdAt: ts(-42_000),
    updatedAt: ts(-31),
    zone: 'Hadapsar',
    vehicle: 'Bajaj Pulsar',
    rating: '4.5',
    completedTrips: 207,
  },
];

const orders: DemoOrder[] = [
  {
    id: 'BB7X42A',
    customerId: customers[0].id,
    restaurantId: 'seed_1',
    agentId: 'agent_demo_1',
    items: [orderItem('m1', 'Chicken Biryani', 1, 299), orderItem('m2', 'Paneer Tikka', 1, 249)],
    status: 'agent_assigned',
    deliveryAddress: baseAddresses[0],
    subtotal: 548,
    deliveryFee: 20,
    taxes: 27,
    total: 600,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    deliveryToken: '452901',
    createdAt: ts(-42),
    confirmedAt: ts(-38),
    restaurantName: 'Spice Garden',
    customerName: 'Aarav Mehta',
    customerPhone: '9876543210',
    etaMinutes: 18,
  },
  {
    id: 'BB5K11P',
    customerId: customers[0].id,
    restaurantId: 'seed_2',
    agentId: 'agent_demo_2',
    items: [orderItem('p2', 'Pepperoni Feast', 1, 349), orderItem('p3', 'Garlic Bread', 1, 129)],
    status: 'delivered',
    deliveryAddress: baseAddresses[1],
    subtotal: 478,
    deliveryFee: 15,
    taxes: 24,
    total: 522,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: ts(-1_440),
    confirmedAt: ts(-1_430),
    pickedAt: ts(-1_410),
    deliveredAt: ts(-1_385),
    restaurantName: 'The Pizza Forge',
    customerName: 'Aarav Mehta',
    customerPhone: '9876543210',
    etaMinutes: 0,
  },
  {
    id: 'BB9N82Q',
    customerId: 'cust_demo_2',
    restaurantId: 'seed_5',
    agentId: 'agent_demo_1',
    items: [orderItem('bb1', 'Hyderabadi Chicken Biryani', 2, 279)],
    status: 'preparing',
    deliveryAddress: baseAddresses[0],
    subtotal: 558,
    deliveryFee: 20,
    taxes: 28,
    total: 606,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    createdAt: ts(-16),
    confirmedAt: ts(-14),
    restaurantName: 'Biryani Boulevard',
    customerName: 'Nisha Rao',
    customerPhone: '9811112233',
    etaMinutes: 26,
  },
  {
    id: 'BB3H12Z',
    customerId: 'cust_demo_3',
    restaurantId: 'seed_3',
    items: [orderItem('b1', 'Classic Smash', 2, 229), orderItem('b3', 'Loaded Fries', 1, 129)],
    status: 'pending',
    deliveryAddress: baseAddresses[1],
    subtotal: 587,
    deliveryFee: 15,
    taxes: 29,
    total: 631,
    paymentMethod: 'wallet',
    paymentStatus: 'paid',
    createdAt: ts(-4),
    restaurantName: 'Burger Brigade',
    customerName: 'Kabir Shah',
    customerPhone: '9822223344',
    etaMinutes: 31,
  },
];

const tickets: SupportTicket[] = [
  {
    id: 'TKT_1001',
    orderId: 'BB5K11P',
    customerId: customers[0].id,
    category: 'delivery_delay',
    subject: 'Late rider handoff update',
    description: 'The rider arrived 18 minutes later than ETA.',
    priority: 'p1',
    status: 'resolved',
    assignedTo: 'support_admin_2',
    evidence: [],
    createdAt: ts(-1_300),
    resolvedAt: ts(-1_210),
  },
  {
    id: 'TKT_1002',
    orderId: 'BB7X42A',
    customerId: customers[0].id,
    category: 'missing_item',
    subject: 'Need confirmation on extra cutlery request',
    description: 'Customer asked if the restaurant packed disposable cutlery.',
    priority: 'p2',
    status: 'in_progress',
    assignedTo: 'support_admin_3',
    evidence: [],
    createdAt: ts(-18),
  },
  {
    id: 'TKT_1003',
    orderId: 'BB9N82Q',
    customerId: 'cust_demo_2',
    category: 'payment_issue',
    subject: 'COD exception requested',
    description: 'Customer asked to switch to wallet after dispatch.',
    priority: 'p1',
    status: 'open',
    evidence: [],
    createdAt: ts(-12),
  },
];

const walletTransactions: WalletTransaction[] = [
  { id: 'WT_001', userId: customers[0].id, userType: 'customer', type: 'credit', amount: 500, reason: 'Wallet top-up', balanceAfter: 500, createdAt: ts(-2_880) },
  { id: 'WT_002', userId: customers[0].id, userType: 'customer', type: 'debit', amount: 80, reason: 'Order payment split', orderId: 'BB5K11P', balanceAfter: 420, createdAt: ts(-1_440) },
  { id: 'WT_003', userId: 'seed_1', userType: 'restaurant', type: 'credit', amount: 548, reason: 'Order earnings', orderId: 'BB7X42A', balanceAfter: 18240, createdAt: ts(-38) },
  { id: 'WT_004', userId: 'agent_demo_1', userType: 'agent', type: 'credit', amount: 92, reason: 'Delivery payout', orderId: 'BB7X42A', balanceAfter: 1860, createdAt: ts(-15) },
  { id: 'WT_005', userId: 'agent_demo_2', userType: 'agent', type: 'credit', amount: 84, reason: 'Delivery payout', orderId: 'BB5K11P', balanceAfter: 1320, createdAt: ts(-1_385) },
];

const deliverySessions: DeliverySession[] = [
  {
    orderId: 'BB7X42A',
    agentId: 'agent_demo_1',
    status: 'navigating_to_restaurant',
    acceptedAt: ts(-36),
    deliveryToken: '452901',
    codAmount: 0,
  },
];

const payouts: Payout[] = [
  { id: 'PO_001', recipientId: 'seed_1', recipientType: 'restaurant', amount: 8420, status: 'processing', createdAt: ts(-180) },
  { id: 'PO_002', recipientId: 'agent_demo_1', recipientType: 'agent', amount: 980, status: 'pending', createdAt: ts(-95) },
  { id: 'PO_003', recipientId: 'seed_2', recipientType: 'restaurant', amount: 9610, status: 'completed', bankRef: 'UTR908172', createdAt: ts(-2_880), processedAt: ts(-2_760) },
];

const fraudAlerts: FraudAlert[] = [
  {
    id: 'FA_001',
    type: 'otp_extraction',
    severity: 'high',
    involvedUsers: ['cust_demo_9', 'agent_demo_3'],
    orderId: 'BB2R99K',
    evidence: ['Repeated OTP retry pattern', 'Call spoof complaint'],
    status: 'under_review',
    createdAt: ts(-22),
  },
  {
    id: 'FA_002',
    type: 'gps_spoofing',
    severity: 'medium',
    involvedUsers: ['agent_demo_2'],
    orderId: 'BB4D22M',
    evidence: ['Static route pin despite movement', '3 impossible jumps'],
    status: 'detected',
    createdAt: ts(-51),
  },
  {
    id: 'FA_003',
    type: 'double_dip',
    severity: 'critical',
    involvedUsers: ['cust_demo_7', 'seed_4'],
    orderId: 'BB8Q11W',
    evidence: ['Refund after photo proof accepted', 'Support repeat pattern'],
    status: 'confirmed',
    createdAt: ts(-180),
    resolvedAt: ts(-90),
  },
];

const state: DemoState = {
  customers,
  restaurants,
  agents,
  orders,
  tickets,
  walletTransactions,
  deliverySessions,
  payouts,
  fraudAlerts,
};

export function getDemoSnapshot(): DemoState {
  return state;
}

export function getDemoCustomer(customerId?: string): Customer | undefined {
  return state.customers.find((customer) =>
    customerId ? customer.id === customerId : true,
  );
}

export function getDemoCustomers(): Customer[] {
  return state.customers;
}

export function createDemoCustomer(input: Partial<Customer>): Customer {
  const customer: Customer = {
    id: input.id || makeId('cust'),
    phone: (input.phone || '').replace(/\D/g, ''),
    name: input.name || 'New Customer',
    email: input.email,
    trustScore: input.trustScore ?? 80,
    addresses: input.addresses || [],
    walletBalance: input.walletBalance ?? 0,
    createdAt: ts(),
    updatedAt: ts(),
  };
  state.customers.unshift(customer);
  return customer;
}

export function getDemoRestaurants(): DemoRestaurant[] {
  return state.restaurants;
}

export function getDemoRestaurant(restaurantId?: string): DemoRestaurant | undefined {
  return state.restaurants.find((restaurant) =>
    restaurantId ? restaurant.id === restaurantId : true,
  );
}

export function createDemoRestaurant(input: Partial<DemoRestaurant>): DemoRestaurant {
  const restaurant: DemoRestaurant = {
    id: input.id || makeId('rest'),
    name: input.name || 'New Kitchen',
    ownerName: input.ownerName || 'Owner',
    phone: (input.phone || '').replace(/\D/g, ''),
    email: input.email,
    fssaiLicense: input.fssaiLicense || 'PENDING_FSSAI',
    address: input.address || baseAddresses[0],
    menu: input.menu || [],
    trustScore: input.trustScore ?? 78,
    walletBalance: input.walletBalance ?? 0,
    operatingHours: input.operatingHours || operatingHours,
    status: input.status || 'pending',
    createdAt: ts(),
    updatedAt: ts(),
    cuisine_types: input.cuisine_types || ['Multi Cuisine'],
    rating: input.rating || '4.0',
    delivery_time_min: input.delivery_time_min ?? 32,
    min_order: input.min_order ?? 150,
    is_active: input.is_active ?? false,
    image_url: input.image_url,
    delivery_fee: input.delivery_fee ?? 20,
    avgPrepMinutes: input.avgPrepMinutes ?? 22,
    completionRate: input.completionRate ?? 95,
  };

  state.restaurants.unshift(restaurant);
  return restaurant;
}

export function getMenuItems(restaurantId?: string): MenuItem[] {
  if (!restaurantId) {
    return state.restaurants.flatMap((restaurant) => restaurant.menu);
  }

  return state.restaurants.find((restaurant) => restaurant.id === restaurantId)?.menu || [];
}

export function getDemoAgents(): DemoAgent[] {
  return state.agents;
}

export function getDemoAgent(agentId?: string): DemoAgent | undefined {
  return state.agents.find((agent) => (agentId ? agent.id === agentId : true));
}

export function getDemoDeliverySession(orderId: string): DeliverySession | undefined {
  return state.deliverySessions.find((session) => session.orderId === orderId);
}

export function setDemoAgentAvailability(
  agentId: string,
  availabilityStatus: DemoAgent['availabilityStatus'],
): DemoAgent | null {
  const agent = state.agents.find((entry) => entry.id === agentId);
  if (!agent) {
    return null;
  }

  agent.availabilityStatus = availabilityStatus;
  agent.updatedAt = ts();
  return agent;
}

export function getDemoOrders(filters?: {
  id?: string | null;
  customerId?: string | null;
  restaurantId?: string | null;
  agentId?: string | null;
  status?: string | null;
}): DemoOrder[] {
  return state.orders.filter((order) => {
    if (filters?.id && order.id !== filters.id) return false;
    if (filters?.customerId && order.customerId !== filters.customerId) return false;
    if (filters?.restaurantId && order.restaurantId !== filters.restaurantId) return false;
    if (filters?.agentId && order.agentId !== filters.agentId) return false;
    if (filters?.status && order.status !== filters.status) return false;
    return true;
  });
}

export function createDemoOrder(input: {
  customerId: string;
  restaurantId: string;
  items: Array<Partial<OrderItem>>;
  deliveryAddress: Address;
  paymentMethod?: PaymentMethod;
}): DemoOrder {
  const restaurant = getDemoRestaurant(input.restaurantId);
  const customer = getDemoCustomer(input.customerId);
  const preparedItems = input.items.map((item) => ({
    menuItemId: item.menuItemId || makeId('menu'),
    name: item.name || 'Custom item',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || item.totalPrice || 0,
    totalPrice: item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1),
    notes: item.notes,
  }));

  const subtotal = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = restaurant?.delivery_fee ?? 20;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;

  const order: DemoOrder = {
    id: `BB${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    customerId: input.customerId,
    restaurantId: input.restaurantId,
    items: preparedItems,
    status: 'confirmed',
    deliveryAddress: input.deliveryAddress,
    subtotal,
    deliveryFee,
    taxes,
    total,
    paymentMethod: input.paymentMethod || 'upi',
    paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'paid',
    createdAt: ts(),
    confirmedAt: ts(),
    restaurantName: restaurant?.name || 'Partner Kitchen',
    customerName: customer?.name || 'Demo Customer',
    customerPhone: customer?.phone || '9000000000',
    etaMinutes: restaurant?.delivery_time_min ?? 30,
  };

  state.orders.unshift(order);
  return order;
}

export function assignDemoDelivery(orderId: string): { order: DemoOrder; session: DeliverySession; agent: DemoAgent } | null {
  const order = state.orders.find((entry) => entry.id === orderId);
  const agent = state.agents.find((entry) => entry.availabilityStatus === 'online');

  if (!order || !agent) {
    return null;
  }

  return assignDemoDeliveryToAgent(orderId, agent.id);
}

export function assignDemoDeliveryToAgent(orderId: string, agentId: string): { order: DemoOrder; session: DeliverySession; agent: DemoAgent } | null {
  const order = state.orders.find((entry) => entry.id === orderId);
  const agent = state.agents.find((entry) => entry.id === agentId);

  if (!order || !agent) {
    return null;
  }

  order.agentId = agent.id;
  order.status = 'agent_assigned';
  order.deliveryToken = order.deliveryToken || String(Math.floor(100000 + Math.random() * 900000));
  agent.availabilityStatus = 'busy';
  agent.updatedAt = ts();

  const existing = state.deliverySessions.find((session) => session.orderId === orderId);
  if (existing) {
    existing.agentId = agent.id;
    existing.status = 'accepted';
    existing.acceptedAt = ts();
    existing.deliveryToken = order.deliveryToken;
    return { order, session: existing, agent };
  }

  const session: DeliverySession = {
    orderId,
    agentId: agent.id,
    status: 'accepted',
    acceptedAt: ts(),
    deliveryToken: order.deliveryToken,
    codAmount: order.paymentMethod === 'cod' ? order.total : 0,
  };

  state.deliverySessions.unshift(session);
  return { order, session, agent };
}

export function advanceDemoDelivery(
  orderId: string,
  agentId: string,
  targetStatus: DeliverySession['status'],
): { order: DemoOrder; session: DeliverySession; agent: DemoAgent } | null {
  const order = state.orders.find((entry) => entry.id === orderId);
  const session = state.deliverySessions.find((entry) => entry.orderId === orderId);
  const agent = state.agents.find((entry) => entry.id === agentId);

  if (!order || !session || !agent || order.agentId !== agentId || session.agentId !== agentId) {
    return null;
  }

  session.status = targetStatus;

  if (targetStatus === 'accepted') {
    order.status = 'agent_assigned';
    agent.availabilityStatus = 'busy';
  }

  if (targetStatus === 'navigating_to_restaurant') {
    order.status = 'agent_assigned';
    agent.availabilityStatus = 'busy';
  }

  if (targetStatus === 'arrived_at_restaurant') {
    session.arrivedAtRestaurant = ts();
    order.status = 'agent_assigned';
    agent.availabilityStatus = 'busy';
  }

  if (targetStatus === 'picked_up') {
    session.pickedAt = ts();
    order.status = 'picked_up';
    order.pickedAt = ts();
    agent.availabilityStatus = 'busy';
  }

  if (targetStatus === 'navigating_to_customer') {
    order.status = 'in_transit';
    agent.availabilityStatus = 'busy';
  }

  if (targetStatus === 'delivered') {
    session.deliveredAt = ts();
    order.status = 'delivered';
    order.deliveredAt = ts();
    order.etaMinutes = 0;
    agent.availabilityStatus = 'online';
  }

  agent.updatedAt = ts();
  return { order, session, agent };
}

export function getDemoTickets(filters?: {
  customerId?: string | null;
  status?: string | null;
  priority?: string | null;
}): SupportTicket[] {
  return state.tickets.filter((ticket) => {
    if (filters?.customerId && ticket.customerId !== filters.customerId) return false;
    if (filters?.status && ticket.status !== filters.status) return false;
    if (filters?.priority && ticket.priority !== filters.priority) return false;
    return true;
  });
}

export function createDemoTicket(input: Partial<SupportTicket>): SupportTicket {
  const ticket: SupportTicket = {
    id: input.id || `TKT_${Math.floor(1000 + Math.random() * 9000)}`,
    orderId: input.orderId,
    customerId: input.customerId || customers[0].id,
    category: input.category || 'other',
    subject: input.subject || 'Support request',
    description: input.description || 'Customer requested help.',
    priority: input.priority || 'p2',
    status: 'open',
    assignedTo: input.assignedTo,
    evidence: input.evidence || [],
    createdAt: ts(),
  };
  state.tickets.unshift(ticket);
  return ticket;
}

type WalletUserType = WalletTransaction['userType'];

function updateWalletBalance(userId: string, userType: WalletUserType, delta: number): number {
  if (userType === 'customer') {
    const customer = state.customers.find((entry) => entry.id === userId);
    if (!customer) return 0;
    customer.walletBalance += delta;
    customer.updatedAt = ts();
    return customer.walletBalance;
  }

  if (userType === 'restaurant') {
    const restaurant = state.restaurants.find((entry) => entry.id === userId);
    if (!restaurant) return 0;
    restaurant.walletBalance += delta;
    restaurant.updatedAt = ts();
    return restaurant.walletBalance;
  }

  const agent = state.agents.find((entry) => entry.id === userId);
  if (!agent) return 0;
  agent.walletBalance += delta;
  agent.updatedAt = ts();
  return agent.walletBalance;
}

export function getWalletSummary(userId?: string | null) {
  if (!userId) {
    return {
      balances: {
        customers: state.customers.reduce((sum, customer) => sum + customer.walletBalance, 0),
        restaurants: state.restaurants.reduce((sum, restaurant) => sum + restaurant.walletBalance, 0),
        agents: state.agents.reduce((sum, agent) => sum + agent.walletBalance, 0),
      },
      transactions: state.walletTransactions.slice(0, 12),
    };
  }

  const transactions = state.walletTransactions.filter((entry) => entry.userId === userId);
  const balance = state.customers.find((entry) => entry.id === userId)?.walletBalance
    ?? state.restaurants.find((entry) => entry.id === userId)?.walletBalance
    ?? state.agents.find((entry) => entry.id === userId)?.walletBalance
    ?? 0;

  return { balance, transactions };
}

export function createWalletTransaction(input: {
  userId: string;
  userType: WalletUserType;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  orderId?: string;
}): WalletTransaction {
  const signedAmount = input.type === 'credit' ? input.amount : -input.amount;
  const balanceAfter = updateWalletBalance(input.userId, input.userType, signedAmount);

  const transaction: WalletTransaction = {
    id: makeId('WT'),
    userId: input.userId,
    userType: input.userType,
    type: input.type,
    amount: input.amount,
    reason: input.reason,
    orderId: input.orderId,
    balanceAfter,
    createdAt: ts(),
  };

  state.walletTransactions.unshift(transaction);
  return transaction;
}

export function getDemoPayouts(): Payout[] {
  return state.payouts;
}

export function getDemoFraudAlerts(): FraudAlert[] {
  return state.fraudAlerts;
}

export function createDemoRefund(input: {
  orderId: string;
  amount?: number;
  adminId?: string;
}) {
  const order = state.orders.find((entry) => entry.id === input.orderId);
  if (!order) {
    return null;
  }

  const amount = input.amount ?? order.total;
  const transaction = createWalletTransaction({
    userId: order.customerId,
    userType: 'customer',
    type: 'credit',
    amount,
    reason: `Refund for ${order.id}`,
    orderId: order.id,
  });

  order.refundAmount = amount;
  order.paymentStatus = amount >= order.total ? 'refunded' : 'partially_refunded';
  order.status = amount >= order.total ? 'refunded' : order.status;

  return {
    refundId: makeId('refund'),
    orderId: order.id,
    amount,
    walletTransactionId: transaction.id,
    auditTrail: [
      { at: ts(), message: 'Provisional customer wallet credit issued.' },
      { at: ts(), message: `Refund reviewed by ${input.adminId || 'ops_admin_demo'}.` },
    ],
  };
}
