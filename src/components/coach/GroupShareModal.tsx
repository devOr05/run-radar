import React, { useState } from 'react';
import { Group } from '../../types';
import { QrCode, Copy, Check, Share2, X, MessageCircle, ExternalLink } from 'lucide-react';

interface GroupShareModalProps {
  group: Group;
  onClose: () => void;
}

export const GroupShareModal: React.FC<GroupShareModalProps> = ({ group, onClose }) => {
  const [copied, setCopied] = useState(false);

  // URL dinámica que funciona tanto en localhost como en producción (Vercel)
  const inviteUrl = `${window.location.origin}/?join=${group.inviteCode}&group=${encodeURIComponent(group.name)}`;

  // Mensaje para WhatsApp con emojis y formato
  const whatsappMessage = `🏃 ¡Hola! Te invito a unirte a nuestro grupo de running *${group.name}* en RunRadar.

📲 Abre este enlace desde tu celular para ingresar directamente y seguir tus métricas y el estado del pelotón en vivo:
${inviteUrl}

Código de grupo: *${group.inviteCode}*`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      prompt('Copia este enlace:', inviteUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unirse a ${group.name} en RunRadar`,
          text: `Únete al grupo de entrenamiento ${group.name} en RunRadar`,
          url: inviteUrl,
        });
      } catch (e) {
        // Ignorar si el usuario canceló el diálogo
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Inter',sans-serif]"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Invitación al Grupo
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">
                {group.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border-4 border-slate-800">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`}
              alt={`QR para unirse a ${group.name}`}
              className="w-48 h-48 block mx-auto"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            El corredor escanea con la cámara de su celular y entra al instante.
          </p>
        </div>

        {/* Invite Code Pill */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
              Código de Acceso Rápido
            </span>
            <span className="text-xl font-black text-cyan-400 font-['JetBrains_Mono',monospace]">
              {group.inviteCode}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            {group.schedule || 'Sesión regular'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Mandar Invitación por WhatsApp</span>
          </a>

          {/* Copy Link Button */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>
          </div>
        </div>

        {/* Helper Note */}
        <p className="text-[11px] text-slate-500 text-center mt-4">
          Al abrir el enlace, el teléfono guardará su sesión para no volver a pedirle login.
        </p>

      </div>
    </div>
  );
};
