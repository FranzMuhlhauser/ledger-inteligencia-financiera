import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Calendar,
  MoreVertical,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Upload,
  Trash2,
  DollarSign,
  PieChart as PieChartIcon,
  User,
  Building2,
  Percent,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import LoginPage from './LoginPage';

// --- Types ---
interface Invoice {
  id: string;
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  valorNeto: number;
  iva: number;
  valorTotal: number;
  initials: string;
  color: string;
}

const COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-orange-100 text-orange-600',
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-600',
];

export default function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Panel Control');
  const invoiceNumberRef = React.useRef<HTMLInputElement>(null);

  // --- Settings State ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ledger_settings');
    return saved ? JSON.parse(saved) : {
      companyName: 'Adrian Editorial',
      userRole: 'Gerente de Finanzas',
      ivaRate: 0.19,
      userName: 'Adrian',
      logoUrl: '',
      userPhotoUrl: ''
    };
  });

  // Local state for settings tab to allow explicit saving
  const [tempSettings, setTempSettings] = useState(settings);

  // Sync tempSettings when settings change (e.g. on initial load)
  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ledger_settings', JSON.stringify(settings));
  }, [settings]);

  // --- Invoices State & Persistence ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Load invoices from Supabase when user logs in
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setInvoices(data.map(inv => ({
            ...inv,
            initials: inv.proveedor
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            color: COLORS[Math.floor(inv.id.charCodeAt(0) % COLORS.length)],
          })));
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [user]);

  useEffect(() => {
    const saveInvoices = async () => {
      if (!user) return;

      try {
        // Delete invoices that no longer exist
        const currentIds = invoices.map(inv => inv.id);
        const { data: existingInvoices } = await supabase
          .from('invoices')
          .select('id')
          .eq('user_id', user.id);

        if (existingInvoices) {
          const idsToDelete = existingInvoices
            .filter(inv => !currentIds.includes(inv.id))
            .map(inv => inv.id);

          if (idsToDelete.length > 0) {
            await supabase
              .from('invoices')
              .delete()
              .in('id', idsToDelete);
          }
        }

        // Upsert current invoices
        for (const invoice of invoices) {
          await supabase
            .from('invoices')
            .upsert({
              id: invoice.id,
              user_id: user.id,
              numero_factura: invoice.numeroFactura,
              fecha: invoice.fecha,
              proveedor: invoice.proveedor,
              valor_neto: invoice.valorNeto,
              iva: invoice.iva,
              valor_total: invoice.valorTotal,
            }, {
              onConflict: 'id'
            });
        }
      } catch (error) {
        console.error('Error saving invoices:', error);
      }
    };

    if (!loading) {
      saveInvoices();
    }
  }, [invoices, user, loading]);

  // --- Form State ---
  const [formData, setFormData] = useState({
    numeroFactura: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    valorNeto: '',
  });

  // --- Automatic Calculations ---
  const ivaRate = settings.ivaRate;
  const valorNetoNum = parseFloat(formData.valorNeto) || 0;
  const calculatedIva = Math.round(valorNetoNum * ivaRate);
  const calculatedTotal = valorNetoNum + calculatedIva;

  // --- Summary Calculations ---
  const totalExpenditure = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.valorTotal, 0);
  }, [invoices]);

  const activeInvoicesCount = invoices.length;

  // --- Analysis Data ---
  const chartData = useMemo(() => {
    const grouped = invoices.reduce((acc: any, inv) => {
      const month = inv.fecha.slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + inv.valorTotal;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  const providerData = useMemo(() => {
    const grouped = invoices.reduce((acc: any, inv) => {
      acc[inv.proveedor] = (acc[inv.proveedor] || 0) + inv.valorTotal;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [invoices]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterInvoice = () => {
    if (!formData.proveedor || !formData.valorNeto || !formData.numeroFactura) {
      return;
    }

    const initials = formData.proveedor
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      numeroFactura: formData.numeroFactura,
      fecha: formData.fecha,
      proveedor: formData.proveedor,
      valorNeto: valorNetoNum,
      iva: calculatedIva,
      valorTotal: calculatedTotal,
      initials,
      color: randomColor,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    
    // Reset form (keep date)
    setFormData(prev => ({
      ...prev,
      numeroFactura: '',
      proveedor: '',
      valorNeto: '',
    }));

    // Focus back to invoice number for next entry
    invoiceNumberRef.current?.focus();
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    // Optional: show a toast or feedback
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({ ...prev, userPhotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // Show login page if not authenticated
  if (!user && !authLoading) {
    return <LoginPage />;
  }

  // Show loading state while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <LayoutDashboard className="text-white w-10 h-10" />
          </div>
          <p className="text-on-surface-variant font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-60 bg-surface-container-low flex flex-col py-8 px-4 fixed h-full">
        <div className="flex items-center gap-3 px-4 mb-12">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight leading-none">Ledger</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold mt-1">Inteligencia Financiera</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { name: 'Panel Control', icon: LayoutDashboard },
            { name: 'Facturas', icon: FileText },
            { name: 'Análisis', icon: BarChart3 },
            { name: 'Ajustes', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.name 
                  ? 'bg-surface-container-lowest text-primary shadow-sm border-r-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={() => {
            setActiveTab('Facturas');
            setTimeout(() => {
              document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
              invoiceNumberRef.current?.focus();
            }, 100);
          }}
          className="mt-auto flex items-center justify-center gap-2 btn-primary-gradient py-4 rounded-xl font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Factura</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 flex flex-col">
        {/* Header */}
        <header className="h-20 bg-surface-container-lowest flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm/5">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar facturas..." 
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-8 w-[1px] bg-surface-container-high"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('Ajustes')}
                className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 rounded-2xl transition-all group"
              >
                <img
                  src={settings.userPhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.userName}`}
                  alt="Perfil"
                  className="w-11 h-11 rounded-xl bg-surface-container-low object-cover border border-surface-container-high group-hover:border-primary transition-colors shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-on-surface leading-none">{settings.companyName}</p>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1.5 leading-none">{settings.userName}</p>
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-medium mt-1 leading-none">{settings.userRole}</p>
                </div>
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  setActiveTab('Panel Control');
                }}
                className="p-2 text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'Panel Control' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Panel de Control</h2>
                    <p className="text-on-surface-variant mt-2 text-lg">Resumen ejecutivo de tu salud financiera.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-4 bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                      <DollarSign className="text-primary w-5 h-5" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Gasto Total</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">${totalExpenditure.toLocaleString('es-CL')}</h4>
                  </div>
                  <div className="col-span-4 bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                      <FileText className="text-secondary w-5 h-5" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Facturas Registradas</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">{invoices.length}</h4>
                  </div>
                  <div className="col-span-4 bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                      <Building2 className="text-emerald-600 w-5 h-5" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Proveedores Activos</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">{new Set(invoices.map(i => i.proveedor)).size}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
                    <h3 className="text-lg font-bold text-on-surface mb-6">Tendencia de Gastos</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `$${value/1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Total']}
                          />
                          <Line type="monotone" dataKey="total" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, fill: '#1e293b' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-span-4 bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
                    <h3 className="text-lg font-bold text-on-surface mb-6">Distribución por Proveedor</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={providerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {providerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Facturas' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Gestión de Facturas</h2>
                    <p className="text-on-surface-variant mt-2 text-lg">Captura y rastrea tus gastos operativos con precisión.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                  </div>
                </div>

                <div id="upload-section" className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 bg-surface-container-low rounded-[2rem] p-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                        <Upload className="text-white w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-bold text-on-surface">Subir Nueva Factura</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Nº de Factura</label>
                        <input 
                          ref={invoiceNumberRef}
                          type="text" 
                          name="numeroFactura"
                          value={formData.numeroFactura}
                          onChange={handleInputChange}
                          placeholder="ej. F-2024-001" 
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Fecha</label>
                        <input 
                          type="date" 
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Proveedor</label>
                        <input 
                          type="text" 
                          name="proveedor"
                          value={formData.proveedor}
                          onChange={handleInputChange}
                          placeholder="ej. Global Logistics Corp" 
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Valor Neto</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                          <input 
                            type="number" 
                            name="valorNeto"
                            value={formData.valorNeto}
                            onChange={handleInputChange}
                            placeholder="0.00" 
                            className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">IVA ({settings.ivaRate * 100}%)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                          <input 
                            type="text" 
                            readOnly
                            value={calculatedIva.toLocaleString('es-CL')}
                            className="w-full bg-surface-container-high/30 border-none rounded-xl py-3 pl-8 pr-4 text-on-surface-variant cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Valor Total</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                          <input 
                            type="text" 
                            readOnly
                            value={calculatedTotal.toLocaleString('es-CL')}
                            className="w-full bg-surface-container-high/30 border-none rounded-xl py-4 pl-10 pr-4 text-xl font-extrabold text-primary cursor-not-allowed" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button 
                        onClick={handleRegisterInvoice}
                        disabled={!formData.proveedor || !formData.valorNeto || !formData.numeroFactura}
                        className="btn-primary-gradient px-10 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Registrar Factura
                      </button>
                    </div>
                  </div>

                  <div className="col-span-4 bg-surface-container-lowest rounded-[2rem] p-10 flex flex-col shadow-xl shadow-primary/5">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-10">
                      <TrendingUp className="text-secondary w-6 h-6" />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2">Gasto Mensual Total</p>
                    <div className="flex items-baseline gap-3 mb-12">
                      <h4 className="text-5xl font-extrabold text-primary tracking-tighter">
                        ${totalExpenditure.toLocaleString('es-CL')}
                      </h4>
                    </div>
                    <div className="mt-auto space-y-6">
                      <div className="flex justify-between items-end">
                        <p className="text-sm font-medium text-on-surface-variant">Facturas Activas</p>
                        <p className="text-2xl font-extrabold text-on-surface">{activeInvoicesCount}</p>
                      </div>
                      <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: activeInvoicesCount > 0 ? '100%' : '0%' }}
                          className="h-full bg-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-primary w-6 h-6" />
                      <h3 className="text-2xl font-extrabold text-on-surface">Registro de Facturas</h3>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border border-surface-container-low">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low/50">
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Nº Factura</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Fecha</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Proveedor</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Valor Neto</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">IVA ({settings.ivaRate * 100}%)</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Valor Total</th>
                          <th className="py-6 px-8 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low">
                        <AnimatePresence mode="popLayout">
                          {invoices.length === 0 ? (
                            <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <td colSpan={7} className="py-20 text-center text-on-surface-variant italic">
                                No hay facturas registradas aún.
                              </td>
                            </motion.tr>
                          ) : (
                            invoices.map((invoice) => (
                              <motion.tr 
                                key={invoice.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="group hover:bg-surface-container-low/30 transition-colors"
                              >
                                <td className="py-6 px-8 text-sm font-bold text-primary">{invoice.numeroFactura}</td>
                                <td className="py-6 px-8 text-sm font-medium text-on-surface">{invoice.fecha}</td>
                                <td className="py-6 px-8">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${invoice.color}`}>
                                      {invoice.initials}
                                    </div>
                                    <span className="text-sm font-bold text-on-surface">{invoice.proveedor}</span>
                                  </div>
                                </td>
                                <td className="py-6 px-8 text-sm font-medium text-on-surface-variant text-right">${invoice.valorNeto.toLocaleString('es-CL')}</td>
                                <td className="py-6 px-8 text-sm font-medium text-on-surface-variant text-right">${invoice.iva.toLocaleString('es-CL')}</td>
                                <td className="py-6 px-8 text-sm font-extrabold text-primary text-right">${invoice.valorTotal.toLocaleString('es-CL')}</td>
                                <td className="py-6 px-8 text-center">
                                  <button 
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="p-2 text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Análisis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Análisis Detallado</h2>
                    <p className="text-on-surface-variant mt-2 text-lg">Visualiza tendencias y patrones en tus gastos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-surface-container-lowest rounded-[2rem] p-10 shadow-sm border border-surface-container-low">
                    <h3 className="text-xl font-bold text-on-surface mb-8">Evolución de Gastos Mensuales</h3>
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="total" fill="#1e293b" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Ajustes' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Ajustes</h2>
                    <p className="text-on-surface-variant mt-2 text-lg">Configura tu entorno de trabajo.</p>
                  </div>
                </div>

                <div className="max-w-2xl bg-surface-container-lowest rounded-[2rem] p-10 shadow-sm border border-surface-container-low">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-on-surface">Información de la Empresa</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center gap-6">
                          <div className="relative group">
                            <div className="w-24 h-24 bg-surface-container-low rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-surface-container-high group-hover:border-primary transition-colors">
                              {tempSettings.logoUrl ? (
                                <img src={tempSettings.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Upload className="w-8 h-8 text-on-surface-variant" />
                              )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Logo de la Empresa</label>
                            <p className="text-xs text-on-surface-variant">Haz clic en el cuadro para subir tu logo (PNG, JPG).</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Nombre de la Empresa</label>
                          <input 
                            type="text" 
                            value={tempSettings.companyName}
                            onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Tu Cargo / Rol</label>
                          <input 
                            type="text" 
                            value={tempSettings.userRole}
                            onChange={(e) => setTempSettings({ ...tempSettings, userRole: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-surface-container-low"></div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Percent className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-on-surface">Configuración de Impuestos</h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Tasa de IVA (ej. 0.19 para 19%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={tempSettings.ivaRate}
                          onChange={(e) => setTempSettings({ ...tempSettings, ivaRate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-surface-container-low"></div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-on-surface">Perfil de Usuario</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center gap-6">
                          <div className="relative group">
                            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-surface-container-high group-hover:border-primary transition-colors">
                              {tempSettings.userPhotoUrl ? (
                                <img src={tempSettings.userPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tempSettings.userName}`} alt="Default" className="w-full h-full object-cover opacity-50" />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleUserPhotoUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Foto de Perfil</label>
                            <p className="text-xs text-on-surface-variant">Haz clic en el avatar para subir tu foto personalizada.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Nombre de Usuario (para Avatar)</label>
                          <input 
                            type="text" 
                            value={tempSettings.userName}
                            onChange={(e) => setTempSettings({ ...tempSettings, userName: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={handleSaveSettings}
                        className="w-full btn-primary-gradient py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 px-10 flex items-center justify-between bg-surface-container-low/10 border-t border-surface-container-low">
          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">© 2024 Editorial Financial Intelligence</p>
          <div className="flex gap-8">
            <button className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors">Soporte</button>
            <button className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors">Privacidad</button>
            <button className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors">Términos</button>
          </div>
        </footer>
      </main>
    </div>
  );
}
