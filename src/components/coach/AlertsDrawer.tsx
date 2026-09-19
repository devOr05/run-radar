import React from 'react';
import { useRadar } from '../../context/RadarContext';
import { formatRelativeTime } from '../../lib/calculations';
import { X, Bell, CheckCheck, AlertCircle, AlertTriangle, User } from 'lucide-react';

interface AlertsDrawerProps {
  onClose: () => void;
  onSelectAthlete: (athleteId: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ onClose, onSelectAthlete }) => {
  const { alerts, acknowledgeAlert } = useRadar();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-radar-card border-l border-radar-border p-6 shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-radar-border mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Centro de Alertas</h2>
                <p className="text-xs text-slate-400">Notificaciones automáticas en tiempo real</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-[#0B0F19] border border-radar-border transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Listado de Alertas */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCheck className="w-12 h-12 mx-auto mb-2 text-emerald-400/50" />
                <p className="text-sm font-medium text-slate-300">Todo el grupo bajo control</p>
                <p className="text-xs text-slate-500 mt-1">No hay alertas activas en este momento.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition ${
                    alert.acknowledged
                      ? 'bg-[#0B0F19]/40 border-radar-border/50 opacity-60'
                      : alert.severity === 'alert'
                      ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-500/10'
                      : 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {alert.severity === 'alert' ? (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-sm text-white">
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2.5 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => {
                        onSelectAthlete(alert.athleteId);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{alert.athleteName}</span>
                    </button>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[11px] px-2.5 py-1 rounded bg-[#0B0F19] text-slate-300 hover:text-white border border-radar-border hover:border-slate-600 transition"
                      >
                        Entendido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
