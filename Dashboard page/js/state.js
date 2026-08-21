/* CBS state + data service – synchronous mock data with property access */
import { API_BASE_URL, API_ENDPOINTS } from './config.js';

// ---------- MOCK DATA ----------
const MOCK_BUSINESSES = {
  "Chawntee's Grill": {
    initials: "CG",
    category: "Food & Restaurant",
    customers: 1248,
    orders: 86,
    revenue: 485000,
    conversations: 342,
    automationRate: 85.8,
    connected: true
  }
};

const MOCK_CUSTOMERS = [
  { name: "Ngozi E.", initials: "NE", phone: "+234 801 234 5678", email: "ngozi@example.com", orders: 12, last: "2 min ago", status: "active" },
  { name: "Chidi A.", initials: "CA", phone: "+234 802 345 6789", email: "chidi@example.com", orders: 8, last: "10 min ago", status: "active" },
  { name: "Amara B.", initials: "AB", phone: "+234 803 456 7890", email: "amara@example.com", orders: 4, last: "25 min ago", status: "followup" },
  { name: "Tunde C.", initials: "TC", phone: "+234 804 567 8901", email: "tunde@example.com", orders: 6, last: "40 min ago", status: "inactive" },
  { name: "Sarah J.", initials: "SJ", phone: "+234 805 678 9012", email: "sarah@example.com", orders: 15, last: "1 hr ago", status: "active" }
];

const MOCK_CATALOGUE = [
  { id: 1, name: "Jollof Rice", category: "Meals", price: 2500, stock: 20, status: "active", trackStock: true, offeringAvailable: true, imageUrl: null, description: "Classic Nigerian jollof rice." },
  { id: 2, name: "Chicken Shawarma", category: "Shawarma", price: 1800, stock: 8, status: "low", trackStock: true, offeringAvailable: true, imageUrl: null, description: "Grilled chicken shawarma wrap." },
  { id: 3, name: "Beef Burger", category: "Burgers", price: 2200, stock: 0, status: "out", trackStock: true, offeringAvailable: true, imageUrl: null, description: "Juicy beef burger with cheese." },
  { id: 4, name: "Fried Rice", category: "Meals", price: 2300, stock: 15, status: "active", trackStock: true, offeringAvailable: true, imageUrl: null, description: "Fried rice with vegetables." },
  { id: 5, name: "Grilled Fish", category: "Grills", price: 3500, stock: 5, status: "low", trackStock: true, offeringAvailable: true, imageUrl: null, description: "Fresh grilled fish." },
  { id: 6, name: "Coke", category: "Drinks", price: 500, stock: null, status: "active", trackStock: false, offeringAvailable: true, imageUrl: null, description: "Chilled soft drink." }
];

// ---------- DataService ----------
export const DataService = {
  // Expose mock data as a property for direct access (used in overview.js)
  businesses: MOCK_BUSINESSES,

  // Synchronous methods (return mock data directly)
  getBusinesses() {
    return this.businesses;
  },

  getBusiness(name) {
    return this.businesses[name] || this.businesses["Chawntee's Grill"];
  },

  getCustomers(businessName) {
    return MOCK_CUSTOMERS;
  },

  getCatalogue(businessName) {
    return MOCK_CATALOGUE;
  }
};

// ---------- State ----------
export const State = {
  currentBusiness: localStorage.getItem("cbs_current_business") || "Chawntee's Grill",
  theme: localStorage.getItem("cbs-theme") || "light",
  botOnline: true
};

export const viewModules = {
  'dashboard': 'overview',
  'overview': 'overview',
  'conversations': 'conversations',
  'notifications': 'notifications',
  'business': 'business',
  'customers': 'customers',
  'catalogue': 'catalogue',
  'orders': 'orders',
  'faqs': 'faqs',
  'payments': 'payments',
  'leads': 'leads',
  'broadcasts': 'broadcasts',
  'analytics': 'analytics',
  'team': 'team',
  'settings': 'settings',
  'bot': 'bot',
  'profile': 'profile'
};