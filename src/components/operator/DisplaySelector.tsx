import React, { useEffect, useState } from 'react';
import { Monitor, RefreshCw, Tv, Check, ExternalLink, X, AlertTriangle } from 'lucide-react';
import { usePresentation, presentationStore } from '../../stores/presentationStore';
import { getAvailableDisplays } from '../../services/tauri';
import { DisplayInfo } from '../../types/church';

interface DisplaySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisplaySelector: React.FC<DisplaySelectorProps> = ({ isOpen, onClose }) => {
  const presentation = usePresentation();
  const [displays, setDisplays] = useState<DisplayInfo[]>(presentation.availableDisplays);
  const [selectedId, setSelectedId] = useState<number | null>(presentation.selectedDisplayId);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleRefresh();
    }
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsLoading(true);
    const refreshed = await getAvailableDisplays();
    setDisplays(refreshed);
    setIsLoading(false);
  };

  const handleSelectDisplay = (id: number) => {
    setSelectedId(id);
    presentationStore.setSelectedDisplay(id);
  };

  const handleOpenPresentation = async (fullscreen: boolean) => {
    if (selectedId === null && displays.length > 0) {
      const defaultId = displays.find((d) => !d.is_primary)?.id ?? displays[0].id;
      await presentationStore.openPresentation(defaultId, fullscreen);
    } else {
      await presentationStore.openPresentation(selectedId ?? undefined, fullscreen);
    }
    onClose();
  };

  if (!isOpen) return null;

  const hasSecondary = displays.some((d) => !d.is_primary);

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-none w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-10 px-4 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#A1A1AA]" />
            <div>
              <h3 className="text-xs font-bold text-[#F4F4F5] uppercase tracking-wider font-mono">Configuración de Pantalla y Proyector</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status info */}
          {!hasSecondary && (
            <div className="p-2.5 bg-[#121212] border border-[#27272A] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#A1A1AA] font-mono leading-relaxed">
                <span className="font-bold block text-[#F4F4F5]">UN SOLO MONITOR DETECTADO</span>
                Puede abrir la ventana de presentación en modo ventana para pruebas. Al conectar un proyector o pantalla secundaria, presione "Actualizar".
              </div>
            </div>
          )}

          {/* Displays List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
                PANTALLAS DETECTADAS ({displays.length})
              </label>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#A1A1AA] hover:text-[#F4F4F5]"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {displays.map((disp) => {
                const isSelected = selectedId === disp.id;
                return (
                  <div
                    key={disp.id}
                    onClick={() => handleSelectDisplay(disp.id)}
                    className={`p-3 border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#181818] border-[#F4F4F5]'
                        : 'bg-[#121212] hover:bg-[#181818] border-[#1C1C1C]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-none ${isSelected ? 'bg-[#F4F4F5] text-black' : 'bg-[#181818] text-[#71717A]'}`}>
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F4F4F5]">{disp.name}</span>
                          {disp.is_primary && (
                            <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono font-bold bg-[#1C1C1C] text-[#71717A] border border-[#27272A]">
                              PRINCIPAL
                            </span>
                          )}
                          {!disp.is_primary && (
                            <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                              PROYECTOR / SALIDA
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#71717A] block mt-0.5">
                          {disp.width} × {disp.height} px · Escala {disp.scale_factor}x
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 bg-[#F4F4F5] text-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-12 px-4 bg-[#121212] border-t border-[#1C1C1C] flex items-center justify-between">
          <button
            onClick={() => presentationStore.closePresentation()}
            disabled={!presentation.presentationWindowOpen}
            className="text-[11px] font-mono uppercase tracking-wider text-[#F43F5E] hover:text-[#FB7185] disabled:opacity-20 disabled:pointer-events-none"
          >
            Cerrar Ventana Live
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenPresentation(false)}
              className="px-3 py-1.5 rounded-none bg-[#181818] hover:bg-[#27272A] text-[#F4F4F5] text-xs font-mono uppercase tracking-wider border border-[#27272A] transition-colors"
            >
              En Ventana
            </button>
            <button
              onClick={() => handleOpenPresentation(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#F4F4F5] hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};