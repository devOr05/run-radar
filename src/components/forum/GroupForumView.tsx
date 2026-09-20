import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { GroupForumPost } from '../../types';
import { 
  Pin, 
  MessageSquare, 
  Heart, 
  Plus, 
  Users, 
  Tag, 
  Send, 
  Sparkles, 
  Award, 
  Calendar,
  X
} from 'lucide-react';

interface GroupForumViewProps {
  groupId: string;
}

export const GroupForumView: React.FC<GroupForumViewProps> = ({ groupId }) => {
  const { groups, currentRunner, coach, userRole, forumPosts, createForumPost, likeForumPost } = useRadar();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'announcement' | 'training' | 'race' | 'social'>('training');

  const currentGroup = groups.find(g => g.id === groupId) || groups[0];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const authorName = userRole === 'coach' 
      ? (coach?.name || 'Entrenador')
      : (currentRunner ? `${currentRunner.name} ${currentRunner.lastName}`.trim() : 'Corredor');

    const authorId = userRole === 'coach' ? (coach?.id || 'coach-1') : (currentRunner?.id || 'runner-1');

    if (createForumPost) {
      createForumPost({
        groupId: currentGroup?.id || 'general',
        authorId,
        authorName,
        authorRole: userRole === 'coach' ? 'coach' : 'runner',
        title: newTitle.trim(),
        content: newContent.trim(),
        isPinned: userRole === 'coach' && newCategory === 'announcement',
        likesCount: 0,
        commentsCount: 0,
        category: newCategory
      });
    }

    setNewTitle('');
    setNewContent('');
    setShowNewPostModal(false);
  };

  const groupPosts = (forumPosts || []).filter(
    p => p.groupId === currentGroup?.id || p.groupId === 'all'
  );

  const pinnedPosts = groupPosts.filter(p => p.isPinned);
  const regularPosts = groupPosts.filter(p => !p.isPinned);

  const categoryLabels = {
    announcement: { label: 'Anuncio DT', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    training: { label: 'Entrenamiento', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    race: { label: 'Carreras y Competencias', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    social: { label: 'Social y Salidas', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Muro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-radar-card border border-radar-border">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            Muro Comunitario del Pelotón
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {currentGroup?.name || 'Grupo'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Espacio para compartir anuncios de entrenamientos, debates, objetivos y eventos.
          </p>
        </div>
        <button
          onClick={() => setShowNewPostModal(true)}
          className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Publicación</span>
        </button>
      </div>

      {/* Publicaciones Fijadas (Anuncios Oficiales del DT) */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
            <Pin className="w-3.5 h-3.5" />
            <span>Anuncios Fijados por el Entrenador</span>
          </div>
          {pinnedPosts.map((post) => (
            <div key={post.id} className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-[#0B0F19] border-2 border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                    ANUNCIO OFICIAL
                  </span>
                  <span className="text-xs font-bold text-white">{post.authorName}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(post.timestamp).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{post.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de Publicaciones Regulares */}
      <div className="space-y-4">
        {regularPosts.length === 0 && pinnedPosts.length === 0 ? (
          <div className="p-10 rounded-3xl bg-radar-card border border-radar-border text-center text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">No hay publicaciones en el foro de este grupo todavía.</p>
            <p className="text-[11px] text-slate-600">¡Sé el primero en publicar una novedad o foto de entreno!</p>
          </div>
        ) : (
          regularPosts.map((post) => {
            const cat = categoryLabels[post.category || 'training'];
            return (
              <div key={post.id} className="p-5 rounded-3xl bg-radar-card border border-radar-border space-y-3 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs font-bold text-white">{post.authorName}</span>
                    {post.authorRole === 'coach' && (
                      <span className="text-[10px] font-bold text-amber-400">👑 DT</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white">{post.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.content}</p>

                {/* Footer de Interacción */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <button
                    onClick={() => likeForumPost && likeForumPost(post.id)}
                    className="flex items-center gap-1.5 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{post.likesCount || 0} Aplausos</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.commentsCount || 0} Comentarios</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nueva Publicación */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0B0F19] border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-radar-border pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Nueva Publicación en el Foro
              </h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-radar-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="training">🏃 Entrenamiento y Técnicas</option>
                  <option value="race">🏆 Carreras y Competencias</option>
                  <option value="social">☕ Social y Salidas Grupales</option>
                  {userRole === 'coach' && <option value="announcement">📢 Anuncio Oficial del DT (Fijado)</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Salida de fondo este domingo 7:30 AM"
                  className="w-full bg-slate-950 border border-radar-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contenido</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe la propuesta, indicaciones del profesor, punto de hidratación, etc..."
                  className="w-full bg-slate-950 border border-radar-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition disabled:opacity-40"
                >
                  Publicar en el Muro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
