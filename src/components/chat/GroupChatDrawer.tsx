import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { GroupChatMessage } from '../../types';
import { X, Send, MessageSquare, Users, Sparkles } from 'lucide-react';

interface GroupChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const GroupChatDrawer: React.FC<GroupChatDrawerProps> = ({ isOpen, onClose, groupId }) => {
  const { currentRunner, coach, userRole, groups, groupMessages, sendGroupChatMessage } = useRadar();
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const currentGroup = groups.find(g => g.id === groupId) || groups[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const senderName = userRole === 'coach' 
      ? (coach?.name || 'Entrenador')
      : (currentRunner ? `${currentRunner.name} ${currentRunner.lastName}`.trim() : 'Corredor');

    const senderId = userRole === 'coach' ? (coach?.id || 'coach-1') : (currentRunner?.id || 'runner-1');

    if (sendGroupChatMessage) {
      sendGroupChatMessage({
        groupId: currentGroup?.id || 'general',
        senderId,
        senderName,
        senderRole: userRole === 'coach' ? 'coach' : 'runner',
        text: inputText.trim()
      });
    }

    setInputText('');
  };

  const filteredMessages = (groupMessages || []).filter(
    m => m.groupId === currentGroup?.id || m.groupId === 'all'
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0B0F19] border-l border-radar-border h-full flex flex-col shadow-2xl">
        
        {/* Cabecera del Chat */}
        <div className="p-4 border-b border-radar-border flex items-center justify-between bg-radar-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Chat del Pelotón
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {currentGroup?.name || 'Grupo'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Mensajes entre corredores y entrenador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Users className="w-8 h-8 opacity-40" />
              <p className="text-xs">No hay mensajes aún en este grupo.</p>
              <p className="text-[11px] text-slate-600">¡Sé el primero en enviar un saludo o aviso de entrenamiento!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = userRole === 'coach' ? msg.senderRole === 'coach' : msg.senderId === currentRunner?.id;
              const isCoach = msg.senderRole === 'coach';

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className={`text-[10px] font-bold ${isCoach ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {msg.senderName} {isCoach && '👑 (DT)'}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    isMe 
                      ? 'bg-cyan-500 text-black font-medium rounded-tr-none' 
                      : isCoach
                        ? 'bg-amber-950/50 border border-amber-500/40 text-amber-200 rounded-tl-none'
                        : 'bg-slate-800/90 text-white rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Atajos Rápidos */}
        <div className="px-4 py-2 border-t border-radar-border/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {['¡Vamos equipo! 💪', 'En punto de encuentro 📍', 'Buen ritmo 🎯', 'Llego en 5 min ⏱️'].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => setInputText(quick)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 whitespace-nowrap transition"
            >
              {quick}
            </button>
          ))}
        </div>

        {/* Input de Envío */}
        <form onSubmit={handleSend} className="p-4 border-t border-radar-border bg-radar-card flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje al grupo..."
            className="flex-1 bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
