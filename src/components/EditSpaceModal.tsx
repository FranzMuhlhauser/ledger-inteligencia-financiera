import React, { useState } from 'react';
import { X, Folder, Home, Plane, Car, ShoppingBag, Heart, Briefcase, GraduationCap, Dumbbell, Palette, Utensils, Coffee, Music, Gamepad2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SpaceData {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  presupuesto?: number;
}

const SPACE_COLORS = [
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-600' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-600' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-600' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-600' },
  { name: 'teal', bg: 'bg-teal-100', text: 'text-teal-600' },
];

const SPACE_ICONS: Record<string, React.ElementType> = {
  folder: Folder, home: Home, plane: Plane, car: Car, shopping: ShoppingBag,
  heart: Heart, briefcase: Briefcase, graduation: GraduationCap, dumbbell: Dumbbell,
  palette: Palette, utensils: Utensils, coffee: Coffee, music: Music,
  gamepad: Gamepad2, smartphone: Smartphone,
};

interface Props {
  space: SpaceData;
  onSave: (updated: SpaceData) => void;
  onClose: () => void;
}

export default function EditSpaceModal({ space, onSave, onClose }: Props) {
  const [nombre, setNombre] = useState(space.nombre);
  const [icono, setIcono] = useState(space.icono);
  const [color, setColor] = useState(space.color);
  const [presupuesto, setPresupuesto] = useState(space.presupuesto?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ ...space, nombre: nombre.trim(), icono, color, presupuesto: parseFloat(presupuesto) || 0 });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-primary">Editar Espacio</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-2">Nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-2">Presupuesto Máximo (Opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                <input
                  type="number" value={presupuesto} onChange={e => setPresupuesto(e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">Ícono</label>
              <div className="grid grid-cols-8 gap-2">
                {Object.entries(SPACE_ICONS).map(([key, Icon]) => (
                  <button key={key} type="button" onClick={() => setIcono(key)}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      icono === key ? 'bg-primary text-white shadow-lg scale-110' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {SPACE_COLORS.map(sc => (
                  <button key={sc.name} type="button" onClick={() => setColor(sc.name)}
                    className={`h-10 rounded-xl ${sc.bg} transition-all ${
                      color === sc.name ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={!nombre.trim()}
                className="flex-1 btn-primary-gradient py-3 px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                Guardar Cambios
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
