import React from 'react';
import { Plus, Edit2, Copy, Trash2, Eye, Play, Megaphone, ListPlus } from 'lucide-react';
import { useAnnouncements, announcementStore } from '../../stores/announcementStore';
import { AnnouncementRenderer } from './AnnouncementRenderer';

export const AnnouncementManager: React.FC = () => {
  const store = useAnnouncements();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-9 px-3 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between shrink-0">
        <div className="min-w-0 pr-2">
          <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block leading-none">
            SISTEMA DE ANUNCIOS
          </span>
          <h2 className="text-xs font-semibold text-[#F4F4F5] truncate max-w-[170px] mt-0.5">
            Anuncios Personalizados
          </h2>
        </div>

        <button
          onClick={() => announcementStore.openEditorForNew()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#181818] hover:bg-[#27272A] text-[#F4F4F5] text-[10px] font-mono uppercase tracking-wider border border-[#27272A] transition-all"
          title="Crear un nuevo anuncio para el servicio"
        >
          <Plus className="w-3 h-3 text-[#A1A1AA]" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {store.announcements.length === 0 ? (
          <div className="text-center py-12 text-[#71717A] text-xs font-mono">
            No hay anuncios creados. Haz clic en "Nuevo" para crear uno.
          </div>
        ) : (
          store.announcements.map((item) => (
            <div
              key={item.id}
              className="group p-2 bg-[#121212] hover:bg-[#181818] border border-[#1C1C1C] hover:border-[#27272A] flex flex-col gap-2 transition-all"
            >
              {/* Header Title & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Megaphone className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                  <span className="text-xs font-medium text-[#F4F4F5] truncate">
                    {item.name}
                  </span>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => announcementStore.addToProject(item)}
                    className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#27272A]"
                    title="Agregar a la lista de escenas del culto"
                  >
                    <ListPlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => announcementStore.duplicateAnnouncement(item)}
                    className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#27272A]"
                    title="Duplicar anuncio"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => announcementStore.openEditorForEdit(item)}
                    className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#27272A]"
                    title="Editar anuncio"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => announcementStore.deleteAnnouncementById(item.id)}
                    className="p-1 text-[#71717A] hover:text-[#EF4444] hover:bg-[#27272A]"
                    title="Eliminar anuncio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 16:9 Thumbnail Preview */}
              <div
                className="w-full aspect-video border border-[#1C1C1C] relative overflow-hidden bg-black cursor-pointer group-hover:border-[#3F3F46] transition-colors"
                onClick={() => announcementStore.sendToPreview(item)}
                title="Hacer clic para enviar a PREVIEW"
              >
                <AnnouncementRenderer announcement={item} scale={0.42} />
              </div>

              {/* Bottom Quick Triggers */}
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#1C1C1C]">
                <button
                  onClick={() => announcementStore.sendToPreview(item)}
                  className="px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase text-[#D4D4D8] hover:text-white bg-[#181818] hover:bg-[#27272A] border border-[#27272A] flex items-center gap-1 transition-colors"
                  title="Cargar a PREVIEW"
                >
                  <Eye className="w-2.5 h-2.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => announcementStore.presentDirectly(item)}
                  className="px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase text-white bg-[#181818] hover:bg-[#E11D48] border border-[#27272A] hover:border-[#E11D48] flex items-center gap-1 transition-colors"
                  title="Presentar de inmediato al proyector (Live)"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Live</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
