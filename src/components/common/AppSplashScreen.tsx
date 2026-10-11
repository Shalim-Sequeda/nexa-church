import React, { useEffect, useState } from 'react';
import { CURRENT_APP_VERSION } from '../../services/updateService';

interface AppSplashScreenProps {
  progress: number;
  statusText: string;
  isComplete: boolean;
  onFinish: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  progress,
  statusText,
  isComplete,
  onFinish,
}) => {
  const [opacity, setOpacity] = useState(1);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (isComplete) {
      // Breve pausa para percibir el 100% y transición suave de desvanecimiento
      const timer = setTimeout(() => {
        setOpacity(0);
        const unmountTimer = setTimeout(() => {
          setMounted(false);
          onFinish();
        }, 450);
        return () => clearTimeout(unmountTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isComplete, onFinish]);

  if (!mounted) return null;

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 md:p-12 bg-[#070709] text-white select-none transition-opacity duration-500 ease-out cursor-default font-display"
      style={{
        opacity,
        backgroundColor: '#070709',
        background: 'radial-gradient(circle at 50% 40%, rgba(220, 38, 38, 0.10) 0%, #070709 60%, #050507 100%)',
        pointerEvents: opacity === 0 ? 'none' : 'auto',
      }}
    >
      {/* Espaciador superior para mantener el bloque central centrado */}
      <div className="w-full h-4" />

      {/* Centro: Logo oficial, Identidad corporativa y barra de progreso */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full my-auto space-y-8">
        {/* Logotipo oficial de NEXA Church con pulso elegante */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-red-600/15 rounded-3xl blur-2xl animate-pulse" />
          <img
            src="/logo.png"
            alt="NEXA Church"
            className="relative w-24 h-24 md:w-28 md:h-28 object-contain rounded-2xl p-2.5 bg-[#0F1015] border border-zinc-800 shadow-[0_0_40px_rgba(220,38,38,0.25)]"
          />
        </div>

        {/* Tipografía de Marca */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.14em] text-white">
            NEXA <span className="text-red-500">CHURCH</span>
          </h1>
          <p className="text-[11px] tracking-[0.3em] text-zinc-400 font-medium uppercase">
            Professional Presentation System
          </p>
          <p className="text-[11px] tracking-wider text-zinc-500 pt-0.5">
            Versión {CURRENT_APP_VERSION}
          </p>
        </div>

        {/* Barra de progreso profesional */}
        <div className="w-full max-w-sm space-y-2.5 pt-2">
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(220,38,38,0.7)]"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          {/* Estado de carga textual y porcentaje */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
            <span className="truncate pr-3 text-left font-medium text-zinc-300">
              {statusText}
            </span>
            <span className="shrink-0 font-semibold text-white tabular-nums">
              {clampedProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Zona inferior: Créditos corporativos */}
      <div className="w-full flex flex-col items-center justify-center text-center opacity-70 space-y-1">
        <span className="text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase">
          Desarrollado por Shalim Technologies
        </span>
        <span className="text-[9px] text-zinc-600 tracking-wider">
          Software de Proyección para Iglesias
        </span>
      </div>
    </div>
  );
};
