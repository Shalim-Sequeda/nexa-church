import React from 'react';
import { IconSettings, IconProjector, IconKeyboard, IconInfo } from '../common/NexaIcons';
import { useChurch } from '../../stores/churchStore';

interface SettingsPanelProps {
  onOpenAbout?: () => void;
  onOpenDisplays?: () => void;
  onOpenEventEditor?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onOpenAbout,
  onOpenDisplays,
  onOpenEventEditor,
}) => {
  const church = useChurch();

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-[#F4F4F5] select-none overflow-hidden">
      {/* Header */}
      <div className="h-10 px-3.5 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <IconSettings className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
            AJUSTES DEL SISTEMA
          </span>
        </div>
      </div>

      {/* Main settings body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Evento Actual */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-2">
          <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
            <span>PROYECTO & EVENTO</span>
            {onOpenEventEditor && (
              <button
                onClick={onOpenEventEditor}
                className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors"
              >
                EDITAR
              </button>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-white">
            {church.currentProject.name}
          </div>
          <div className="text-[11px] font-sans text-[#71717A]">
            Fecha: {church.currentProject.date} · Tipo: {church.currentProject.eventType?.toUpperCase() || 'CULTO'}
          </div>
        </div>

        {/* Presentación & Aspect Ratio */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-2">
          <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
            <IconProjector className="w-3 h-3 text-red-400" />
            PRESENTACIÓN & VIEWPORT
          </div>
          <div className="text-xs text-[#A1A1AA] space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Relación de Aspecto:</span>
              <span className="text-white font-bold">16:9 Panorámico</span>
            </div>
            <div className="flex justify-between">
              <span>Resolución Nativa:</span>
              <span className="text-white font-bold">1920 × 1080 (Full HD / 4K)</span>
            </div>
            <div className="flex justify-between">
              <span>Motor Tipográfico:</span>
              <span className="text-emerald-400 font-bold">Auto-Escalado cqw 1:1</span>
            </div>
          </div>
          {onOpenDisplays && (
            <button
              onClick={onOpenDisplays}
              className="mt-2 w-full py-1 bg-[#1C1C20] hover:bg-[#28282E] text-white border border-[#2E2E34] text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <IconProjector className="w-3 h-3 text-red-500" />
              <span>CONFIGURAR PANTALLAS Y PROYECTOR</span>
            </button>
          )}
        </div>

        {/* Atajos de Teclado del Operador */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-2">
          <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
            <IconKeyboard className="w-3 h-3 text-amber-400" />
            ATAJOS DE PRODUCCIÓN (HOTKEYS)
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-[#1C1C1E]">
              <span className="text-[#A1A1AA]">Presentar a Live (TAKE)</span>
              <kbd className="px-1.5 py-0.5 bg-[#1C1C1E] border border-[#2E2E32] text-white text-[10px] font-bold">Enter</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#1C1C1E]">
              <span className="text-[#A1A1AA]">Pantalla a Negro (Blackout)</span>
              <kbd className="px-1.5 py-0.5 bg-[#1C1C1E] border border-[#2E2E32] text-white text-[10px] font-bold">B</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#1C1C1E]">
              <span className="text-[#A1A1AA]">Escena Siguiente / Anterior</span>
              <span className="text-white text-[10px]">Flechas ← / →</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#A1A1AA]">Play / Pausa Media</span>
              <kbd className="px-1.5 py-0.5 bg-[#1C1C1E] border border-[#2E2E32] text-white text-[10px] font-bold">Espacio</kbd>
            </div>
          </div>
        </div>

        {/* Sistema & Versión */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-2">
          <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <IconInfo className="w-3 h-3 text-zinc-400" />
              SISTEMA
            </span>
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="text-[9px] font-mono text-zinc-400 hover:text-white transition-colors"
              >
                DETALLES
              </button>
            )}
          </div>
          <div className="text-xs font-mono text-white font-bold">
            NEXA Church v1.3.2
          </div>
          <div className="text-[11px] font-mono text-[#71717A]">
            Desarrollado por SHALIM TECHNOLOGIES
          </div>
        </div>
      </div>
    </div>
  );
};

