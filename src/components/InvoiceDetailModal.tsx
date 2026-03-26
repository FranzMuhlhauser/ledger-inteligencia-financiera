import React, { useEffect, useState } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export interface DetailInvoice {
  id: string;
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  valorNeto: number;
  iva: number;
  valorTotal: number;
  tipoDocumento?: string;
  descripcion?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  initials: string;
  color: string;
}

interface Props {
  invoice: DetailInvoice;
  space?: any;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const DOC_COLORS: Record<string, string> = {
  Boleta: 'bg-blue-100 text-blue-700',
  Factura: 'bg-indigo-100 text-indigo-700',
};

export default function InvoiceDetailModal({ invoice, space, onClose, onDelete }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isImage = invoice.archivoNombre
    ? /\.(jpg|jpeg|png|gif|webp)$/i.test(invoice.archivoNombre)
    : false;

  useEffect(() => {
    // Generate a 60-second signed URL for the file preview
    if (!invoice.archivoUrl) return;
    // archivoUrl stored as storage path like "userId/filename"
    supabase.storage
      .from('receipts')
      .createSignedUrl(invoice.archivoUrl, 60)
      .then(({ data }) => {
        if (data?.signedUrl) setSignedUrl(data.signedUrl);
      });
  }, [invoice.archivoUrl]);

  const Field = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-1">{label}</p>
      <p className="font-semibold text-on-surface">{value}</p>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${invoice.color} rounded-2xl flex items-center justify-center font-bold text-lg`}>
                {invoice.initials}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-primary">{invoice.proveedor}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-semibold text-on-surface-variant">{invoice.numeroFactura}</p>
                  {space && (
                    <span className="px-2 py-0.5 bg-surface-container-high rounded-full text-xs font-medium text-on-surface">
                      Espacio: {space.nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
                    onDelete(invoice.id);
                  }
                }} 
                className="p-2 text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                title="Eliminar factura"
              >
                <X className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface transition-colors">
                Cerrar
              </button>
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-1">Valor Total</p>
            <p className="text-4xl font-extrabold text-primary">${invoice.valorTotal.toLocaleString('es-CL')}</p>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Field label="Fecha" value={invoice.fecha} />
            <Field label="IVA" value={`$${invoice.iva.toLocaleString('es-CL')}`} />
            <Field label="Valor Neto" value={`$${invoice.valorNeto.toLocaleString('es-CL')}`} />
            <Field label="Tipo de Documento" value={invoice.tipoDocumento || '—'} />
          </div>

          {/* Description */}
          {invoice.descripcion && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-2">Descripción / Detalle</p>
              <p className="bg-surface-container-low rounded-xl p-4 text-sm text-on-surface leading-relaxed">{invoice.descripcion}</p>
            </div>
          )}

          {/* File preview */}
          {invoice.archivoNombre && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">
                Documento Adjunto
              </p>
              <div className="bg-surface-container-low rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-on-surface truncate">{invoice.archivoNombre}</span>
                  {signedUrl && (
                    <a href={signedUrl} target="_blank" rel="noreferrer"
                      className="ml-auto p-2 hover:bg-surface-container-high rounded-lg transition-colors text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {signedUrl && isImage && (
                  <img src={signedUrl} alt="Vista previa" className="w-full max-h-64 object-contain rounded-xl" />
                )}
                {signedUrl && !isImage && (
                  <iframe src={signedUrl} title="Vista previa PDF" className="w-full h-64 rounded-xl border-0" />
                )}
                {!signedUrl && (
                  <p className="text-xs text-on-surface-variant italic">Cargando vista previa...</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
