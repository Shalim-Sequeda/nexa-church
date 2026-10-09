import React from 'react';
import { usePresentation, presentationStore } from '../../stores/presentationStore';
import { useChurch, churchStore } from '../../stores/churchStore';
import { CueThumbnail } from './CueThumbnail';
import { IconEdit, IconFolder } from '../common/NexaIcons';
import { announcementStore } from '../../stores/announcementStore';
import { songStore } from '../../stores/songStore';
import { openFileDialog } from '../../services/tauri';
import { ChurchSong } from '../../types/church';

interface CueInfoPanelProps {
  onOpenEventEditor?: () => void;
}

export const CueInfoPanel: React.FC<CueInfoPanelProps> = ({ onOpenEventEditor }) => {
  const presentation = usePresentation();
  const church = useChurch();

  // El Cue seleccionado suele ser el que está en Preview, o el activo en el store
  const activeScene = presentation.previewScene || church.currentProject.scenes.find((s) => s.id === church.activeSceneId) || null;

  const handlePickSongBackground = async () => {
    if (!activeScene) return;
    const file = await openFileDialog([
      { name: 'Imágenes (*.jpg, *.png, *.webp)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
    ]);
    if (file) {
      churchStore.updateScene(activeScene.id, {
        style: { ...activeScene.style, backgroundImageUrl: file },
      });
      if (presentation.liveScene?.id === activeScene.id) {
        presentationStore.presentSceneDirectly({
          ...activeScene,
          style: { ...activeScene.style, backgroundImageUrl: file },
        });
      }
    }
  };

  const handleRemoveSongBackground = () => {
    if (!activeScene) return;
    churchStore.updateScene(activeScene.id, {
      style: { ...activeScene.style, backgroundImageUrl: undefined },
    });
    if (presentation.liveScene?.id === activeScene.id) {
      presentationStore.presentSceneDirectly({
        ...activeScene,
        style: { ...activeScene.style, backgroundImageUrl: undefined },
      });
    }
  };

  const handleEditCue = () => {
    if (!activeScene) return;
    if (activeScene.type === 'announcement' && activeScene.content.announcement?.announcement) {
      announcementStore.openEditorForEdit(activeScene.content.announcement.announcement);
    } else if (activeScene.type === 'song') {
      const songId = activeScene.content.song?.songId;
      const songs = songStore.getSnapshot().songs;
      const found = songId
        ? songs.find((s) => s.id === songId)
        : songs.find((s) => s.title.toLowerCase() === (activeScene.content.song?.title || '').toLowerCase());

      if (found) {
        songStore.openEditorForEdit(found);
      } else {
        const tempSong: ChurchSong = {
          id: songId || `song-${Date.now()}`,
          title: activeScene.content.song?.title || activeScene.title,
          artist: activeScene.content.song?.author || '',
          originalKey: 'G',
          tempo: 75,
          timeSignature: '4/4',
          tags: ['Alabanza'],
          sections: [
            {
              id: `sec-${Date.now()}-1`,
              type: 'verse',
              label: activeScene.content.song?.sectionLabel || 'Estrofa 1',
              slides: activeScene.content.song?.slides || [activeScene.title],
            },
          ],
          arrangements: [
            {
              id: `arr-${Date.now()}-std`,
              name: 'Estándar',
              sequence: [`sec-${Date.now()}-1`],
            },
          ],
          defaultArrangementId: `arr-${Date.now()}-std`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        songStore.openEditorForEdit(tempSong);
      }
    } else if (onOpenEventEditor) {
      onOpenEventEditor();
    }
  };

  const getTypeName = (type?: string) => {
    switch (type) {
      case 'bible': return 'Escritura Bíblica';
      case 'announcement': return 'Anuncio Dinámico';
      case 'image': return 'Imagen / Diapositiva';
      case 'video': return 'Video / Loop Audiovisual';
      case 'song': return 'Canto de Alabanza';
      case 'title': return 'Título de Predicación';
      case 'text': return 'Texto Libre';
      default: return 'Elemento Multimedia';
    }
  };

  return (
    <div className="bg-[#0A0A0C] border border-[#1C1C1E] p-3 flex flex-col justify-between shrink-0 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#18181A]">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase">
            INFORMACIÓN DEL CUE
          </span>
          <span className="w-6 h-[2px] bg-red-600 mt-0.5" />
        </div>

        <div className="flex items-center gap-1.5">
          {activeScene?.type === 'song' && (
            <>
              {activeScene.style.backgroundImageUrl ? (
                <button
                  onClick={handleRemoveSongBackground}
                  className="flex items-center gap-1 px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60 text-[10px] font-mono transition-colors"
                  title="Quitar imagen de fondo actual"
                >
                  <span>QUITAR FONDO</span>
                </button>
              ) : null}
              <button
                onClick={handlePickSongBackground}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A22] hover:bg-[#252530] text-[#D4D4D8] hover:text-white border border-[#2F2F38] text-[10px] font-mono font-medium transition-colors"
                title="Elegir o cambiar imagen de fondo para esta canción desde tu PC"
              >
                <IconFolder className="w-2.5 h-2.5 text-zinc-400" />
                <span>CAMBIAR FONDO</span>
              </button>
            </>
          )}

          <button
            onClick={handleEditCue}
            disabled={!activeScene}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141416] hover:bg-[#1E1E22] text-[#D4D4D8] hover:text-white border border-[#27272A] text-[10px] font-mono font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Editar contenido o diseño de este Cue"
          >
            <IconEdit className="w-2.5 h-2.5 text-zinc-400" />
            <span>EDITAR CUE</span>
          </button>
        </div>
      </div>

      {/* Main info content */}
      <div className="flex items-center gap-3 pt-2.5">
        {activeScene ? (
          <>
            <div className="shrink-0">
              <CueThumbnail scene={activeScene} className="w-24 h-14" />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="text-xs font-mono font-bold text-white truncate">
                {activeScene.title}
              </h4>
              <div className="text-[10px] font-sans text-[#A1A1AA]">
                <span className="text-[#71717A]">Tipo: </span>
                <span className="text-[#D4D4D8]">{getTypeName(activeScene.type)}</span>
              </div>
              {activeScene.type === 'song' && activeScene.style.backgroundImageUrl && (
                <div className="text-[10px] font-sans text-emerald-400 truncate max-w-xs">
                  <span className="text-[#71717A]">Fondo: </span>
                  <span>{activeScene.style.backgroundImageUrl.split(/[\\/]/).pop()}</span>
                </div>
              )}
              <div className="text-[10px] font-sans text-[#A1A1AA]">
                <span className="text-[#71717A]">Duración: </span>
                <span className="font-mono text-[#D4D4D8]">
                  {activeScene.type === 'video' ? '00:00 (Loop)' : '—:—'}
                </span>
              </div>
              <div className="text-[10px] font-sans text-[#A1A1AA]">
                <span className="text-[#71717A]">Resolución: </span>
                <span className="font-mono text-[#D4D4D8]">1920 × 1080 (16:9)</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full py-3 text-[11px] font-mono text-[#71717A]">
            No hay ningún Cue seleccionado en Preview
          </div>
        )}
      </div>
    </div>
  );
};
