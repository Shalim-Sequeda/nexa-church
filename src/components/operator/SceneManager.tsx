import React, { useState, useDeferredValue, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  IconPlus,
  IconDuplicate,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconPlay,
  IconSearch,
  IconFolder,
  IconSave,
  IconPdf,
  IconEdit,
  IconSliders,
} from '../common/NexaIcons';
import { useChurch, churchStore } from '../../stores/churchStore';
import { usePresentation, presentationStore } from '../../stores/presentationStore';
import { Scene, SceneType } from '../../types/church';
import { CueThumbnail } from './CueThumbnail';

interface SceneManagerProps {
  onOpenEventEditor?: () => void;
}

export const SceneManager: React.FC<SceneManagerProps> = ({ onOpenEventEditor }) => {
  const church = useChurch();
  const presentation = usePresentation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SceneType>('text');
  const [newText, setNewText] = useState('');

  const activeSceneId = church.activeSceneId;
  const liveSceneId = presentation.liveScene?.id;
  const previewSceneId = presentation.previewScene?.id;

  const deferredFilter = useDeferredValue(church.filterText);

  const filteredScenes = useMemo(() => {
    return church.currentProject.scenes.filter((s) => {
      if (church.activeGroupId && s.groupId !== church.activeGroupId) return false;
      if (deferredFilter.trim()) {
        const q = deferredFilter.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [church.currentProject.scenes, church.activeGroupId, deferredFilter]);

  const handleSelectScene = (scene: Scene) => {
    churchStore.setActiveSceneId(scene.id);
  };

  const handlePresentDirectly = (scene: Scene, e: React.MouseEvent) => {
    e.stopPropagation();
    presentationStore.presentSceneDirectly(scene);
    churchStore.setActiveSceneId(scene.id);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    churchStore.duplicateScene(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    churchStore.deleteScene(id);
  };

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      churchStore.reorderScenes(index, index - 1);
    }
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < church.currentProject.scenes.length - 1) {
      churchStore.reorderScenes(index, index + 1);
    }
  };

  const handleCreateScene = () => {
    if (!newTitle.trim()) return;
    churchStore.addScene({
      title: newTitle.trim(),
      type: newType,
      content: {
        text: newText,
      },
    });
    setNewTitle('');
    setNewText('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0C] border-r border-[#1C1C1E] overflow-hidden select-none">
      {/* Top Header: CUES DE PRODUCCIÓN + [+ CUE] */}
      <div className="h-11 px-3 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase block leading-none">
            CUES DE PRODUCCIÓN
          </span>
          {onOpenEventEditor && (
            <button
              onClick={onOpenEventEditor}
              className="p-0.5 text-[#71717A] hover:text-white transition-colors"
              title="Configurar Evento o Servicio"
            >
              <IconEdit className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => churchStore.loadProjectFromFile()}
            className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1A1A1E] transition-colors"
            title="Abrir archivo de proyecto..."
          >
            <IconFolder className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => churchStore.saveProject()}
            className={`p-1 transition-colors ${church.isDirty ? 'text-amber-400 hover:text-amber-300' : 'text-[#71717A] hover:text-[#F4F4F5]'}`}
            title={church.isDirty ? 'Guardar proyecto (hay cambios pendientes)' : 'Guardar proyecto'}
          >
            <IconSave className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => churchStore.importPdfToScenes()}
            disabled={church.isImportingPdf}
            className="px-1.5 py-1 bg-[#161618] hover:bg-[#202024] disabled:opacity-40 text-[#D4D4D8] text-[9.5px] font-mono font-bold border border-[#27272A] transition-all flex items-center gap-1"
            title="Importar PDF como páginas de cues"
          >
            {church.isImportingPdf ? (
              <Loader2 className="w-2.5 h-2.5 text-red-500 animate-spin" />
            ) : (
              <IconPdf className="w-2.5 h-2.5 text-zinc-400" />
            )}
            <span>PDF</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1C1C20] hover:bg-red-950/80 text-[#F4F4F5] hover:text-white text-[10px] font-mono font-bold border border-[#2E2E34] hover:border-red-900 transition-all shadow-sm"
          >
            <IconPlus className="w-3 h-3 text-red-400" />
            <span>+ CUE</span>
          </button>
        </div>
      </div>

      {/* Search Bar with filter sliders */}
      <div className="px-2.5 py-2 border-b border-[#18181A] shrink-0 bg-[#0A0A0C]">
        <div className="relative flex items-center">
          <IconSearch className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar cues..."
            value={church.filterText}
            onChange={(e) => churchStore.setFilterText(e.target.value)}
            className="w-full pl-8 pr-7 py-1 text-xs font-sans bg-[#121214] border border-[#222226] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46]"
          />
          <button
            onClick={() => churchStore.setFilterText('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#D4D4D8] transition-colors"
            title="Filtros avanzados"
          >
            <IconSliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Group Tabs Filter Pills */}
      <div className="px-2.5 py-1.5 bg-[#0D0D0F] border-b border-[#18181A] flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs no-scrollbar">
        <button
          onClick={() => churchStore.setActiveGroupId(null)}
          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase whitespace-nowrap transition-colors border ${
            church.activeGroupId === null
              ? 'bg-[#1C1C22] text-[#F4F4F5] border-[#3F3F46]'
              : 'bg-transparent text-[#71717A] hover:text-[#A1A1AA] border-[#222226] hover:bg-[#141416]'
          }`}
        >
          TODOS {church.currentProject.scenes.length}
        </button>
        {church.currentProject.groups.map((grp) => {
          const count = church.currentProject.scenes.filter((s) => s.groupId === grp.id).length;
          return (
            <button
              key={grp.id}
              onClick={() => churchStore.setActiveGroupId(grp.id)}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase whitespace-nowrap transition-colors border ${
                church.activeGroupId === grp.id
                  ? 'bg-[#1C1C22] text-[#F4F4F5] border-[#3F3F46]'
                  : 'bg-transparent text-[#71717A] hover:text-[#A1A1AA] border-[#222226] hover:bg-[#141416]'
              }`}
            >
              {grp.name} {count}
            </button>
          );
        })}
      </div>

      {/* Barra de Progreso de Importación PDF */}
      {church.isImportingPdf && church.pdfProgress && (
        <div className="px-2.5 py-1.5 bg-[#180A0E] border-b border-red-900/40 flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#F4F4F5]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Loader2 className="w-3 h-3 text-red-500 animate-spin shrink-0" />
              <span className="truncate">
                Importando: <span className="text-red-400 font-bold">{church.pdfProgress.filename}</span>
              </span>
            </div>
            <span className="text-[9px] text-[#A1A1AA] shrink-0 font-bold">
              {church.pdfProgress.current} / {church.pdfProgress.total}
            </span>
          </div>
          <div className="w-full bg-[#27272A] h-1 overflow-hidden">
            <div
              className="bg-red-600 h-full transition-all duration-150"
              style={{
                width: `${Math.round((church.pdfProgress.current / Math.max(church.pdfProgress.total, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mensaje de Error en PDF */}
      {church.pdfError && (
        <div className="px-2.5 py-1.5 bg-[#200A0E] border-b border-red-900/50 flex items-center justify-between text-[10px] font-mono text-rose-400 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
            <span className="truncate">{church.pdfError}</span>
          </div>
        </div>
      )}

      {/* Scene List - Continuous production cues rows with thumbnails & B1 identifiers */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#141416]">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-12 text-[#71717A] font-mono text-xs">
            No se encontraron cues
          </div>
        ) : (
          filteredScenes.map((scene, idx) => {
            const isLive = liveSceneId === scene.id;
            const isPreview = previewSceneId === scene.id;
            const isActive = activeSceneId === scene.id;
            const cueIndex = `B${idx + 1}`;

            return (
              <div
                key={scene.id}
                onClick={() => handleSelectScene(scene)}
                onDoubleClick={(e) => handlePresentDirectly(scene, e)}
                className={`group px-2.5 py-1.5 transition-all cursor-pointer flex items-center justify-between gap-2 border-l-2 ${
                  isLive
                    ? 'bg-[#180A0E] border-l-red-600 text-white'
                    : isPreview
                    ? 'bg-[#141416] border-l-[#A1A1AA] text-white'
                    : isActive
                    ? 'bg-[#121214] border-l-transparent text-[#F4F4F5]'
                    : 'bg-transparent hover:bg-[#0E0E10] border-l-transparent text-[#A1A1AA]'
                }`}
              >
                {/* Left: Cue index identifier + Thumbnail + Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`font-mono text-[10px] w-6 shrink-0 ${isLive ? 'text-red-500 font-bold' : 'text-[#71717A]'}`}>
                    {cueIndex}
                  </span>

                  {/* 16:9 Thumbnail Box */}
                  <CueThumbnail scene={scene} className="w-12 h-7" />

                  {/* Title & Type */}
                  <div className="min-w-0 flex-1 pl-0.5">
                    <div className="text-xs font-mono font-medium text-[#F4F4F5] truncate leading-tight">
                      {scene.title}
                    </div>
                    <div className="text-[8.5px] font-mono uppercase text-[#71717A] tracking-wider mt-0.5">
                      {scene.type}
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Context Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isLive && (
                    <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold tracking-wider bg-red-600 text-white rounded-[2px] shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                      + LIVE
                    </span>
                  )}
                  {isPreview && !isLive && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-widest bg-[#222226] text-[#E4E4E7] border border-[#3F3F46]">
                      PREVIEW
                    </span>
                  )}

                  {/* Context menu and actions */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                    <button
                      onClick={(e) => handleMoveUp(idx, e)}
                      disabled={idx === 0}
                      className="p-0.5 text-[#71717A] hover:text-[#F4F4F5] disabled:opacity-20"
                      title="Subir"
                    >
                      <IconChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleMoveDown(idx, e)}
                      disabled={idx === filteredScenes.length - 1}
                      className="p-0.5 text-[#71717A] hover:text-[#F4F4F5] disabled:opacity-20"
                      title="Bajar"
                    >
                      <IconChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(scene.id, e)}
                      className="p-0.5 text-[#71717A] hover:text-[#F4F4F5]"
                      title="Duplicar"
                    >
                      <IconDuplicate className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(scene.id, e)}
                      className="p-0.5 text-[#71717A] hover:text-red-400"
                      title="Eliminar"
                    >
                      <IconTrash className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handlePresentDirectly(scene, e)}
                      className="p-1 bg-[#1A1A1E] hover:bg-red-600 text-[#F4F4F5] hover:text-white border border-[#2E2E34] transition-colors ml-0.5"
                      title="Disparar a LIVE"
                    >
                      <IconPlay className="w-2.5 h-2.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add Scene */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#27272A] w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C1C1C] mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F4F4F5]">
                Nueva Escena
              </h3>
              <span className="text-[10px] text-[#71717A] font-mono">NEXA STUDIO</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">Título de la Escena</label>
                <input
                  type="text"
                  placeholder="Ej. Anuncio Especial"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none focus:border-[#3F3F46]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">Tipo de Escena</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SceneType)}
                  className="w-full px-2.5 py-1 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none focus:border-[#3F3F46]"
                >
                  <option value="text">Texto Libre</option>
                  <option value="title">Título de Predicación</option>
                  <option value="announcement">Anuncio</option>
                  <option value="black">Pantalla Negra</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">Contenido / Texto</label>
                <textarea
                  rows={4}
                  placeholder="Texto a proyectar..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none focus:border-[#3F3F46] font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[#1C1C1C]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1 text-xs font-mono text-[#71717A] hover:text-[#F4F4F5] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateScene}
                className="px-4 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#09090B] text-xs font-mono font-bold transition-all"
              >
                Crear Escena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};