import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Radio } from 'lucide-react';
import { isTauriEnvironment } from '../../services/tauri';
import { usePresentation } from '../../stores/presentationStore';
import { useChurch, churchStore } from '../../stores/churchStore';
import {
  IconCalendar,
  IconProjector,
  IconSession,
  IconLive,
  IconWindowMin,
  IconWindowMax,
  IconWindowRestore,
  IconWindowClose,
} from '../common/NexaIcons';

interface TitleBarProps {
  onOpenAbout: () => void;
  onOpenDisplays: () => void;
  onOpenEventEditor: () => void;
  onOpenBroadcast: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onOpenAbout,
  onOpenDisplays,
  onOpenEventEditor,
  onOpenBroadcast,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [clock, setClock] = useState<Date>(new Date());
  const presentation = usePresentation();
  const church = useChurch();

  // Reloj en tiempo real cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isTauriEnvironment()) return;

    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        setIsMaximized(await win.isMaximized());
      } catch {}
    };

    checkMaximized();
    const interval = setInterval(checkMaximized, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = async () => {
    if (isTauriEnvironment()) {
      getCurrentWindow().minimize();
    }
  };

  const handleToggleMaximize = async () => {
    if (isTauriEnvironment()) {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      setIsMaximized(await win.isMaximized());
    }
  };

  const handleClose = () => {
    churchStore.setShowExitPrompt(true);
  };

  const formatLiveDate = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatLiveTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).toUpperCase();
  };

  const isLiveActive = presentation.liveScene !== null;
  const isBlackout = presentation.isBlackout;
  const isProjectorOpen = presentation.presentationWindowOpen;

  const isReallyOnAir = isLiveActive && !isBlackout && isProjectorOpen;
  const isLocalOnly = isLiveActive && !isBlackout && !isProjectorOpen;

  return (
    <header className="h-[5.8vh] min-h-[40px] max-h-[52px] bg-[#000000] border-b border-[#1C1C1E] flex items-center justify-between px-3 select-none z-50 shrink-0 text-xs font-sans gap-3">
      {/* 1. BRANDING NEXA CHURCH */}
      <div className="flex items-center gap-3 shrink-0" data-tauri-drag-region>
        <div className="flex items-center gap-2.5 py-1">
          {/* Isotipo metálico NEXA en alta resolución */}
          <img
            src="/logo.png"
            alt="NEXA Logo"
            className="h-7 w-7 object-contain rounded-[2px]"
          />

          <div className="flex items-baseline">
            <span className="text-[14px] font-display font-black tracking-widest text-white uppercase">
              NEXA
            </span>
            <span className="text-[14px] font-display font-medium tracking-wider text-[#D4D4D8] uppercase ml-1.5">
              CHURCH
            </span>
          </div>
        </div>

        {/* Separador vertical limpio */}
        <div className="h-5 w-px bg-[#1C1C1E] mx-1" />

        {/* 2. BLOQUE DE SESIÓN / CULTO (Idéntico a media_1791113872444.png) */}
        <button
          onClick={onOpenEventEditor}
          className="flex items-center gap-2.5 px-2.5 py-1 bg-[#0A0A0C] hover:bg-[#121214] border border-[#1C1C1E] hover:border-[#2E2E34] text-left transition-all group max-w-xs md:max-w-sm rounded-[2px]"
          title="Configurar título y contexto de la sesión"
        >
          {/* Icono de encuadre técnico NEXA en rojo */}
          <IconSession className="w-4 h-4 text-red-500 shrink-0" />

          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-white truncate">
              {church.currentProject.eventType?.toUpperCase() || 'CULTO'}
            </span>
            <span className="text-[8.5px] font-display uppercase tracking-wider text-[#71717A] truncate">
              {church.currentProject.name}
            </span>
          </div>
        </button>
      </div>

      {/* ZONA DE ARRASTRE CENTRAL (Permite mover la ventana limpiamente) */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* 3. FECHA/HORA + 4. ESTADO + 5. PROYECTOR + 6. CONTROLES */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* FECHA Y HORA (Idéntico a media_1791113872444.png) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#0A0A0C] border border-[#1C1C1E] rounded-[2px]">
          <IconCalendar className="w-3.5 h-3.5 text-[#71717A]" />
          <span className="text-[10px] font-display text-[#A1A1AA]">{formatLiveDate(clock)}</span>
          <span className="text-red-500 text-xs leading-none">●</span>
          <span className="text-[10.5px] font-display font-bold text-white tracking-wider tabular-nums">
            {formatLiveTime(clock)}
          </span>
        </div>

        {/* ESTADO OPERATIVO (Idéntico a media_1791113872444.png) */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0A0A0C] border border-[#1C1C1E] rounded-[2px]">
          <IconLive
            className={`w-3.5 h-3.5 shrink-0 ${
              isReallyOnAir
                ? 'text-red-500 animate-pulse'
                : isLocalOnly
                ? 'text-amber-400'
                : isBlackout
                ? 'text-amber-500'
                : 'text-zinc-600'
            }`}
          />
          <div className="flex flex-col min-w-0 leading-tight">
            <span
              className={`text-[10px] font-display font-bold tracking-wider ${
                isReallyOnAir
                  ? 'text-red-400'
                  : isLocalOnly
                  ? 'text-amber-300'
                  : isBlackout
                  ? 'text-amber-400'
                  : 'text-[#A1A1AA]'
              }`}
            >
              {isReallyOnAir ? 'EN EL AIRE' : isBlackout ? 'BLACKOUT' : isLocalOnly ? 'PREPARADO' : 'STANDBY'}
            </span>
            <span className="text-[8px] font-display uppercase tracking-wider text-[#71717A]">
              {isProjectorOpen ? 'PROYECTOR ON' : 'PROYECTOR OFF'}
            </span>
          </div>
        </div>

        {/* BOTÓN PROYECTOR CON DROPDOWN (Idéntico a media_1791113872444.png) */}
        <button
          onClick={onOpenDisplays}
          className={`flex items-center gap-2 px-2.5 py-1 border transition-colors rounded-[2px] ${
            isProjectorOpen
              ? 'bg-[#18181C] border-[#3F3F46] text-white hover:bg-[#202024]'
              : 'bg-[#0E0E10] border-[#222226] text-[#A1A1AA] hover:text-white hover:border-[#3F3F46]'
          }`}
          title="Gestor de Salidas y Pantallas (Display 2)"
        >
          <IconProjector className={`w-3.5 h-3.5 ${isProjectorOpen ? 'text-emerald-400' : 'text-[#71717A]'}`} />
          <span className="text-[10.5px] font-display font-bold tracking-wider uppercase text-white">
            PROYECTOR
          </span>
          <span className="text-[8px] text-[#71717A]">▾</span>
        </button>

        {/* BOTÓN TRANSMISIÓN & REMOTO (Fase 3: OBS Lower Thirds & Móvil) */}
        <button
          onClick={onOpenBroadcast}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0E0E10] border border-[#222226] hover:border-red-500/50 hover:bg-[#16161C] text-[#A1A1AA] hover:text-white transition-colors rounded-[2px]"
          title="Transmisión OBS (Lower Thirds) & Control Remoto Móvil (Fase 3)"
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
          <span className="text-[10.5px] font-display font-bold tracking-wider uppercase text-white">
            OBS / REMOTO
          </span>
        </button>

        {/* ABOUT TRIGGER */}
        <button
          onClick={onOpenAbout}
          className="px-2 py-1 text-[9.5px] font-display text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#121214] transition-colors border border-transparent hover:border-[#1C1C1E] rounded-[2px]"
          title="Acerca de NEXA Church"
        >
          ABOUT
        </button>

        {/* CONTROLES DE VENTANA (Respuesta hover instantánea sin arrastre) */}
        <div className="flex items-center pl-1 shrink-0" data-tauri-drag-region="false">
          <button
            onClick={handleMinimize}
            className="w-8 h-7 flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#18181A] transition-colors rounded-[2px]"
            title="Minimizar"
          >
            <IconWindowMin className="w-3 h-3" />
          </button>
          <button
            onClick={handleToggleMaximize}
            className="w-8 h-7 flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#18181A] transition-colors rounded-[2px]"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? (
              <IconWindowRestore className="w-3 h-3" />
            ) : (
              <IconWindowMax className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-7 flex items-center justify-center text-[#71717A] hover:text-white hover:bg-red-600 transition-colors rounded-[2px]"
            title="Cerrar NEXA Church"
          >
            <IconWindowClose className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};