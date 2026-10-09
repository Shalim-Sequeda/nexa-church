import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Pause, RotateCcw, Send, EyeOff, MessageSquare, Timer, Tv } from 'lucide-react';
import { IconDisplays, IconProjector, IconBlackout } from '../common/NexaIcons';
import { presentationStore, usePresentation } from '../../stores/presentationStore';
import { useStage, stageStore } from '../../stores/stageStore';
import { getAvailableDisplays } from '../../services/tauri';
import { DisplayInfo } from '../../types/church';

interface DisplaysPanelProps {
  onOpenDisplaysModal?: () => void;
}

export const DisplaysPanel: React.FC<DisplaysPanelProps> = ({ onOpenDisplaysModal }) => {
  const presentation = usePresentation();
  const stage = useStage();
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  const fetchDisplays = async () => {
    setIsLoading(true);
    try {
      const list = await getAvailableDisplays();
      setDisplays(list);
    } catch (e) {
      console.warn('Error obteniendo pantallas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplays();
  }, []);

  const handleToggleProjector = async () => {
    if (presentation.presentationWindowOpen) {
      await presentationStore.closePresentation();
    } else {
      await presentationStore.openPresentation();
    }
  };

  const handleToggleStage = async () => {
    await stageStore.toggleStage();
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    stageStore.showPrivateMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleQuickMessage = (text: string) => {
    stageStore.showPrivateMessage(text);
  };

  const formatTimerDisplay = (seconds: number) => {
    const isNeg = seconds < 0;
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${isNeg ? '-' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-[#F4F4F5] select-none overflow-hidden">
      {/* Header */}
      <div className="h-10 px-3.5 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <IconDisplays className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-sans font-bold tracking-wider text-white uppercase">
            SISTEMA DE PANTALLAS & RETORNO
          </span>
        </div>
        <button
          onClick={fetchDisplays}
          disabled={isLoading}
          className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1A1A1E] transition-colors disabled:opacity-50"
          title="Refrescar pantallas conectadas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main content scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Proyector Principal (Congregación) */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
              <IconProjector className="w-3.5 h-3.5 text-red-500" />
              <span>PROYECTOR PRINCIPAL (CONGREGACIÓN)</span>
            </span>
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded ${
                presentation.presentationWindowOpen
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-[#18181A] text-[#71717A] border border-[#27272A]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${presentation.presentationWindowOpen ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              {presentation.presentationWindowOpen ? 'EMISIÓN ACTIVA' : 'OFF'}
            </span>
          </div>

          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
            {presentation.presentationWindowOpen
              ? 'La ventana de presentación está abierta hacia la congregación o video beam (Display 2).'
              : 'El proyector principal está en reposo. El operador puede ensayar cues en Live sin transmitir.'}
          </p>

          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleToggleProjector}
              className={`flex-1 py-1.5 text-xs font-sans font-bold flex items-center justify-center gap-2 border rounded transition-all ${
                presentation.presentationWindowOpen
                  ? 'bg-[#18181A] hover:bg-[#222226] text-[#F4F4F5] border-[#3F3F46]'
                  : 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-[0_0_12px_rgba(225,29,72,0.4)]'
              }`}
            >
              <IconProjector className="w-3.5 h-3.5" />
              <span>{presentation.presentationWindowOpen ? 'DESCONECTAR PROYECTOR' : 'ACTIVAR PROYECTOR'}</span>
            </button>

            <button
              onClick={() => presentationStore.toggleBlackout()}
              className={`px-3 py-1.5 text-xs font-sans font-bold border rounded transition-colors flex items-center gap-1.5 ${
                presentation.isBlackout
                  ? 'bg-amber-600 text-black border-amber-500'
                  : 'bg-[#141416] hover:bg-[#1E1E22] text-[#A1A1AA] border-[#27272A]'
              }`}
              title="Alternar pantalla a negro (B)"
            >
              <IconBlackout className="w-3.5 h-3.5" />
              <span>BLACK</span>
            </button>
          </div>
        </div>

        {/* 2. Retorno de Escenario / Stage Display */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-amber-500" />
              <span>RETORNO DE ESCENARIO (STAGE DISPLAY)</span>
            </span>
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded ${
                stage.stageWindowOpen
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : 'bg-[#18181A] text-[#71717A] border border-[#27272A]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stage.stageWindowOpen ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              {stage.stageWindowOpen ? 'STAGE CONECTADO' : 'STAGE OFF'}
            </span>
          </div>

          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
            Monitor de confianza para músicos y el pastor con reloj, cronómetro de predicación, diapositiva actual y próxima diapositiva anticipada.
          </p>

          <button
            onClick={handleToggleStage}
            className={`w-full py-1.5 text-xs font-sans font-bold flex items-center justify-center gap-2 border rounded transition-all ${
              stage.stageWindowOpen
                ? 'bg-[#18181A] hover:bg-[#222226] text-[#F4F4F5] border-[#3F3F46]'
                : 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{stage.stageWindowOpen ? 'DESCONECTAR STAGE DISPLAY' : 'ACTIVAR STAGE DISPLAY (ESCENARIO)'}</span>
          </button>

          {/* CRONÓMETRO DE PREDICACIÓN */}
          <div className="pt-2 border-t border-[#1C1C20] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans text-[#D4D4D8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-sky-400" />
                <span>CRONÓMETRO DE PÚLPITO</span>
              </span>
              <span className={`text-base font-sans font-black tracking-wider tabular-nums ${
                stage.timer.mode === 'countdown' && stage.timer.remainingSeconds <= 0
                  ? 'text-red-500 animate-pulse'
                  : stage.timer.mode === 'countdown' && stage.timer.remainingSeconds <= 300
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}>
                {formatTimerDisplay(stage.timer.remainingSeconds)}
              </span>
            </div>

            {/* Controles de reproducción del cronómetro */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => stage.timer.isRunning ? stageStore.pauseTimer() : stageStore.startTimer()}
                className={`flex-1 py-1 text-xs font-sans font-bold flex items-center justify-center gap-1.5 border rounded transition-colors ${
                  stage.timer.isRunning
                    ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400'
                    : 'bg-[#18181C] hover:bg-[#24242A] text-white border-[#2E2E36]'
                }`}
              >
                {stage.timer.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{stage.timer.isRunning ? 'PAUSAR' : 'INICIAR'}</span>
              </button>

              <button
                onClick={() => stageStore.resetTimer()}
                className="px-2.5 py-1 bg-[#18181C] hover:bg-[#24242A] text-white border border-[#2E2E36] text-xs font-sans font-bold rounded flex items-center gap-1 transition-colors"
                title="Reiniciar a tiempo base"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET</span>
              </button>

              <button
                onClick={() => stageStore.adjustTimerSeconds(60)}
                className="px-2 py-1 bg-[#18181C] hover:bg-[#24242A] text-[#A1A1AA] hover:text-white border border-[#2E2E36] text-[10px] font-sans font-bold rounded transition-colors"
                title="Añadir 1 minuto"
              >
                +1M
              </button>

              <button
                onClick={() => stageStore.adjustTimerSeconds(-60)}
                className="px-2 py-1 bg-[#18181C] hover:bg-[#24242A] text-[#A1A1AA] hover:text-white border border-[#2E2E36] text-[10px] font-sans font-bold rounded transition-colors"
                title="Restar 1 minuto"
              >
                -1M
              </button>
            </div>

            {/* Selector de minutos rápidos */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[15, 30, 35, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => stageStore.setTimerMinutes(mins)}
                  className={`py-1 text-[10px] font-sans font-bold border rounded transition-colors ${
                    stage.timer.initialMinutes === mins && !stage.timer.isRunning
                      ? 'bg-sky-500 text-black border-sky-400 font-extrabold'
                      : 'bg-[#141418] hover:bg-[#1E1E24] text-[#A1A1AA] border-[#222228]'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* MENSAJES Y ALERTAS PRIVADAS A TARIMA */}
          <div className="pt-2 border-t border-[#1C1C20] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans text-[#D4D4D8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>AVISO PRIVADO AL ESCENARIO</span>
              </span>
              {stage.privateMessage.isVisible && (
                <span className="text-[9px] font-sans font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-1.5 py-0.5 rounded uppercase">
                  VISIBLE EN TARIMA
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribir mensaje para el púlpito..."
                className="flex-1 bg-[#141418] border border-[#27272A] px-2.5 py-1 text-xs text-white placeholder-[#71717A] focus:border-amber-500 focus:outline-none font-sans rounded"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black text-xs font-sans font-bold flex items-center gap-1 transition-colors rounded"
                title="Enviar aviso a tarima"
              >
                <Send className="w-3 h-3" />
                <span>ENVIAR</span>
              </button>
              {stage.privateMessage.isVisible && (
                <button
                  onClick={() => stageStore.hidePrivateMessage()}
                  className="px-2 py-1 bg-[#24242A] hover:bg-[#2E2E36] text-amber-400 text-xs font-sans flex items-center gap-1 transition-colors rounded"
                  title="Ocultar aviso de tarima"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Chips de avisos rápidos frecuentes */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                'Mover vehículo parqueadero',
                '5 min para concluir',
                'Tiempo finalizado',
                'Llamado al altar',
              ].map((msg) => (
                <button
                  key={msg}
                  onClick={() => handleQuickMessage(msg)}
                  className="px-2 py-0.5 bg-[#141418] hover:bg-[#1E1E24] text-[9.5px] font-sans text-[#A1A1AA] hover:text-amber-300 border border-[#222228] transition-colors rounded"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Monitores del Sistema */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider px-1">
            MONITORES DISPONIBLES ({displays.length})
          </div>

          {displays.length === 0 ? (
            <div className="p-3 bg-[#121214] border border-[#1C1C1E] text-center text-xs text-[#71717A] font-mono">
              Buscando pantallas...
            </div>
          ) : (
            displays.map((disp, idx) => (
              <div
                key={disp.id || idx}
                className={`p-3 bg-[#121214] border transition-colors ${
                  disp.is_primary
                    ? 'border-[#27272A]'
                    : idx === 1
                    ? 'border-red-900/40 bg-[#140D0F]'
                    : 'border-amber-900/40 bg-[#14110A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <IconDisplays className={`w-3.5 h-3.5 ${disp.is_primary ? 'text-[#A1A1AA]' : idx === 1 ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className="text-xs font-mono font-bold text-white">
                      {disp.name || `Monitor ${idx + 1}`}
                    </span>
                  </div>
                  {disp.is_primary ? (
                    <span className="text-[9px] font-mono text-[#71717A] uppercase bg-[#18181A] px-1.5 py-0.5 border border-[#27272A]">
                      OPERADOR
                    </span>
                  ) : idx === 1 ? (
                    <span className="text-[9px] font-mono text-red-400 font-bold uppercase bg-red-950/60 px-1.5 py-0.5 border border-red-800/40">
                      PROYECTOR
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase bg-amber-950/60 px-1.5 py-0.5 border border-amber-800/40">
                      STAGE ESCENARIO
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#A1A1AA] flex items-center justify-between pt-1 border-t border-[#1C1C1E]">
                  <span>Resolución: {disp.width} × {disp.height}</span>
                  <span className="text-[#71717A]">{disp.scale_factor ? `${disp.scale_factor}x DPI` : '60Hz'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {onOpenDisplaysModal && (
          <button
            onClick={onOpenDisplaysModal}
            className="w-full py-1.5 bg-[#121214] hover:bg-[#1A1A1E] text-xs font-mono text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors"
          >
            Configuración Avanzada de Salidas...
          </button>
        )}
      </div>
    </div>
  );
};
