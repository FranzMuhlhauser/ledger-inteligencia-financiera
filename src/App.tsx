import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  Calendar,
  Plus,
  ChevronDown,
  TrendingUp,
  Upload,
  Trash2,
  DollarSign,
  User,
  Building2,
  Percent,
  LogOut,
  Folder,
  Home,
  Plane,
  Car,
  ShoppingBag,
  Heart,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Palette,
  Utensils,
  Coffee,
  Music,
  Gamepad2,
  Smartphone,
  X,
  Pencil,
  AlertTriangle,
  Download,
  FileDown,
  CheckCircle2,
  Paperclip,
  Clock,
  Filter,
  Receipt,
  ArrowRight,
  TrendingDown,
  Activity,
  Layers,
  ChevronRight,
  Target
} from 'lucide-react';
import EditSpaceModal from './components/EditSpaceModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import SearchFilters from './components/SearchFilters';
import HeaderSearchFilters from './components/HeaderSearchFilters';
import RecentSearches from './components/RecentSearches';
import { exportToCSV, exportToPDF } from './utils/export';
import { processFileForUpload } from './utils/imageCompression';
import { HighlightMatch } from './utils/highlightMatch';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { useLazyLoad } from './hooks/useLazyLoad';
import { useDebounce, useSearchFilters, useRecentSearches, SearchPreferences } from './hooks/useSearchFilters';
import {
  useSavedProveedores,
  LEDGER_SAVED_PROVEEDORES_DATALIST_ID,
  countNewProveedoresForImport,
} from './hooks/useSavedProveedores';
import { filterByDateScope, hasProveedorImportDateScope } from './utils/invoiceDateScope';
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
import OnboardingTour from './components/OnboardingTour';
import UndoToast from './components/UndoToast';
import { useUndoDelete } from './hooks/useUndoDelete';
import { autoCategorizeInvoice } from './utils/aiCategorization';

// --- Types ---
interface Space {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  presupuesto?: number;
}

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
  spaceId?: string | null;
  descripcion?: string;
  tipoDocumento?: string;
  archivoUrl?: string;
  archivoNombre?: string;
}

const SPACE_COLORS = [
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { name: 'teal', bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
];

const SPACE_ICONS: Record<string, React.ElementType> = {
  folder: Folder,
  home: Home,
  plane: Plane,
  car: Car,
  shopping: ShoppingBag,
  heart: Heart,
  briefcase: Briefcase,
  graduation: GraduationCap,
  dumbbell: Dumbbell,
  palette: Palette,
  utensils: Utensils,
  coffee: Coffee,
  music: Music,
  gamepad: Gamepad2,
  smartphone: Smartphone,
};

const INVOICE_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-orange-100 text-orange-600',
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-600',
];

// --- Create Space Form Component ---
interface CreateSpaceFormProps {
  onSubmit: (space: Space) => void;
  onCancel: () => void;
}

function CreateSpaceForm({ onSubmit, onCancel }: CreateSpaceFormProps) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('folder');
  const [color, setColor] = useState('blue');
  const [presupuesto, setPresupuesto] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSubmit({
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      icono,
      color,
      presupuesto: parseFloat(presupuesto) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-2">
          Nombre del Espacio
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. Vacaciones, Remodelación Casa..."
          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-2">
          Presupuesto Máximo (Opcional)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
          <input
            type="number"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            placeholder="0"
            className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">
          Ícono
        </label>
        <div className="grid grid-cols-8 gap-2">
          {Object.entries(SPACE_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcono(key)}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${icono === key
                ? 'bg-primary text-white shadow-lg scale-110'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">
          Color
        </label>
        <div className="grid grid-cols-8 gap-2">
          {SPACE_COLORS.map((spaceColor) => (
            <button
              key={spaceColor.name}
              type="button"
              onClick={() => setColor(spaceColor.name)}
              className={`h-10 rounded-xl ${spaceColor.bg} transition-all ${color === spaceColor.name
                ? 'ring-2 ring-primary ring-offset-2 scale-110'
                : 'hover:scale-105'
                }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim()}
          className="flex-1 btn-primary-gradient py-3 px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear Espacio
        </button>
      </div>
    </form>
  );
}

// --- Space Detail View Component ---
interface SpaceDetailViewProps {
  space: Space;
  invoices: Invoice[];
  onClose: () => void;
  onDeleteInvoice: (id: string) => void;
}

function SpaceDetailView({ space, invoices, onClose, onDeleteInvoice }: SpaceDetailViewProps) {
  const IconComponent = SPACE_ICONS[space.icono] || Folder;
  const spaceColor = SPACE_COLORS.find(c => c.name === space.color) || SPACE_COLORS[0];
  const totalGastado = invoices.reduce((sum, inv) => sum + inv.valorTotal, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 ${spaceColor.bg} ${spaceColor.text} rounded-2xl flex items-center justify-center`}>
            <IconComponent className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary">{space.nombre}</h2>
            <p className="text-on-surface-variant">{invoices.length} facturas registradas</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className={`${spaceColor.bg} ${spaceColor.text} rounded-2xl p-6 mb-6`}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold opacity-70 mb-1">Total Gastado</p>
        <p className="text-3xl font-extrabold">${totalGastado.toLocaleString('es-CL')}</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-on-surface mb-4">Facturas del Espacio</h3>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay facturas en este espacio aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between bg-surface-container-low rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${invoice.color} rounded-xl flex items-center justify-center font-bold text-sm`}>
                    {invoice.initials}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{invoice.proveedor}</p>
                    <p className="text-xs text-on-surface-variant">{invoice.numeroFactura} • {invoice.fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-on-surface">${invoice.valorTotal.toLocaleString('es-CL')}</p>
                  <button
                    onClick={() => onDeleteInvoice(invoice.id)}
                    className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const toast = useToast();
  const { pendingDeleteId, scheduleDelete, undoDelete, cancelPendingDelete } = useUndoDelete();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    message: string;
    itemId: string | null;
    itemType: 'invoice' | 'space' | null;
    restoreFn?: () => void;
  }>({
    visible: false,
    message: '',
    itemId: null,
    itemType: null
  });
  const [activeTab, setActiveTab] = useState('Panel Control');
  const invoiceNumberRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI State ---
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Search state with debounce and filters
  const { filters: searchFilters, updateFilter, clearFilters, applyFilters, clearStructuredFilters, hasActiveFilters } = useSearchFilters();
  const { savedProveedores, addSavedProveedor, removeSavedProveedor, importProveedoresFromInvoices } =
    useSavedProveedores();
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches(10);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isHoveringRecent, setIsHoveringRecent] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [showHeaderFilters, setShowHeaderFilters] = useState(false);
  const headerSearchAreaRef = useRef<HTMLDivElement>(null);

  // Debounced search query (300ms delay)
  const debouncedSearchQuery = useDebounce(searchFilters.searchQuery, 300);

  useEffect(() => {
    if (!showHeaderFilters) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (headerSearchAreaRef.current && !headerSearchAreaRef.current.contains(e.target as Node)) {
        setShowHeaderFilters(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showHeaderFilters]);

  useEffect(() => {
    if (!showHeaderFilters) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHeaderFilters(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHeaderFilters]);

  // --- Date Filter State (for Analysis tab) ---
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // --- Alert threshold (from settings localStorage) ---
  const alertThreshold = (settings as any).alertThreshold ?? 80;

  // Load spaces from Supabase when user logs in
  useEffect(() => {
    const loadSpaces = async () => {
      if (!user) { setSpaces([]); return; }
      try {
        const { data, error } = await supabase
          .from('spaces').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        if (error) throw error;
        if (data) setSpaces(data.map(s => ({ ...s, presupuesto: Number(s.presupuesto ?? 0) })));
      } catch (error) { console.error('Error loading spaces:', error); }
    };
    loadSpaces();
  }, [user]);

  // Save NEW space to Supabase
  const saveSpace = async (space: Space) => {
    if (!user) return;
    try {
      console.log('Attempting to save space:', { space, userId: user.id });
      const { data, error } = await supabase
        .from('spaces')
        .insert({ id: space.id, user_id: user.id, nombre: space.nombre, icono: space.icono, color: space.color, presupuesto: space.presupuesto ?? 0 })
        .select().single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Space saved successfully:', data);
      setSpaces(prev => {
        const filtered = prev.filter(s => s.id !== space.id);
        return [...filtered, { ...data, presupuesto: Number(data.presupuesto ?? 0) }];
      });
      toast.showSuccess('Espacio creado exitosamente');
    } catch (error: any) {
      console.error('Error saving space:', error);
      const errorMessage = error?.message || 'Error desconocido';
      setSpaces(prev => prev.filter(s => s.id !== space.id));
      toast.showError(`Error al guardar el espacio: ${errorMessage}`);
    }
  };

  // Update EXISTING space in Supabase
  const updateSpace = async (updated: Space) => {
    if (!user) return;
    setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s)); // optimistic
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ nombre: updated.nombre, icono: updated.icono, color: updated.color, presupuesto: updated.presupuesto ?? 0 })
        .eq('id', updated.id);
      if (error) throw error;
      toast.showSuccess('Espacio actualizado correctamente');
    } catch (error) {
      console.error('Error updating space:', error);
      toast.showError('Error al actualizar el espacio.');
    }
  };

  // Delete space from Supabase
  const deleteSpace = async (spaceId: string) => {
    if (!user) return;

    const spaceToDelete = spaces.find(s => s.id === spaceId);
    if (!spaceToDelete) return;

    try {
      // Optimistic update
      setSpaces(prev => prev.filter(s => s.id !== spaceId));

      // Schedule permanent delete after 5 seconds
      scheduleDelete(spaceId, async (id) => {
        try {
          const { error } = await supabase
            .from('spaces')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting space:', error);
          toast.showError('Error al eliminar el espacio.');
        }
      });

      // Show undo toast
      setUndoToast({
        visible: true,
        message: `Espacio "${spaceToDelete.nombre}" eliminado`,
        itemId: spaceId,
        itemType: 'space',
        restoreFn: () => {
          setSpaces(prev => [...prev, spaceToDelete]);
          cancelPendingDelete();
        }
      });

      toast.showSuccess('Espacio eliminado. Puedes deshacer esta acciÃ³n en 5 segundos.');
    } catch (error) {
      console.error('Error deleting space:', error);
      // Rollback
      setSpaces(prev => [...prev, spaceToDelete]);
      toast.showError('Error al eliminar el espacio. Por favor, intenta de nuevo.');
    }
  };

  // Load invoices from Supabase when user logs in
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user) { setInvoices([]); setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          setInvoices(data.map(inv => ({
            id: inv.id,
            numeroFactura: inv.numero_factura,
            fecha: inv.fecha,
            proveedor: inv.proveedor,
            valorNeto: Number(inv.valor_neto),
            iva: Number(inv.iva),
            valorTotal: Number(inv.valor_total),
            initials: inv.proveedor ? inv.proveedor.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '??',
            color: INVOICE_COLORS[Math.floor(inv.id.charCodeAt(0) % INVOICE_COLORS.length)],
            spaceId: inv.space_id,
            descripcion: inv.descripcion || '',
            tipoDocumento: inv.tipo_documento || 'Factura',
            archivoUrl: inv.archivo_url || '',
            archivoNombre: inv.archivo_nombre || '',
          })));
        }
      } catch (error) { console.error('Error loading invoices:', error); }
      finally { setLoading(false); }
    };
    loadInvoices();
  }, [user]);

  // --- Form State ---
  const [formData, setFormData] = useState({
    numeroFactura: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    valorNeto: '',
    descripcion: '',
    tipoDocumento: 'Factura',
  });
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- Form Validation ---
  const isFormValid = (): boolean => {
    return (
      formData.numeroFactura.trim().length >= 3 &&
      formData.proveedor.trim().length >= 3 &&
      formData.valorNeto !== '' &&
      !isNaN(parseFloat(formData.valorNeto)) &&
      parseFloat(formData.valorNeto) > 0 &&
      formData.fecha !== ''
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.numeroFactura.trim()) {
      errors.numeroFactura = 'El número de documento es requerido';
    } else if (formData.numeroFactura.trim().length < 3) {
      errors.numeroFactura = 'Mínimo 3 caracteres';
    }

    if (!formData.proveedor.trim()) {
      errors.proveedor = 'El proveedor es requerido';
    } else if (formData.proveedor.trim().length < 3) {
      errors.proveedor = 'Mínimo 3 caracteres';
    }

    if (!formData.valorNeto || isNaN(parseFloat(formData.valorNeto)) || parseFloat(formData.valorNeto) <= 0) {
      errors.valorNeto = 'Ingrese un valor neto válido mayor a 0';
    }

    if (!formData.fecha) {
      errors.fecha = 'La fecha es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Automatic Calculations ---
  const ivaRate = settings.ivaRate;
  const valorNetoNum = parseFloat(formData.valorNeto) || 0;
  const calculatedIva = Math.round(valorNetoNum * ivaRate);
  const calculatedTotal = valorNetoNum + calculatedIva;

  // --- Dashboard Period Selector ---
  const [dashboardPeriod, setDashboardPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // --- Summary Calculations ---
  const totalExpenditure = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.valorTotal, 0);
  }, [invoices]);

  const activeInvoicesCount = invoices.length;

  // --- Dashboard Period-Filtered Invoices ---
  const dashboardInvoices = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    return invoices.filter(inv => {
      const d = new Date(inv.fecha + 'T00:00:00');
      if (dashboardPeriod === 'month') {
        return d.getFullYear() === year && d.getMonth() === month;
      } else if (dashboardPeriod === 'quarter') {
        const qStart = new Date(year, Math.floor(month / 3) * 3, 1);
        return d >= qStart;
      } else if (dashboardPeriod === 'year') {
        return d.getFullYear() === year;
      }
      return true; // 'all'
    });
  }, [invoices, dashboardPeriod]);

  // --- Dashboard Computed Metrics ---
  const dashboardTotalGasto = useMemo(() => dashboardInvoices.reduce((s, i) => s + i.valorTotal, 0), [dashboardInvoices]);
  const dashboardTotalIva = useMemo(() => dashboardInvoices.reduce((s, i) => s + i.iva, 0), [dashboardInvoices]);
  const dashboardPromedioPorFactura = useMemo(() => dashboardInvoices.length > 0 ? dashboardTotalGasto / dashboardInvoices.length : 0, [dashboardTotalGasto, dashboardInvoices]);
  const dashboardEspaciosActivos = useMemo(() => new Set(dashboardInvoices.filter(i => i.spaceId).map(i => i.spaceId)).size, [dashboardInvoices]);
  const dashboardProveedoresUnicos = useMemo(() => new Set(dashboardInvoices.map(i => i.proveedor)).size, [dashboardInvoices]);

  // --- Dashboard Top Providers ---
  const dashboardTopProviders = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    dashboardInvoices.forEach(inv => {
      if (!grouped[inv.proveedor]) grouped[inv.proveedor] = { total: 0, count: 0 };
      grouped[inv.proveedor].total += inv.valorTotal;
      grouped[inv.proveedor].count += 1;
    });
    const sorted = Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const maxTotal = sorted[0]?.total || 1;
    return sorted.map(p => ({ ...p, pct: Math.round((p.total / maxTotal) * 100) }));
  }, [dashboardInvoices]);

  // --- Dashboard Space Breakdown ---
  const dashboardSpaceData = useMemo(() => {
    return spaces.map(space => {
      const spaceInvs = dashboardInvoices.filter(i => i.spaceId === space.id);
      return {
        name: space.nombre,
        total: spaceInvs.reduce((s, i) => s + i.valorTotal, 0),
        count: spaceInvs.length,
        color: space.color,
      };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  }, [dashboardInvoices, spaces]);

  // --- Dashboard Recent Invoices (last 5) ---
  const dashboardRecentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5);
  }, [invoices]);

  // --- Dashboard Trend Chart Data ---
  const dashboardChartData = useMemo(() => {
    const grouped = dashboardInvoices.reduce((acc: any, inv) => {
      const month = inv.fecha.slice(0, 7);
      acc[month] = (acc[month] || 0) + inv.valorTotal;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dashboardInvoices]);

  // --- Dashboard Provider Pie Data ---
  const dashboardProviderPieData = useMemo(() => {
    const grouped = dashboardInvoices.reduce((acc: any, inv) => {
      acc[inv.proveedor] = (acc[inv.proveedor] || 0) + inv.valorTotal;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
  }, [dashboardInvoices]);

  // --- Analysis Data ---
  const invoicesForProveedorImport = useMemo(
    () => filterByDateScope<Invoice>(invoices, dateFrom, dateTo, searchFilters),
    [invoices, dateFrom, dateTo, searchFilters]
  );

  const importProveedoresTitle = useMemo(() => {
    if (invoices.length === 0) return 'No hay facturas cargadas';
    if (invoicesForProveedorImport.length === 0) {
      return 'No hay facturas en el rango de fechas actual (Análisis o año/mes/día en filtros)';
    }
    if (hasProveedorImportDateScope(dateFrom, dateTo, searchFilters)) {
      return `Agregar proveedores de ${invoicesForProveedorImport.length} factura(s) en el rango de fechas actual`;
    }
    return `Agregar proveedores de todas las facturas (${invoices.length}). Definí fechas en Análisis o año/mes/día aquí para acotar.`;
  }, [invoices, invoicesForProveedorImport, dateFrom, dateTo, searchFilters]);

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(inv => {
      // Date filter (dateFrom/dateTo range)
      if (dateFrom && inv.fecha < dateFrom) return false;
      if (dateTo && inv.fecha > dateTo) return false;

      // Search query filter (debounced)
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesSearch =
          inv.numeroFactura.toLowerCase().includes(query) ||
          inv.proveedor.toLowerCase().includes(query) ||
          inv.descripcion?.toLowerCase().includes(query) ||
          inv.tipoDocumento?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Tipo de documento filter (Factura/Boleta)
      if (searchFilters.tipoDocumento !== 'todos' && inv.tipoDocumento !== searchFilters.tipoDocumento) {
        return false;
      }

      // Proveedor filter
      if (searchFilters.proveedor && !inv.proveedor.toLowerCase().includes(searchFilters.proveedor.toLowerCase())) {
        return false;
      }

      // Espacio filter
      if (searchFilters.spaceId && inv.spaceId !== searchFilters.spaceId) {
        return false;
      }

      // Número de factura filter
      if (searchFilters.numeroFactura && !inv.numeroFactura.toLowerCase().includes(searchFilters.numeroFactura.toLowerCase())) {
        return false;
      }

      // Fecha Año filter
      if (searchFilters.fechaAnio && !inv.fecha.startsWith(searchFilters.fechaAnio)) {
        return false;
      }

      // Fecha Mes filter
      if (searchFilters.fechaMes) {
        const invMonth = inv.fecha.slice(5, 7); // Extract MM from YYYY-MM-DD
        if (invMonth !== searchFilters.fechaMes) {
          return false;
        }
      }

      // Fecha Día filter (fecha en ISO usa día con cero a la izquierda)
      if (searchFilters.fechaDia) {
        const invDay = inv.fecha.slice(8, 10);
        const dayFilter = String(searchFilters.fechaDia).padStart(2, '0');
        if (invDay !== dayFilter) {
          return false;
        }
      }

      // Valor mínimo filter
      if (searchFilters.valorMinimo !== undefined && inv.valorTotal < searchFilters.valorMinimo) {
        return false;
      }

      // Valor máximo filter
      if (searchFilters.valorMaximo !== undefined && inv.valorTotal > searchFilters.valorMaximo) {
        return false;
      }

      // Con archivo filter
      if (searchFilters.conArchivo && !inv.archivoUrl) {
        return false;
      }

      return true;
    });

    return result;
  }, [invoices, dateFrom, dateTo, debouncedSearchQuery, searchFilters]);

  // Lazy loading for invoices table
  const { visibleItems: visibleInvoices, sentinelRef: invoicesSentinelRef } = useLazyLoad(filteredInvoices.length, { initialVisible: 50 });

  const chartData = useMemo(() => {
    const grouped = filteredInvoices.reduce((acc: any, inv) => {
      const month = inv.fecha.slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + inv.valorTotal;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredInvoices]);

  const providerData = useMemo(() => {
    const grouped = filteredInvoices.reduce((acc: any, inv) => {
      acc[inv.proveedor] = (acc[inv.proveedor] || 0) + inv.valorTotal;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredInvoices]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterInvoice = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      toast.showError('Por favor corrija los errores en el formulario');
      return;
    }

    if (!user) {
      return;
    }

    const initials = formData.proveedor
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const randomColor = INVOICE_COLORS[Math.floor(Math.random() * INVOICE_COLORS.length)];

    // Auto-categorize with AI if no space is selected and description exists
    let autoCategorizedSpaceId = selectedSpaceId;
    if (!selectedSpaceId && formData.descripcion && spaces.length > 0) {
      try {
        const suggestedSpaceId = await autoCategorizeInvoice(
          formData.proveedor,
          formData.descripcion,
          formData.tipoDocumento,
          valorNetoNum,
          spaces
        );
        if (suggestedSpaceId) {
          autoCategorizedSpaceId = suggestedSpaceId;
          const space = spaces.find(s => s.id === suggestedSpaceId);
          if (space) {
            toast.showInfo(`Sugerencia IA: Factura categorizada automÃ¡ticamente en "${space.nombre}"`);
          }
        }
      } catch (error) {
        console.warn('Auto-categorizaciÃ³n con IA fallÃ³, continuando sin categorÃ­a:', error);
      }
    }

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
      spaceId: autoCategorizedSpaceId,
      descripcion: formData.descripcion,
      tipoDocumento: formData.tipoDocumento,
    };

    // Validate file before uploading
    let archivoUrl = '';
    let archivoNombre = '';
    if (fileToUpload) {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(fileToUpload.type)) {
        toast.showError('Tipo de archivo no permitido. Solo PDF, JPG o PNG.');
        return;
      }
      if (fileToUpload.size > 5 * 1024 * 1024) {
        toast.showError('El archivo no puede superar 5 MB.');
        return;
      }

      try {
        // Compress image files before upload
        const fileToSave = fileToUpload.type.startsWith('image/')
          ? await processFileForUpload(fileToUpload, 2)
          : fileToUpload;

        const path = `${user.id}/${newInvoice.id}-${fileToSave.name}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(path, fileToSave);
        if (uploadError) {
          toast.showError('Error al subir el archivo. Verifica que el bucket "receipts" exista en Supabase Storage.');
          return;
        }
        archivoUrl = path;
        archivoNombre = fileToSave.name;
        newInvoice.archivoUrl = archivoUrl;
        newInvoice.archivoNombre = archivoNombre;
      } catch (error) {
        console.error('Error processing file:', error);
        toast.showError('Error al procesar el archivo. Inténtalo de nuevo.');
        return;
      }
    }

    try {
      console.log('Attempting to save invoice:', { newInvoice, userId: user.id });

      // Optimistic update
      setInvoices(prev => [newInvoice, ...prev]);

      const { error } = await supabase
        .from('invoices')
        .insert({
          id: newInvoice.id,
          user_id: user.id,
          numero_factura: newInvoice.numeroFactura,
          fecha: newInvoice.fecha,
          proveedor: newInvoice.proveedor,
          valor_neto: newInvoice.valorNeto,
          iva: newInvoice.iva,
          valor_total: newInvoice.valorTotal,
          space_id: autoCategorizedSpaceId || null,
          descripcion: newInvoice.descripcion,
          tipo_documento: newInvoice.tipoDocumento,
          archivo_url: archivoUrl || null,
          archivo_nombre: archivoNombre || null,
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Invoice saved successfully');
      addSavedProveedor(newInvoice.proveedor);
      toast.showSuccess('Factura registrada exitosamente');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      const errorMessage = error?.message || 'Error desconocido';
      setInvoices(prev => prev.filter(inv => inv.id !== newInvoice.id));
      toast.showError(`Error al guardar la factura: ${errorMessage}`);
      return;
    }

    // Reset form (keep date)
    setFormData(prev => ({ ...prev, numeroFactura: '', proveedor: '', valorNeto: '', descripcion: '', tipoDocumento: 'Factura' }));
    setSelectedSpaceId(null);
    setFileToUpload(null);

    // Focus back to invoice number for next entry
    invoiceNumberRef.current?.focus();
  };

  const handleImportProveedoresFromInvoices = useCallback(() => {
    if (invoices.length === 0) {
      toast.showInfo('No hay facturas cargadas para importar proveedores.');
      return;
    }
    const scoped = filterByDateScope<Invoice>(invoices, dateFrom, dateTo, searchFilters);
    if (scoped.length === 0) {
      toast.showInfo('No hay facturas en el rango de fechas seleccionado (revisá fechas en Análisis o año/mes/día en filtros).');
      return;
    }
    const names = scoped.map((i: Invoice) => i.proveedor);
    const added = countNewProveedoresForImport(names, savedProveedores);
    importProveedoresFromInvoices(names);
    const scopeMsg = hasProveedorImportDateScope(dateFrom, dateTo, searchFilters)
      ? ` (${scoped.length} factura(s) en el rango de fechas)`
      : '';
    if (added > 0) {
      toast.showSuccess(`Se agregaron ${added} proveedor(es) nuevos a la lista guardada${scopeMsg}.`);
    } else {
      toast.showInfo(`Todos los proveedores de ese conjunto ya estaban en la lista guardada${scopeMsg}.`);
    }
  }, [invoices, dateFrom, dateTo, searchFilters, savedProveedores, importProveedoresFromInvoices, toast]);

  const handleApplyHeaderFilters = useCallback(() => {
    setShowHeaderFilters(false);
    setActiveTab('Facturas');
    requestAnimationFrame(() => {
      document.getElementById('facturas-registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

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

  const handleDeleteInvoice = async (id: string) => {
    if (!user) return;

    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (!invoiceToDelete) return;

    try {
      // Optimistic update
      setInvoices(prev => prev.filter(inv => inv.id !== id));

      // Schedule permanent delete after 5 seconds
      scheduleDelete(id, async (invoiceId) => {
        try {
          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceId);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting invoice:', error);
          toast.showError('Error al eliminar la factura.');
        }
      });

      // Show undo toast
      setUndoToast({
        visible: true,
        message: 'Factura eliminada',
        itemId: id,
        itemType: 'invoice',
        restoreFn: () => {
          setInvoices(prev => [invoiceToDelete, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)));
          cancelPendingDelete();
        }
      });

      toast.showSuccess('Factura eliminada. Puedes deshacer esta acciÃ³n en 5 segundos.');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      // Rollback
      setInvoices(prev => [invoiceToDelete, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      toast.showError('Error al eliminar la factura.');
    }
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
      <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      <UndoToast
        message={undoToast.message}
        visible={undoToast.visible}
        onUndo={() => {
          if (undoToast.restoreFn) {
            undoToast.restoreFn();
          }
          setUndoToast({ visible: false, message: '', itemId: null, itemType: null });
          toast.showSuccess('AcciÃ³n deshecha correctamente');
        }}
        onDismiss={() => setUndoToast({ visible: false, message: '', itemId: null, itemType: null })}
      />
      <datalist id={LEDGER_SAVED_PROVEEDORES_DATALIST_ID}>
        {savedProveedores.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {/* Sidebar */}
      <aside className="w-60 bg-surface-container-low flex flex-col py-8 px-4 fixed h-full" role="navigation" aria-label="Menú principal">
        <div className="flex items-center gap-3 px-4 mb-12">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo de la empresa" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight leading-none">Ledger</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold mt-1">Inteligencia Financiera</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2" role="menubar" aria-label="Navegación principal">
          {[
            { name: 'Panel Control', icon: LayoutDashboard },
            { name: 'Espacios', icon: Folder },
            { name: 'Facturas', icon: FileText },
            { name: 'Análisis', icon: BarChart3 },
            { name: 'Ajustes', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              role="menuitem"
              aria-current={activeTab === item.name ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.name
                ? 'bg-surface-container-lowest text-primary shadow-sm border-r-4 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface'
                }`}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
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
          aria-label="Crear nueva factura"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Nueva Factura</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 flex flex-col">
        {/* Header */}
        <header className="h-20 bg-surface-container-lowest flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm/5" role="banner">
          <div ref={headerSearchAreaRef} className="relative w-full max-w-md min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar facturas... (presiona /)"
              aria-label="Buscar facturas"
              value={searchFilters.searchQuery}
              onChange={(e) => {
                updateFilter('searchQuery', e.target.value);
                setShowRecentSearches(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchFilters.searchQuery.trim()) {
                    addSearch(searchFilters.searchQuery, {
                      tipoDocumento: searchFilters.tipoDocumento,
                      valorMinimo: searchFilters.valorMinimo,
                      valorMaximo: searchFilters.valorMaximo,
                      proveedor: searchFilters.proveedor,
                      conArchivo: searchFilters.conArchivo,
                      spaceId: searchFilters.spaceId,
                      numeroFactura: searchFilters.numeroFactura,
                      fechaAnio: searchFilters.fechaAnio,
                      fechaMes: searchFilters.fechaMes,
                      fechaDia: searchFilters.fechaDia,
                    });
                  }
                  setShowRecentSearches(false);
                }
              }}
              onFocus={() => setShowRecentSearches(true)}
              onBlur={() => {
                // Only close if not hovering over the recent searches dropdown
                setTimeout(() => {
                  if (!isHoveringRecent) {
                    setShowRecentSearches(false);
                  }
                }, 150);
              }}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 pl-11 pr-10 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchFilters.searchQuery && (
                <button
                  onClick={() => updateFilter('searchQuery', '')}
                  className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowHeaderFilters((open) => !open);
                  setShowRecentSearches(false);
                }}
                className={`p-1.5 rounded-lg transition-all ${showHeaderFilters || hasActiveFilters ? 'bg-primary text-white shadow-md' : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                aria-expanded={showHeaderFilters}
                aria-label="Abrir o cerrar filtros de búsqueda"
                title="Filtros: tipo, fecha, proveedor, número, espacio"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Searches Dropdown */}
            <AnimatePresence>
              {showRecentSearches && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onMouseEnter={() => setIsHoveringRecent(true)}
                  onMouseLeave={() => setIsHoveringRecent(false)}
                >
                  <RecentSearches
                    recentSearches={recentSearches}
                    onRemoveSearch={removeSearch}
                    onClearAll={clearSearches}
                    onSelectSearch={(search) => {
                      applyFilters({
                        searchQuery: search.query,
                        tipoDocumento: search.filters.tipoDocumento ?? 'todos',
                        valorMinimo: search.filters.valorMinimo,
                        valorMaximo: search.filters.valorMaximo,
                        proveedor: search.filters.proveedor,
                        conArchivo: search.filters.conArchivo,
                        spaceId: search.filters.spaceId,
                        numeroFactura: search.filters.numeroFactura,
                        fechaAnio: search.filters.fechaAnio,
                        fechaMes: search.filters.fechaMes,
                        fechaDia: search.filters.fechaDia,
                      });
                      setShowRecentSearches(false);
                      setIsHoveringRecent(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHeaderFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <HeaderSearchFilters
                    filters={searchFilters}
                    onUpdateFilter={updateFilter}
                    onClearStructured={clearStructuredFilters}
                    spaces={spaces}
                    savedProveedores={savedProveedores}
                    onCommitProveedor={addSavedProveedor}
                    onRemoveSavedProveedor={removeSavedProveedor}
                    onImportProveedoresFromInvoices={handleImportProveedoresFromInvoices}
                    importProveedoresDisabled={invoicesForProveedorImport.length === 0}
                    importProveedoresTitle={importProveedoresTitle}
                    onApplyFilters={handleApplyHeaderFilters}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3" role="navigation" aria-label="Menú de usuario">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors" aria-label="Notificaciones">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-surface-container-high" role="separator" aria-hidden="true"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('Ajustes')}
                className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 rounded-2xl transition-all group"
                aria-label={`Configuración de ${settings.companyName}`}
              >
                <img
                  src={settings.userPhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.userName}`}
                  alt={`Foto de perfil de ${settings.userName}`}
                  className="w-11 h-11 rounded-xl bg-surface-container-low object-cover border border-surface-container-high group-hover:border-primary transition-colors shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-on-surface leading-none">{settings.companyName}</p>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" aria-hidden="true" />
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
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
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
                className="space-y-8"
              >
                {/* Header + Period Selector */}
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Panel de Control</h2>
                    <p className="text-on-surface-variant mt-2 text-lg">Resumen ejecutivo de tu salud financiera.</p>
                  </div>
                  {/* MEJORA 1: Selector de Período */}
                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-2xl">
                    {([
                      { key: 'month', label: 'Este Mes' },
                      { key: 'quarter', label: 'Trimestre' },
                      { key: 'year', label: 'Este Año' },
                      { key: 'all', label: 'Todo' },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        id={`dashboard-period-${key}`}
                        onClick={() => setDashboardPeriod(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${dashboardPeriod === key
                          ? 'bg-primary text-white shadow-md'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MEJORA 2: Cards de Métricas - Fila 1: Totales globales */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <DollarSign className="text-primary w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">TOTAL</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Gasto Total</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">${totalExpenditure.toLocaleString('es-CL')}</h4>
                    <p className="text-xs text-on-surface-variant mt-2">{invoices.length} facturas en total</p>
                  </div>
                  <div className="bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <FileText className="text-secondary w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">TOTAL</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Facturas Registradas</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">{invoices.length}</h4>
                    <p className="text-xs text-on-surface-variant mt-2">{new Set(invoices.map(i => i.proveedor)).size} proveedores distintos</p>
                  </div>
                  <div className="bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Building2 className="text-emerald-600 w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">TOTAL</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Proveedores Activos</p>
                    <h4 className="text-3xl font-extrabold text-on-surface">{new Set(invoices.map(i => i.proveedor)).size}</h4>
                    <p className="text-xs text-on-surface-variant mt-2">{spaces.length} espacios configurados</p>
                  </div>
                </div>

                {/* MEJORA 2: Cards de Desglose - Fila 2: Métricas del período */}
                <div className="grid grid-cols-4 gap-4">
                  <motion.div
                    key={`gasto-${dashboardPeriod}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-5 text-white"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 opacity-80" />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold opacity-80">Gasto del Período</span>
                    </div>
                    <p className="text-2xl font-extrabold">${dashboardTotalGasto.toLocaleString('es-CL')}</p>
                    <p className="text-xs opacity-70 mt-1">{dashboardInvoices.length} facturas</p>
                  </motion.div>
                  <motion.div
                    key={`iva-${dashboardPeriod}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-low shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Percent className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">IVA Acumulado</span>
                    </div>
                    <p className="text-2xl font-extrabold text-on-surface">${dashboardTotalIva.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{settings.ivaRate * 100}% del neto</p>
                  </motion.div>
                  <motion.div
                    key={`prom-${dashboardPeriod}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-low shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Promedio / Factura</span>
                    </div>
                    <p className="text-2xl font-extrabold text-on-surface">${Math.round(dashboardPromedioPorFactura).toLocaleString('es-CL')}</p>
                    <p className="text-xs text-on-surface-variant mt-1">por documento</p>
                  </motion.div>
                  <motion.div
                    key={`esp-${dashboardPeriod}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-low shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Espacios Usados</span>
                    </div>
                    <p className="text-2xl font-extrabold text-on-surface">{dashboardEspaciosActivos}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{dashboardProveedoresUnicos} proveedores</p>
                  </motion.div>
                </div>

                {/* Row: Tendencia + MEJORA 3: Top Proveedores */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Tendencia de Gastos */}
                  <div className="col-span-7 bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <h3 className="text-base font-bold text-on-surface mb-5">Tendencia de Gastos</h3>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v / 1000}k`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Total']}
                          />
                          <Line type="monotone" dataKey="total" stroke="#1a1a8f" strokeWidth={3} dot={{ r: 4, fill: '#1a1a8f' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* MEJORA 3: Top Proveedores con detalle */}
                  <div className="col-span-5 bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-bold text-on-surface">Top Proveedores</h3>
                      <span className="text-xs text-on-surface-variant font-semibold bg-surface-container-low px-2 py-1 rounded-lg">Top 5</span>
                    </div>
                    {dashboardTopProviders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
                        <Building2 className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">Sin datos en el período</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dashboardTopProviders.map((prov, idx) => (
                          <div key={prov.name} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-bold text-on-surface-variant w-4 flex-shrink-0">#{idx + 1}</span>
                                <p className="text-sm font-semibold text-on-surface truncate">{prov.name}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-[10px] text-on-surface-variant">{prov.count} fact.</span>
                                <span className="text-sm font-bold text-on-surface">${prov.total.toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${prov.pct}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.08 }}
                                className={`h-full rounded-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-primary/70' : idx === 2 ? 'bg-primary/50' : 'bg-primary/30'
                                  }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* MEJORA 4: Gasto por Espacio + MEJORA 5: Últimas Facturas */}
                <div className="grid grid-cols-12 gap-6">
                  {/* MEJORA 4: Gasto por Espacio - BarChart horizontal */}
                  <div className="col-span-6 bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <h3 className="text-base font-bold text-on-surface mb-5">Gasto por Espacio</h3>
                    {dashboardSpaceData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
                        <Folder className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">Sin gastos en espacios para este período</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const maxTotal = dashboardSpaceData[0]?.total || 1;
                          const colorMap: Record<string, string> = {
                            blue: '#3b82f6', orange: '#f97316', indigo: '#6366f1',
                            emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b',
                            purple: '#a855f7', teal: '#14b8a6',
                          };
                          return dashboardSpaceData.map((space, idx) => (
                            <div key={space.name}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-on-surface">{space.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-on-surface-variant">{space.count} fact.</span>
                                  <span className="text-sm font-bold text-on-surface">${space.total.toLocaleString('es-CL')}</span>
                                </div>
                              </div>
                              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((space.total / maxTotal) * 100)}%` }}
                                  transition={{ duration: 0.6, delay: idx * 0.07 }}
                                  style={{ backgroundColor: colorMap[space.color] || '#94a3b8' }}
                                  className="h-full rounded-full"
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* MEJORA 5: Últimas Facturas - Feed de Actividad */}
                  <div className="col-span-6 bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-bold text-on-surface">Actividad Reciente</h3>
                      <button
                        id="dashboard-ver-todas-facturas"
                        onClick={() => setActiveTab('Facturas')}
                        className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                      >
                        Ver todas <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {dashboardRecentInvoices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
                        <Receipt className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">Sin facturas registradas</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {dashboardRecentInvoices.map((inv) => {
                          const space = spaces.find(s => s.id === inv.spaceId);
                          const spaceColor = space ? (SPACE_COLORS.find(c => c.name === space.color) || SPACE_COLORS[0]) : null;
                          return (
                            <button
                              key={inv.id}
                              id={`dashboard-invoice-${inv.id}`}
                              onClick={() => setDetailInvoice(inv)}
                              className="w-full flex items-center justify-between bg-surface-container-low hover:bg-surface-container-high rounded-xl px-4 py-3 transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 ${inv.color} rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                  {inv.initials}
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-sm font-semibold text-on-surface truncate">{inv.proveedor}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[11px] text-on-surface-variant">{inv.fecha}</p>
                                    {space && spaceColor && (
                                      <span className={`text-[10px] font-bold ${spaceColor.text} ${spaceColor.bg} px-1.5 py-0.5 rounded-md`}>
                                        {space.nombre}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-bold text-on-surface">${inv.valorTotal.toLocaleString('es-CL')}</span>
                                <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Espacios' && (() => {
              // Compute budget alerts
              const budgetAlerts = spaces.filter(s => {
                if (!s.presupuesto || s.presupuesto <= 0) return false;
                const gastado = invoices.filter(i => i.spaceId === s.id).reduce((sum, i) => sum + i.valorTotal, 0);
                return (gastado / s.presupuesto) * 100 >= alertThreshold;
              });
              return (
                <motion.div
                  key="spaces"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-4xl font-extrabold text-primary tracking-tight">Espacios de Gastos</h2>
                      <p className="text-on-surface-variant mt-2 text-lg">Organiza tus gastos por categorías personalizadas.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateSpaceModal(true)}
                      className="flex items-center gap-2 btn-primary-gradient px-6 py-3 rounded-xl font-bold"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Nuevo Espacio</span>
                    </button>
                  </div>

                  {/* Alert Banner */}
                  {budgetAlerts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-amber-800 text-sm">Alertas de Presupuesto</p>
                        <p className="text-amber-700 text-sm">
                          {budgetAlerts.map(s => s.nombre).join(', ')} {budgetAlerts.length === 1 ? 'ha' : 'han'} alcanzado el {alertThreshold}% del presupuesto.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {spaces.map((space) => {
                          const IconComponent = SPACE_ICONS[space.icono] || Folder;
                          const spaceColor = SPACE_COLORS.find(c => c.name === space.color) || SPACE_COLORS[0];
                          const spaceInvoices = invoices.filter(inv => inv.spaceId === space.id);
                          const totalGastado = spaceInvoices.reduce((sum, inv) => sum + inv.valorTotal, 0);
                          const presupuesto = space.presupuesto ?? 0;
                          const pct = presupuesto > 0 ? Math.min((totalGastado / presupuesto) * 100, 100) : 0;
                          const barColor = pct >= 100 ? 'bg-red-500' : pct >= alertThreshold ? 'bg-amber-400' : 'bg-emerald-500';

                          return (
                            <motion.div
                              key={space.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedSpace(space)}
                              className={`${spaceColor.bg} ${spaceColor.text} rounded-[2rem] p-6 cursor-pointer border-2 ${spaceColor.border} transition-all hover:shadow-lg`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className={`w-14 h-14 ${spaceColor.bg} rounded-2xl flex items-center justify-center`}>
                                  <IconComponent className="w-7 h-7" />
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingSpace(space); }}
                                    className="p-2 hover:bg-black/10 rounded-xl transition-colors"
                                    title="Editar espacio"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteSpace(space.id); }}
                                    className="p-2 hover:bg-black/10 rounded-xl transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <h3 className="text-xl font-bold mb-1">{space.nombre}</h3>
                              <p className="text-sm opacity-70 mb-2">{spaceInvoices.length} facturas</p>
                              <p className="text-2xl font-extrabold mb-3">${totalGastado.toLocaleString('es-CL')}</p>
                              {presupuesto > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs font-semibold mb-1 opacity-80">
                                    <span>Presupuesto: ${presupuesto.toLocaleString('es-CL')}</span>
                                    <span>{Math.round((totalGastado / presupuesto) * 100)}%</span>
                                  </div>
                                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.6 }}
                                      className={`h-full rounded-full ${barColor}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}

                        {/* Empty State */}
                        {spaces.length === 0 && (
                          <div className="col-span-full bg-surface-container-low rounded-[2rem] p-12 text-center">
                            <Folder className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-on-surface mb-2">Sin espacios</h3>
                            <p className="text-on-surface-variant mb-6">Crea tu primer espacio para organizar tus gastos</p>
                            <button onClick={() => setShowCreateSpaceModal(true)} className="btn-primary-gradient px-6 py-3 rounded-xl font-bold">
                              Crear primer espacio
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}


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
                  <div className="flex gap-3">
                    <button
                      onClick={() => exportToCSV(invoices)}
                      className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-xl text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => exportToPDF(invoices)}
                      className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-xl text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl text-primary font-bold text-sm ml-2">
                      <Calendar className="w-4 h-4" />
                      <span className="uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                    </div>
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
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Tipo de Documento</label>
                        <select
                          name="tipoDocumento"
                          value={formData.tipoDocumento}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="Factura">Factura</option>
                          <option value="Boleta">Boleta</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Nº de Documento</label>
                        <input
                          ref={invoiceNumberRef}
                          type="text"
                          name="numeroFactura"
                          value={formData.numeroFactura}
                          onChange={handleInputChange}
                          placeholder="ej. F-2024-001"
                          aria-invalid={!!formErrors.numeroFactura}
                          aria-describedby={formErrors.numeroFactura ? 'numeroFactura-error' : undefined}
                          className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 ${formErrors.numeroFactura ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                            }`}
                        />
                        {formErrors.numeroFactura && (
                          <p id="numeroFactura-error" className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formErrors.numeroFactura}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Fecha</label>
                        <input
                          type="date"
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleInputChange}
                          aria-invalid={!!formErrors.fecha}
                          aria-describedby={formErrors.fecha ? 'fecha-error' : undefined}
                          className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 ${formErrors.fecha ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                            }`}
                        />
                        {formErrors.fecha && (
                          <p id="fecha-error" className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formErrors.fecha}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Proveedor</label>
                        <input
                          type="text"
                          name="proveedor"
                          list={LEDGER_SAVED_PROVEEDORES_DATALIST_ID}
                          value={formData.proveedor}
                          onChange={handleInputChange}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v.length >= 3) addSavedProveedor(v);
                          }}
                          placeholder="ej. Global Logistics Corp"
                          autoComplete="off"
                          aria-invalid={!!formErrors.proveedor}
                          aria-describedby={formErrors.proveedor ? 'proveedor-error' : undefined}
                          className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 ${formErrors.proveedor ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                            }`}
                        />
                        {formErrors.proveedor && (
                          <p id="proveedor-error" className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formErrors.proveedor}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Descripción / Nota</label>
                        <input
                          type="text"
                          name="descripcion"
                          value={formData.descripcion}
                          onChange={handleInputChange}
                          placeholder="ej. Compra de materiales de oficina..."
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Archivo Adjunto (Opcional)</label>
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                          className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
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
                            aria-invalid={!!formErrors.valorNeto}
                            aria-describedby={formErrors.valorNeto ? 'valorNeto-error' : undefined}
                            className={`w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary/20 ${formErrors.valorNeto ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                              }`}
                          />
                        </div>
                        {formErrors.valorNeto && (
                          <p id="valorNeto-error" className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formErrors.valorNeto}
                          </p>
                        )}
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
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">Espacio (Opcional)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSpaceId(null)}
                            className={`py-3 px-4 rounded-xl font-medium transition-all ${selectedSpaceId === null
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                              }`}
                          >
                            Sin espacio
                          </button>
                          {spaces.map((space) => {
                            const IconComponent = SPACE_ICONS[space.icono] || Folder;
                            const spaceColor = SPACE_COLORS.find(c => c.name === space.color) || SPACE_COLORS[0];
                            return (
                              <button
                                key={space.id}
                                type="button"
                                onClick={() => setSelectedSpaceId(space.id)}
                                className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedSpaceId === space.id
                                  ? `${spaceColor.bg} ${spaceColor.text} ring-2 ring-primary shadow-md`
                                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                                  }`}
                              >
                                <IconComponent className="w-4 h-4" />
                                <span className="truncate">{space.nombre}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        onClick={handleRegisterInvoice}
                        disabled={!isFormValid()}
                        className="btn-primary-gradient px-10 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Registrar factura"
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

                  {/* Search Filters Panel - Always Visible */}
                  <SearchFilters
                    filters={searchFilters}
                    onUpdateFilter={updateFilter}
                    onClearFilters={clearFilters}
                    spaces={spaces}
                    resultCount={filteredInvoices.length}
                    savedProveedores={savedProveedores}
                    onCommitProveedor={addSavedProveedor}
                    onRemoveSavedProveedor={removeSavedProveedor}
                    onImportProveedoresFromInvoices={handleImportProveedoresFromInvoices}
                    importProveedoresDisabled={invoicesForProveedorImport.length === 0}
                    importProveedoresTitle={importProveedoresTitle}
                  />

                  <div
                    id="facturas-registro"
                    className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border border-surface-container-low scroll-mt-24"
                  >
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
                          {filteredInvoices.length === 0 ? (
                            <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <td colSpan={7} className="py-20 text-center text-on-surface-variant italic">
                                {hasActiveFilters ? (
                                  <div>
                                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p className="font-bold text-lg">No se encontraron facturas</p>
                                    <p className="text-sm mt-2">Intenta con otros filtros o términos de búsqueda</p>
                                    <button
                                      onClick={clearFilters}
                                      className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                      Limpiar filtros
                                    </button>
                                  </div>
                                ) : searchFilters.searchQuery ? (
                                  <div>
                                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p className="font-bold text-lg">No se encontraron facturas</p>
                                    <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
                                  </div>
                                ) : (
                                  'No hay facturas registradas aún.'
                                )}
                              </td>
                            </motion.tr>
                          ) : (
                            <>
                              {filteredInvoices.slice(0, visibleInvoices).map((invoice) => (
                                <motion.tr
                                  key={invoice.id}
                                  layout
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  onClick={() => setDetailInvoice(invoice)}
                                  className="group hover:bg-surface-container-low/30 transition-colors cursor-pointer"
                                >
                                  <td className="py-6 px-8 text-sm font-bold text-primary">
                                    <HighlightMatch
                                      text={invoice.numeroFactura}
                                      query={searchFilters.searchQuery}
                                      highlightClassName="bg-yellow-200 text-on-surface font-bold px-0.5 rounded"
                                    />
                                    {invoice.archivoUrl && <Paperclip className="inline-block ml-2 w-3.5 h-3.5 text-on-surface-variant" />}
                                  </td>
                                  <td className="py-6 px-8 text-sm font-medium text-on-surface">{invoice.fecha}</td>
                                  <td className="py-6 px-8">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${invoice.color}`}>
                                        {invoice.initials}
                                      </div>
                                      <HighlightMatch
                                        text={invoice.proveedor}
                                        query={searchFilters.searchQuery}
                                        highlightClassName="bg-yellow-200 text-on-surface font-bold px-0.5 rounded"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-6 px-8 text-sm font-medium text-on-surface-variant text-right">${invoice.valorNeto.toLocaleString('es-CL')}</td>
                                  <td className="py-6 px-8 text-sm font-medium text-on-surface-variant text-right">${invoice.iva.toLocaleString('es-CL')}</td>
                                  <td className="py-6 px-8 text-sm font-extrabold text-primary text-right">${invoice.valorTotal.toLocaleString('es-CL')}</td>
                                  <td className="py-6 px-8 text-center">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }}
                                      className="p-2 text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                      aria-label={`Eliminar factura ${invoice.numeroFactura}`}
                                    >
                                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                  </td>
                                </motion.tr>
                              ))}
                              {visibleInvoices < filteredInvoices.length && (
                                <tr ref={invoicesSentinelRef}>
                                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                      <span>Cargando más facturas...</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
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
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-2 rounded-2xl shadow-sm border border-surface-container-low">
                    <div className="flex items-center gap-2 px-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Filtro:</span>
                    </div>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-on-surface-variant text-sm font-medium">-</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
                        title="Limpiar filtros"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
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
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
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

          {/* Create Space Modal */}
          <AnimatePresence>
            {showCreateSpaceModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateSpaceModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-extrabold text-primary">Crear Nuevo Espacio</h2>
                    <button
                      onClick={() => setShowCreateSpaceModal(false)}
                      className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <CreateSpaceForm
                    onSubmit={(newSpace) => {
                      setSpaces(prev => [...prev, newSpace]);
                      saveSpace(newSpace);
                      setShowCreateSpaceModal(false);
                    }}
                    onCancel={() => setShowCreateSpaceModal(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Space Detail View Modal */}
          <AnimatePresence>
            {selectedSpace && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedSpace(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <SpaceDetailView
                    space={selectedSpace}
                    invoices={invoices.filter(inv => inv.spaceId === selectedSpace.id)}
                    onClose={() => setSelectedSpace(null)}
                    onDeleteInvoice={handleDeleteInvoice}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Space Modal */}
          <AnimatePresence>
            {editingSpace && (
              <EditSpaceModal
                space={editingSpace}
                onClose={() => setEditingSpace(null)}
                onSave={(updated) => {
                  updateSpace(updated);
                  setEditingSpace(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Invoice Detail Modal */}
          <AnimatePresence>
            {detailInvoice && (
              <InvoiceDetailModal
                invoice={detailInvoice}
                space={spaces.find(s => s.id === detailInvoice.spaceId)}
                onClose={() => setDetailInvoice(null)}
                onDelete={(id) => {
                  handleDeleteInvoice(id);
                  setDetailInvoice(null);
                }}
              />
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
