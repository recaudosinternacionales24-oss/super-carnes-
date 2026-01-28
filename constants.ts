
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Lomo Fino Res', category: 'Res', costPrice: 30000, price: 38000, unit: 'kg', stock: 45, imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '2', name: 'Punta de Anca', category: 'Res', costPrice: 25000, price: 32000, unit: 'kg', stock: 30, imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '3', name: 'Costilla de Cerdo', category: 'Cerdo', costPrice: 18000, price: 24000, unit: 'kg', stock: 60, imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '4', name: 'Pechuga de Pollo', category: 'Pollo', costPrice: 14000, price: 18000, unit: 'kg', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '5', name: 'Chorizo Santarrosano', category: 'Embutidos', costPrice: 10000, price: 15000, unit: 'unidad', stock: 80, imageUrl: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '6', name: 'Muchacho de Res', category: 'Res', costPrice: 22000, price: 28000, unit: 'kg', stock: 25, imageUrl: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '7', name: 'Bondiola de Cerdo', category: 'Cerdo', costPrice: 20000, price: 26000, unit: 'kg', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6e9482172?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '8', name: 'Alas de Pollo', category: 'Pollo', costPrice: 8500, price: 12000, unit: 'kg', stock: 120, imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200&h=200' },
];

export const CATEGORIES = ['Res', 'Cerdo', 'Pollo', 'Embutidos', 'Otros'] as const;

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};
