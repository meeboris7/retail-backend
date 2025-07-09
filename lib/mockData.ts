// lib/mockData.ts
import { Product, Supplier, PurchaseOrder, MockData } from '../app/types'; // Adjust path as needed

// Initial mock data state
const initialMockData: MockData = {
  products: [
    { id: 'P001', name: 'Wireless Mouse', currentQuantity: 50, reorderPoint: 70 },
    { id: 'P002', name: 'Mechanical Keyboard', currentQuantity: 20, reorderPoint: 30 },
    { id: 'P003', name: 'USB-C Hub', currentQuantity: 150, reorderPoint: 100 }, // No reorder needed here
    { id: 'P004', name: 'Webcam 1080p', currentQuantity: 5, reorderPoint: 15 },
    { id: 'P005', name: 'Monitor Arm', currentQuantity: 25, reorderPoint: 40 },
  ],
  suppliers: [
    { id: 'S001', name: 'Tech Distributor A', leadTimeDays: 7, reliability: 0.98, costFactor: 1.0, email: 'nyaksha06@gmail.com' },
    { id: 'S002', name: 'Global Components', leadTimeDays: 14, reliability: 0.90, costFactor: 0.95, email: 'nyaksha06@gmail.com' },
    { id: 'S003', name: 'Electro Supply Co.', leadTimeDays: 10, reliability: 0.95, costFactor: 1.05, email: 'nyaksha06@gmail.com' },
  ],
  purchaseOrders: [
    // Example of a delivered PO (this will be filtered out by the API)
    {
      poId: 'PO-20250620-001',
      productId: 'P003',
      supplierId: 'S001',
      quantityOrdered: 100,
      orderDate: '2025-06-20T09:00:00Z',
      expectedDeliveryDate: '2025-06-27T09:00:00Z',
      actualDeliveryDate: '2025-06-26T15:00:00Z', // <<< ADD THIS LINE
      status: 'delivered',
      chosenSupplierReason: 'Met demand quickly',
      emailNotificationStatus: 'sent',
    },
    // Example of a pending PO
    {
      poId: 'PO-20250701-001',
      productId: 'P001',
      supplierId: 'S001',
      quantityOrdered: 40,
      orderDate: '2025-07-01T09:00:00Z',
      expectedDeliveryDate: '2025-07-15T09:00:00Z', // Adjusted for future date to be pending as of current time
      status: 'pending',
      chosenSupplierReason: 'Fastest delivery',
      emailNotificationStatus: 'sent',
    },
    // Example of a delayed PO (past expected delivery date as of current date 2025-07-09)
    {
      poId: 'PO-20250701-002',
      productId: 'P002',
      supplierId: 'S002',
      quantityOrdered: 20,
      orderDate: '2025-07-01T10:00:00Z',
      expectedDeliveryDate: '2025-07-07T10:00:00Z', // Set to a past date to ensure it's delayed
      status: 'delayed', // It might initially be pending, but system calculates to delayed
      chosenSupplierReason: 'Best cost',
      emailNotificationStatus: 'sent',
    },
  ],
};

// Simple in-memory "database"
let mockData: MockData = JSON.parse(JSON.stringify(initialMockData)); // Deep copy to allow modification

export const getMockData = () => mockData;

export const updateMockData = (newData: Partial<MockData>) => {
  mockData = { ...mockData, ...newData };
};

export const resetMockData = () => {
  mockData = JSON.parse(JSON.stringify(initialMockData));
};

// Helper for generating unique IDs
export const generateId = (prefix: string) => {
  return `${prefix}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4)}`; // Increased length for less collision
};