import React from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  FileText,
  Building2,
  TrendingUp,
  Percent,
  Target,
  Layers,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';

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

interface DashboardPageProps {
  invoices: Invoice[];
  spaces: Space[];
  totalExpenditure: number;
  settings: any;
}

const SPACE_COLORS: Record<string, string> = {
  blue: '#3b82f6', orange: '#f97316', indigo: '#6366f1',
  emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b',
  purple: '#a855f7', teal: '#14b8a6',
};

export default function DashboardPage({
  invoices,
  spaces,
  totalExpenditure,
  settings,
}: DashboardPageProps) {
  const [dashboardPeriod, setDashboardPeriod] = React.useState<'month' | 'quarter' | 'year' | 'all'>('month');

  const dashboardInvoices = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

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
      return true;
    });
  }, [invoices, dashboardPeriod]);

  const dashboardTotalGasto = React.useMemo(() => dashboardInvoices.reduce((s, i) => s + i.valorTotal, 0), [dashboardInvoices]);
  const dashboardTotalIva = React.useMemo(() => dashboardInvoices.reduce((s, i) => s + i.iva, 0), [dashboardInvoices]);
  const dashboardPromedioPorFactura = React.useMemo(() => dashboardInvoices.length > 0 ? dashboardTotalGasto / dashboardInvoices.length : 0, [dashboardTotalGasto, dashboardInvoices]);
  const dashboardEspaciosActivos = React.useMemo(() => new Set(dashboardInvoices.filter(i => i.spaceId).map(i => i.spaceId)).size, [dashboardInvoices]);
  const dashboardProveedoresUnicos = React.useMemo(() => new Set(dashboardInvoices.map(i => i.proveedor)).size, [dashboardInvoices]);

  const dashboardTopProviders = React.useMemo(() => {
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

  const dashboardSpaceData = React.useMemo(() => {
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

  const dashboardRecentInvoices = React.useMemo(() => {
    return [...invoices]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5);
  }, [invoices]);

  const dashboardChartData = React.useMemo(() => {
    const grouped = dashboardInvoices.reduce((acc: any, inv) => {
      const month = inv.fecha.slice(0, 7);
      acc[month] = (acc[month] || 0) + inv.valorTotal;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dashboardInvoices]);

  return (
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
          <p className="text-on-surface-variant mt-2 text-lg">Visualiza métricas clave de tu negocio.</p>
        </div>
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

      {/* Cards de Métricas - Fila 1 */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          title="Gasto Total"
          value={`$${totalExpenditure.toLocaleString('es-CL')}`}
          subtitle={`${invoices.length} facturas en total`}
          icon={DollarSign}
          badge="TOTAL"
        />
        <MetricCard
          title="Facturas Registradas"
          value={invoices.length}
          subtitle={`${new Set(invoices.map(i => i.proveedor)).size} proveedores distintos`}
          icon={FileText}
          badge="TOTAL"
        />
        <MetricCard
          title="Proveedores Activos"
          value={new Set(invoices.map(i => i.proveedor)).size}
          subtitle={`${spaces.length} espacios configurados`}
          icon={Building2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          badge="TOTAL"
        />
      </div>

      {/* Cards de Desglose - Fila 2 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Gasto del Período"
          value={`$${dashboardTotalGasto.toLocaleString('es-CL')}`}
          subtitle={`${dashboardInvoices.length} facturas`}
          icon={TrendingUp}
          iconColor="text-white"
          iconBg="bg-white/20"
          variant="primary"
        />
        <MetricCard
          title="IVA Acumulado"
          value={`$${dashboardTotalIva.toLocaleString('es-CL')}`}
          subtitle={`${settings.ivaRate * 100}% del neto`}
          icon={Percent}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
        />
        <MetricCard
          title="Promedio / Factura"
          value={`$${Math.round(dashboardPromedioPorFactura).toLocaleString('es-CL')}`}
          subtitle="por documento"
          icon={Target}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50"
        />
        <MetricCard
          title="Espacios Usados"
          value={dashboardEspaciosActivos}
          subtitle={`${dashboardProveedoresUnicos} proveedores`}
          icon={Layers}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Row: Tendencia + Top Proveedores */}
      <div className="grid grid-cols-12 gap-6">
        <ChartContainer
          title="Tendencia de Gastos"
          className="col-span-7"
          emptyState={dashboardChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-on-surface-variant">
              <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin datos en el período</p>
            </div>
          ) : undefined}
        >
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
        </ChartContainer>

        <ChartContainer
          title="Top Proveedores"
          badge="Top 5"
          className="col-span-5"
          emptyState={dashboardTopProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-on-surface-variant">
              <Building2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin datos en el período</p>
            </div>
          ) : undefined}
        >
          {dashboardTopProviders.length > 0 && (
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
        </ChartContainer>
      </div>

      {/* Gasto por Espacio + Últimas Facturas */}
      <div className="grid grid-cols-12 gap-6">
        <ChartContainer
          title="Gasto por Espacio"
          className="col-span-6"
          emptyState={dashboardSpaceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
              <Layers className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin gastos en espacios para este período</p>
            </div>
          ) : undefined}
        >
          {dashboardSpaceData.length > 0 && (
            <div className="space-y-3">
              {(() => {
                const maxTotal = dashboardSpaceData[0]?.total || 1;
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
                        style={{ backgroundColor: SPACE_COLORS[space.color] || '#94a3b8' }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </ChartContainer>

        <div className="col-span-6 bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-on-surface">Actividad Reciente</h3>
          </div>
          {dashboardRecentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
              <Receipt className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin facturas registradas</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dashboardRecentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 ${inv.color} rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {inv.initials}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{inv.proveedor}</p>
                      <p className="text-[11px] text-on-surface-variant">{inv.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-on-surface">${inv.valorTotal.toLocaleString('es-CL')}</span>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
