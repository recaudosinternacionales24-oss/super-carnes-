
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Settings, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Search, 
  CheckCircle2,
  X,
  Image as ImageIcon,
  Edit3,
  Printer,
  MessageSquare,
  ArrowUpCircle,
  Save,
  Upload,
  DollarSign,
  PieChart as PieChartIcon,
  TrendingDown,
  Users,
  UserPlus,
  MapPin,
  Phone,
  BarChart3,
  FileText,
  Download,
  Table as TableIcon,
  Calendar,
  Clock
} from 'lucide-react';
import { Product, CartItem, Sale, Customer } from './types';
import { INITIAL_PRODUCTS, CATEGORIES, formatCurrency } from './constants';
import { getInventoryAdvice } from './services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

// --- Helper Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-red-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card: React.FC<{ children?: React.ReactNode, title?: string, className?: string }> = ({ children, title, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'movements' | 'customers' | 'reports'>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'CONSUMIDOR FINAL', document: '2222222222', phone: '0', address: 'MOSTRADOR' }
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [aiAdvice, setAiAdvice] = useState<string>('Analizando inventario...');
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('1');
  const [globalFilter, setGlobalFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('day');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSaleDate, setEditingSaleDate] = useState<Sale | null>(null);
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      const advice = await getInventoryAdvice(products, sales);
      setAiAdvice(advice || "Optimiza tu stock de lomo res para el fin de semana.");
    };
    fetchAdvice();
  }, [sales.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartTotalCost = cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

  const processSale = () => {
    if (cart.length === 0) return;
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (product && product.stock < item.quantity) {
        alert(`Stock insuficiente para ${item.name}. Disponible: ${product.stock}`);
        return;
      }
    }
    const customer = customers.find(c => c.id === selectedCustomerId);
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...cart],
      total: cartTotal,
      totalCost: cartTotalCost,
      timestamp: Date.now(),
      customerId: selectedCustomerId,
      customerName: customer?.name,
      paymentMethod: 'Efectivo'
    };
    setSales(prev => [...prev, newSale]);
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      return p;
    }));
    setCart([]);
    setShowReceipt(newSale);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.document) return;
    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: (newCustomer.name || '').toUpperCase(),
      document: newCustomer.document || '',
      phone: newCustomer.phone || '',
      address: newCustomer.address || ''
    };
    setCustomers(prev => [...prev, customer]);
    setNewCustomer({});
    setAddingCustomer(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingProduct({ ...editingProduct, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const saveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
  };

  const updateSaleTimestamp = (saleId: string, newDateString: string) => {
    const newDate = new Date(newDateString);
    if (isNaN(newDate.getTime())) return;
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, timestamp: newDate.getTime() } : s));
    setEditingSaleDate(null);
  };

  const processPurchase = () => {
    if (!buyingProduct || purchaseQty <= 0) return;
    setProducts(prev => prev.map(p => p.id === buyingProduct.id ? { ...p, stock: p.stock + purchaseQty } : p));
    setBuyingProduct(null);
    setPurchaseQty(0);
  };

  const printInvoice = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const customer = customers.find(c => c.id === sale.customerId);
    const itemsHtml = sale.items.map(item => `
      <tr><td style="padding: 5px 0;">${item.name} x${item.quantity}</td><td style="text-align: right;">${formatCurrency(item.price * item.quantity)}</td></tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Factura ${sale.id}</title><style>body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }.header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }.total { font-weight: bold; font-size: 1.2em; border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }table { width: 100%; }</style></head>
      <body><div class="header"><h2 style="color: #dc2626; margin:0;">SUPER CARNES</h2><p>NIT: 900.555.222-1<br>Cali, Colombia</p></div>
      <p>Factura: #${sale.id}<br>Fecha: ${new Date(sale.timestamp).toLocaleString()}</p>
      <div style="font-size: 10px; margin-bottom: 10px; padding: 5px; border: 1px solid #ddd;">
        <strong>CLIENTE:</strong> ${customer?.name || sale.customerName}<br>
        <strong>CC/NIT:</strong> ${customer?.document || 'N/A'}<br>
        <strong>TEL:</strong> ${customer?.phone || 'N/A'}
      </div>
      <table>${itemsHtml}</table><div class="total">TOTAL: ${formatCurrency(sale.total)}</div><p style="text-align:center; font-size: 0.8em; margin-top: 20px;">Gracias por su compra.</p><script>window.print(); setTimeout(() => window.close(), 500);</script></body></html>
    `);
    printWindow.document.close();
  };

  const sendWhatsApp = (sale: Sale) => {
    const message = `🍖 *SUPER CARNES* 🍖\nFactura: #${sale.id}\nTOTAL: ${formatCurrency(sale.total)}\n¡Gracias por elegirnos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Shared Logic to filter sales globally based on filter state
  const filteredSales = useMemo(() => {
    const now = new Date();
    // Start of day
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of week (Sunday)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    sunday.setHours(0, 0, 0, 0);
    const startOfWeek = sunday.getTime();
    
    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Start of year
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return sales.filter(sale => {
      if (globalFilter === 'all') return true;
      if (globalFilter === 'day') return sale.timestamp >= startOfDay;
      if (globalFilter === 'week') return sale.timestamp >= startOfWeek;
      if (globalFilter === 'month') return sale.timestamp >= startOfMonth;
      if (globalFilter === 'year') return sale.timestamp >= startOfYear;
      return true;
    });
  }, [sales, globalFilter]);

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.total, 0), [filteredSales]);
  const totalCostOfSales = useMemo(() => filteredSales.reduce((acc, s) => acc + s.totalCost, 0), [filteredSales]);
  const totalProfit = totalRevenue - totalCostOfSales;
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Report Data - uses all sales for historical context or filtered depending on need. 
  // For charts, we use full context usually, but here let's align it with global filter too.
  const categoryData = useMemo(() => {
    const data: Record<string, { revenue: number, cost: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!data[item.category]) data[item.category] = { revenue: 0, cost: 0 };
        data[item.category].revenue += item.price * item.quantity;
        data[item.category].cost += item.costPrice * item.quantity;
      });
    });
    return Object.entries(data).map(([name, vals]) => ({
      name,
      Ventas: vals.revenue,
      Utilidad: vals.revenue - vals.cost
    }));
  }, [filteredSales]);

  const exportToExcel = () => {
    const headers = ['ID Factura', 'Fecha', 'Cliente', 'Total Venta', 'Costo Total', 'Utilidad Bruta'];
    const rows = filteredSales.map(s => [
      s.id,
      new Date(s.timestamp).toLocaleDateString(),
      s.customerName || 'N/A',
      s.total,
      s.totalCost,
      s.total - s.totalCost
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ventas_super_carnes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const rowsHtml = filteredSales.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${new Date(s.timestamp).toLocaleDateString()}</td>
        <td>${s.customerName || 'N/A'}</td>
        <td>${formatCurrency(s.total)}</td>
        <td>${formatCurrency(s.total - s.totalCost)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Reporte de Ventas - Super Carnes</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #dc2626; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary { margin-top: 30px; font-weight: bold; text-align: right; }
      </style></head>
      <body>
        <h1>REPORTE GERENCIAL - SUPER CARNES</h1>
        <p>Filtro: ${globalFilter.toUpperCase()}</p>
        <p>Generado el: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Utilidad</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="summary">
          <p>Total Ventas: ${formatCurrency(totalRevenue)}</p>
          <p>Utilidad Bruta Total: ${formatCurrency(totalProfit)}</p>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // Inventory Export functions
  const exportInventoryToExcel = () => {
    const headers = ['ID', 'Producto', 'Categoría', 'Precio Costo', 'Precio Venta', 'Unidad', 'Stock Actual', 'Valor Venta Total'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.category,
      p.costPrice,
      p.price,
      p.unit,
      p.stock,
      p.price * p.stock
    ]);

    const totalInventoryCost = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
    const totalInventorySale = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '', 'TOTAL COSTO (INVERSIÓN):', totalInventoryCost]);
    rows.push(['', '', '', '', '', '', 'TOTAL VENTA (ESPERADO):', totalInventorySale]);

    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_super_carnes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const rowsHtml = products.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.stock} ${p.unit}</td>
        <td>${formatCurrency(p.costPrice)}</td>
        <td>${formatCurrency(p.price)}</td>
        <td>${formatCurrency(p.price * p.stock)}</td>
      </tr>
    `).join('');

    const totalInventoryCost = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
    const totalInventorySale = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

    printWindow.document.write(`
      <html><head><title>Estado de Inventario - Super Carnes</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #dc2626; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #dc2626; color: white; font-weight: bold; text-transform: uppercase; }
        .summary { margin-top: 30px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: right; }
        .summary p { margin: 5px 0; font-size: 14px; }
        .summary .total-highlight { font-weight: 800; color: #dc2626; font-size: 16px; }
      </style></head>
      <body>
        <h1>ESTADO DE INVENTARIO - SUPER CARNES</h1>
        <p>Generado el: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Venta</th><th>Vlr. Total (Venta)</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="summary">
          <p><strong>Costo Total del Inventario (Inversión):</strong> ${formatCurrency(totalInventoryCost)}</p>
          <p class="total-highlight"><strong>Valor Total a la Venta (Ingreso Esperado):</strong> ${formatCurrency(totalInventorySale)}</p>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const FilterTabs = () => (
    <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
      {[
        { id: 'day', label: 'Hoy' },
        { id: 'week', label: 'Semana' },
        { id: 'month', label: 'Mes' },
        { id: 'year', label: 'Año' },
        { id: 'all', label: 'Todo' }
      ].map((f) => (
        <button
          key={f.id}
          onClick={() => setGlobalFilter(f.id as any)}
          className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
            globalFilter === f.id 
              ? 'bg-red-600 text-white shadow-sm' 
              : 'text-slate-500 hover:text-red-600'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const COLORS = ['#dc2626', '#f87171', '#ef4444', '#b91c1c', '#991b1b'];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="bg-red-600 p-2 rounded-lg"><ShoppingCart className="text-white" size={24} /></div>
          <span className="text-xl font-black tracking-tighter text-red-600 italic uppercase">Super Carnes</span>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={ShoppingCart} label="Vender (POS)" active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} />
          <SidebarItem icon={Package} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarItem icon={PieChartIcon} label="Movimientos" active={activeTab === 'movements'} onClick={() => setActiveTab('movements')} />
          <SidebarItem icon={Users} label="Clientes" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <SidebarItem icon={BarChart3} label="Reportes" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-black uppercase italic tracking-tighter">
            {activeTab === 'movements' ? 'Movimientos y Utilidad Bruta' : 
             activeTab === 'customers' ? 'Administración de Clientes' :
             activeTab === 'reports' ? 'Informes Gerenciales' :
             activeTab === 'inventory' ? 'Gestión de Inventario' :
             activeTab.replace('pos', 'Punto de Venta')}
          </h1>
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shadow-lg">SC</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="text-red-600" size={24} />
                  <div>
                    <h2 className="font-black text-slate-800 uppercase italic">Resumen Operativo</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Análisis del periodo seleccionado</p>
                  </div>
                </div>
                <FilterTabs />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title={`Ventas (${globalFilter === 'day' ? 'Hoy' : globalFilter.toUpperCase()})`}>
                  <h4 className="text-2xl font-black">{formatCurrency(totalRevenue)}</h4>
                </Card>
                <Card title={`Pedidos (${globalFilter === 'day' ? 'Hoy' : globalFilter.toUpperCase()})`}>
                  <h4 className="text-2xl font-black">{filteredSales.length}</h4>
                </Card>
                <Card title="Stock Crítico">
                  <h4 className="text-2xl font-black text-red-600">{products.filter(p => p.stock <= 10).length}</h4>
                </Card>
                <Card title={`Utilidad (${globalFilter === 'day' ? 'Hoy' : globalFilter.toUpperCase()})`}>
                  <h4 className="text-2xl font-black text-green-600">{formatCurrency(totalProfit)}</h4>
                </Card>
              </div>
              <Card title="Sugerencia IA" className="bg-red-50 border-red-200">
                <p className="text-xs italic text-slate-600">{aiAdvice}</p>
              </Card>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-2 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0} className="bg-white rounded-xl border border-slate-200 hover:border-red-500 overflow-hidden text-left flex flex-col group transition-all">
                      <div className="aspect-video relative">
                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-100"><ImageIcon size={32} /></div>}
                        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-black ${product.stock > 10 ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>STOCK: {product.stock}</div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-slate-800 text-xs uppercase">{product.name}</h4>
                        <p className="text-xl font-black text-red-600">{formatCurrency(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col sticky top-0 h-fit">
                <div className="p-4 bg-red-600 text-white rounded-t-xl font-black flex justify-between uppercase italic"><span>CAJA DE VENTA</span><span>{cart.length}</span></div>
                
                <div className="p-3 border-b bg-slate-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Seleccionar Cliente</label>
                   <select 
                    className="w-full p-2 border rounded-lg font-black text-xs bg-white outline-none focus:border-red-500"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                   >
                     {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} - {c.document}</option>
                     ))}
                   </select>
                </div>

                <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase truncate flex-1">{item.name}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border rounded px-1 flex-1">
                          <span className="text-[10px] font-black text-red-600 mr-1">$</span>
                          <input type="number" value={item.price} onChange={(e) => updatePrice(item.id, Number(e.target.value))} className="w-full text-xs font-black outline-none" />
                        </div>
                        <div className="flex items-center gap-1 bg-white border rounded">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={10} /></button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={10} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 border-t space-y-3 rounded-b-xl">
                  <div className="flex justify-between text-xl font-black text-red-600 italic"><span>TOTAL</span><span>{formatCurrency(cartTotal)}</span></div>
                  <button onClick={processSale} disabled={cart.length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">COBRAR Y FACTURAR</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="text-red-600" size={24} />
                  <div>
                    <h2 className="font-black text-slate-800 uppercase italic">Estado de Inventario</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{filteredProducts.length} Productos Registrados</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={exportInventoryToPDF}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-slate-800 transition-colors"
                   >
                     <FileText size={16} /> PDF
                   </button>
                   <button 
                    onClick={exportInventoryToExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-colors"
                   >
                     <TableIcon size={16} /> Excel
                   </button>
                </div>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Costo</th><th className="px-4 py-3">Venta</th><th className="px-4 py-3">Margen</th><th className="px-4 py-3 text-center">Stock</th><th className="px-4 py-3 text-right">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(p => {
                        const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 flex items-center gap-3"><img src={p.imageUrl} className="w-8 h-8 rounded object-cover" /><span className="font-black text-xs uppercase">{p.name}</span></td>
                            <td className="px-4 py-4 text-xs">{formatCurrency(p.costPrice)}</td>
                            <td className="px-4 py-4 text-xs font-black text-red-600">{formatCurrency(p.price)}</td>
                            <td className="px-4 py-4"><span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${margin > 20 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{margin.toFixed(1)}%</span></td>
                            <td className="px-4 py-4 text-center"><span className={`text-xs font-black px-2 py-0.5 rounded ${p.stock > 10 ? 'text-green-600' : 'text-red-600 font-black'}`}>{p.stock} {p.unit}</span></td>
                            <td className="px-4 py-4 text-right flex justify-end gap-2">
                              <button onClick={() => setBuyingProduct(p)} className="p-2 bg-blue-600 text-white rounded-lg shadow-sm"><ArrowUpCircle size={16} /></button>
                              <button onClick={() => setEditingProduct(p)} className="p-2 bg-slate-800 text-white rounded-lg shadow-sm"><Edit3 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'movements' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-red-600" size={24} />
                  <div>
                    <h2 className="font-black text-slate-800 uppercase italic">Registro de Movimientos</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por periodo de tiempo</p>
                  </div>
                </div>
                <FilterTabs />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-red-600" title={`Ingresos (${globalFilter === 'all' ? 'Histórico' : 'Periodo'})`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales</span>
                    <TrendingUp className="text-green-500" size={16} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</h4>
                </Card>
                <Card className="border-l-4 border-l-slate-800" title={`Costos (${globalFilter === 'all' ? 'Histórico' : 'Periodo'})`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Mercancía</span>
                    <TrendingDown className="text-red-400" size={16} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{formatCurrency(totalCostOfSales)}</h4>
                </Card>
                <Card className="bg-red-600 text-white shadow-xl shadow-red-100" title={`Utilidad Bruta (${globalFilter === 'all' ? 'Total' : globalFilter.toUpperCase()})`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-red-200 uppercase tracking-widest">Ganancia Real</span>
                    <DollarSign className="text-red-200" size={16} />
                  </div>
                  <h4 className="text-2xl font-black">{formatCurrency(totalProfit)}</h4>
                  <div className="mt-2 text-[10px] font-black bg-white/20 px-2 py-1 rounded-md inline-block">RENTABILIDAD: {averageMargin.toFixed(1)}%</div>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2 px-2"><PieChartIcon size={18} /> Detalle de Ventas y Márgenes</h3>
                {filteredSales.slice().reverse().map(sale => (
                  <Card key={sale.id} className="hover:border-red-600 border-l-4 border-l-transparent hover:border-l-red-600 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-3 rounded-xl"><History className="text-slate-400" size={20} /></div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="font-black text-lg text-slate-800 uppercase italic">FACTURA #{sale.id}</h4>
                             <button onClick={() => setEditingSaleDate(sale)} className="text-slate-300 hover:text-red-600 transition-colors"><Edit3 size={14}/></button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {new Date(sale.timestamp).toLocaleString()} - Cliente: {sale.customerName || customers.find(c => c.id === sale.customerId)?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left"><div className="flex flex-wrap gap-1 justify-center md:justify-start">{sale.items.map(i => <span key={i.id} className="text-[9px] bg-slate-50 border px-2 py-0.5 rounded uppercase font-bold">{i.name} (x{i.quantity})</span>)}</div></div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xl font-black text-red-600">{formatCurrency(sale.total)}</p>
                          <p className="text-[10px] font-black text-green-600 uppercase">UTILIDAD BRUTA: +{formatCurrency(sale.total - sale.totalCost)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => printInvoice(sale)} className="p-2 border rounded-lg hover:bg-slate-50"><Printer size={16} /></button>
                          <button onClick={() => sendWhatsApp(sale)} className="p-2 border rounded-lg text-green-600 hover:bg-green-50"><MessageSquare size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredSales.length === 0 && <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-100 font-black uppercase text-slate-300 italic">No hay registros para este periodo</div>}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-black text-slate-800 uppercase italic">Directorio de Clientes</h3>
                  <button 
                    onClick={() => setAddingCustomer(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-red-700 transition-colors"
                  >
                    <UserPlus size={18} /> Registrar Nuevo
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customers.map(c => (
                    <Card key={c.id} className="hover:border-red-600 border-l-4 border-l-red-500">
                       <div className="flex justify-between items-start mb-4">
                          <div className="bg-red-50 p-3 rounded-full text-red-600">
                             <Users size={20} />
                          </div>
                          <span className="text-[10px] font-black text-slate-300">ID: {c.id}</span>
                       </div>
                       <h4 className="font-black text-lg text-slate-800 uppercase mb-4 truncate italic">{c.name}</h4>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                             <DollarSign size={14} className="text-red-400" /> NIT/CC: <span className="text-slate-900 font-black">{c.document}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                             <Phone size={14} className="text-red-400" /> Tel: <span className="text-slate-900 font-black">{c.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                             <MapPin size={14} className="text-red-400" /> Dir: <span className="text-slate-900 font-black truncate">{c.address || 'N/A'}</span>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div>
                   <h3 className="font-black text-slate-800 uppercase italic">Panel de Reportes</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase">Descarga y Análisis de Ventas</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                    onClick={exportToPDF}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-slate-800 transition-colors"
                   >
                     <FileText size={16} /> Exportar PDF
                   </button>
                   <button 
                    onClick={exportToExcel}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-colors"
                   >
                     <TableIcon size={16} /> Exportar Excel
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Rentabilidad por Categoría">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="Ventas" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Utilidad" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Distribución de Ganancia (UB)">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="Utilidad"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card title="Productos Más Rentables (Top 5)">
                    <div className="space-y-3">
                       {products
                          .map(p => ({ ...p, profit: p.price - p.costPrice }))
                          .sort((a, b) => b.profit - a.profit)
                          .slice(0, 5)
                          .map((p, idx) => (
                             <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                   <span className="w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-[10px] font-black">{idx + 1}</span>
                                   <span className="font-black text-xs uppercase truncate w-32">{p.name}</span>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase">Utilidad/Unidad</p>
                                   <p className="font-black text-green-600">{formatCurrency(p.profit)}</p>
                                </div>
                             </div>
                          ))
                       }
                    </div>
                 </Card>

                 <Card title="Análisis de Rendimiento">
                    <div className="space-y-6 py-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600"><TrendingUp size={24} /></div>
                          <div>
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Utilidad Acumulada</p>
                             <h4 className="text-xl font-black text-slate-800">{formatCurrency(totalProfit)}</h4>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600"><FileText size={24} /></div>
                          <div>
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Margen Operativo</p>
                             <h4 className="text-xl font-black text-slate-800">{averageMargin.toFixed(2)}%</h4>
                          </div>
                       </div>
                       <div className="pt-4 border-t">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Estado de Rentabilidad</p>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div className="bg-red-600 h-full" style={{ width: `${Math.min(100, averageMargin * 3)}%` }}></div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: MODIFICAR FECHA FACTURA */}
      {editingSaleDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl scale-in-center">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-red-600 uppercase italic">Editar Fecha Factura</h3>
                 <button onClick={() => setEditingSaleDate(null)} className="text-slate-300 hover:text-black"><X /></button>
              </div>
              <div className="space-y-4">
                 <p className="text-xs font-black text-slate-400 uppercase">Factura: #{editingSaleDate.id}</p>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nueva Fecha y Hora</label>
                    <input 
                      type="datetime-local" 
                      className="w-full p-3 border-2 border-slate-100 rounded-xl font-black text-sm outline-none focus:border-red-500"
                      defaultValue={new Date(editingSaleDate.timestamp - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      id="newSaleDate"
                    />
                 </div>
              </div>
              <button 
                onClick={() => {
                   const input = document.getElementById('newSaleDate') as HTMLInputElement;
                   updateSaleTimestamp(editingSaleDate.id, input.value);
                }}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all mt-4"
              >
                 <Save size={20} className="inline mr-2" /> ACTUALIZAR FECHA
              </button>
           </div>
        </div>
      )}

      {/* MODAL: AGREGAR CLIENTE */}
      {addingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <form onSubmit={handleSaveCustomer} className="bg-white rounded-2xl w-full max-md p-6 space-y-4 shadow-2xl scale-in-center">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-red-600 uppercase italic">Registro de Cliente</h3>
                 <button type="button" onClick={() => setAddingCustomer(false)} className="text-slate-300 hover:text-black"><X /></button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre o Razón Social</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-slate-100 rounded-xl font-black uppercase text-sm focus:border-red-500 outline-none"
                      required
                      placeholder="EJ: CARNICERIA EL TRIUNFO"
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CC / NIT</label>
                        <input 
                          type="text" 
                          className="w-full p-3 border-2 border-slate-100 rounded-xl font-black text-sm outline-none focus:border-red-500"
                          required
                          placeholder="800123456"
                          onChange={e => setNewCustomer({...newCustomer, document: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Celular</label>
                        <input 
                          type="text" 
                          className="w-full p-3 border-2 border-slate-100 rounded-xl font-black text-sm outline-none focus:border-red-500"
                          placeholder="3001234567"
                          onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                        />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dirección de Entrega</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-slate-100 rounded-xl font-black text-sm outline-none focus:border-red-500"
                      placeholder="CALLE 10 # 20-30"
                      onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    />
                 </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all mt-4"
              >
                 <Save size={20} className="inline mr-2" /> GUARDAR CLIENTE
              </button>
           </form>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="bg-red-600 p-8 text-white text-center">
              <CheckCircle2 size={40} className="mx-auto mb-4" />
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">VENTA PROCESADA</h2>
              <p className="opacity-80 font-bold">Ticket #{showReceipt.id}</p>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={() => printInvoice(showReceipt)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2"><Printer size={20} /> IMPRIMIR FACTURA</button>
              <button onClick={() => sendWhatsApp(showReceipt)} className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2"><MessageSquare size={20} /> ENVIAR POR WA</button>
              <button onClick={() => setShowReceipt(null)} className="w-full text-slate-400 font-black text-xs py-2 uppercase">FINALIZAR</button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={saveProductEdit} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex justify-between items-center border-b pb-4"><h3 className="text-xl font-black text-red-600 uppercase italic">Ficha de Producto</h3><button type="button" onClick={() => setEditingProduct(null)}><X /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative border-2 border-dashed border-slate-200 flex items-center justify-center group">
                  {editingProduct.imageUrl ? <img src={editingProduct.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={48} />}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase"><Upload size={24} className="mb-1" /> Subir Imagen</button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <input type="text" className="w-full p-3 border rounded-xl font-bold uppercase text-xs" placeholder="Nombre" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Precio Compra</label>
                <input type="number" className="w-full p-3 border rounded-xl font-black text-sm" value={editingProduct.costPrice} onChange={e => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})} />
                <label className="text-[10px] font-black text-slate-400 uppercase block">Precio Venta</label>
                <input type="number" className="w-full p-3 border-red-100 border-2 rounded-xl font-black text-sm text-red-600" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                <div className="p-3 bg-red-50 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-black text-red-600 uppercase">Margen</span>
                  <span className="text-xl font-black text-red-700">{editingProduct.price > 0 ? (((editingProduct.price - editingProduct.costPrice) / editingProduct.price) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full p-2 border rounded-lg font-black text-xs" placeholder="Stock" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
                  <select className="w-full p-2 border rounded-lg font-black text-xs uppercase" value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value as any})}><option value="kg">KG</option><option value="lb">LB</option><option value="unidad">UNID</option></select>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-red-100"><Save size={20} /> ACTUALIZAR PRODUCTO</button>
          </form>
        </div>
      )}

      {buyingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl border-t-8 border-blue-600">
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-blue-600 uppercase italic">Entrada Stock</h3><button onClick={() => setBuyingProduct(null)}><X /></button></div>
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl"><img src={buyingProduct.imageUrl} className="w-10 h-10 rounded object-cover" /><span className="font-black uppercase text-xs text-blue-800">{buyingProduct.name}</span></div>
            <input type="number" className="w-full p-4 border-4 border-blue-50 rounded-2xl text-4xl font-black text-center text-blue-600 outline-none" value={purchaseQty} onChange={e => setPurchaseQty(Number(e.target.value))} autoFocus placeholder="0" />
            <button onClick={processPurchase} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 uppercase tracking-widest"><ArrowUpCircle size={20} /> CARGAR INVENTARIO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
