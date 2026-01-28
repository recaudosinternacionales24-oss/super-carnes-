
export interface Customer {
  id: string;
  name: string;
  document: string; // NIT o CC
  phone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Res' | 'Cerdo' | 'Pollo' | 'Embutidos' | 'Otros';
  costPrice: number; // Precio de compra
  price: number; // Precio de venta
  unit: 'kg' | 'lb' | 'unidad';
  stock: number;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  totalCost: number; // Costo total para reportes
  timestamp: number;
  customerId?: string; // ID del cliente asociado
  customerName?: string; // Nombre guardado en el momento de la venta
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
}

export interface InventoryStats {
  totalValue: number;
  lowStockItems: number;
  topCategories: { name: string; value: number }[];
}
