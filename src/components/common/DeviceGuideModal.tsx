import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { DeviceGuideContent } from './DeviceGuideContent';

interface DeviceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'cellular' | 'xiaomi' | 'amazfit' | 'garmin' | 'straps' | 'apple';
}

export const DeviceGuideModal: React.FC<DeviceGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'cellular'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#0e1422] border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0B0F19]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Guía de Dispositivos y Sensores</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Manual Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aprende cómo conectar cualquier reloj, banda o correr únicamente con tu celular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <DeviceGuideContent initialCategory={defaultTab} />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F19]/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            RunRadar • Telemetría universal para corredores y grupos
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition shadow-md shadow-cyan-500/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
