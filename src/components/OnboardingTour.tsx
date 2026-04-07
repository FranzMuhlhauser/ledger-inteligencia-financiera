import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  icon?: React.ElementType;
}

interface OnboardingTourProps {
  onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Ledger!',
    description: 'Tu asistente de inteligencia financiera. Te guiaremos por las funciones principales para que aproveches al máximo la aplicación.',
    icon: CheckCircle,
  },
  {
    id: 'dashboard',
    title: 'Panel de Control',
    description: 'Visualiza métricas clave: gasto total, facturas activas, proveedores y más. Usa el selector de período para ver datos por mes, trimestre o año.',
    targetId: 'dashboard-period-month',
  },
  {
    id: 'spaces',
    title: 'Espacios de Gastos',
    description: 'Organiza tus gastos en categorías personalizadas. Crea espacios con iconos, colores y presupuestos para mantener todo bajo control.',
  },
  {
    id: 'invoices',
    title: 'Gestión de Facturas',
    description: 'Registra facturas y boletas con todos los detalles: proveedor, fecha, valores, archivos adjuntos y asignación a espacios.',
  },
  {
    id: 'search',
    title: 'Búsqueda Avanzada',
    description: 'Encuentra facturas rápidamente usando la barra de búsqueda o los filtros avanzados: por tipo, proveedor, espacio, fecha y más.',
  },
  {
    id: 'analysis',
    title: 'Análisis',
    description: 'Analiza tendencias de gastos mensuales con gráficos interactivos. Filtra por rango de fechas para ver patrones específicos.',
  },
  {
    id: 'complete',
    title: '¡Listo para comenzar!',
    description: 'Ahora conoces las funciones básicas. ¡Empieza a registrar tus gastos y toma el control de tus finanzas!',
    icon: CheckCircle,
  },
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has completed tour before
    const hasCompletedTour = localStorage.getItem('ledger_onboarding_completed');
    if (hasCompletedTour === 'true') {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('ledger_onboarding_completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('ledger_onboarding_completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface-container-lowest rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-1.5 bg-surface-container-low w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-primary"
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-8 pb-0">
          <div className="flex-1">
            {Icon && (
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            )}
            <h2 className="text-2xl font-extrabold text-primary mb-2">{step.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
            title="Omitir tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-on-surface-variant leading-relaxed">{step.description}</p>
          
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep ? 'bg-primary w-6' : idx < currentStep ? 'bg-primary/40' : 'bg-surface-container-high'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 pt-0 gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          
          <button
            onClick={handleSkip}
            className="px-4 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Omitir
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 btn-primary-gradient px-6 py-3 rounded-xl font-bold"
          >
            {currentStep === TOUR_STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
