import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { IconClose } from '../common/NexaIcons';
import { checkForAppUpdates, UpdateCheckResult, CURRENT_APP_VERSION } from '../../services/updateService';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const res = await checkForAppUpdates();
      setUpdateResult(res);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000]/90 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-100">
      <div className="bg-[#0A0A0C] border border-[#222226] w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Top Header bar */}
        <div className="h-8 px-3 bg-[#111114] border-b border-[#1C1C1F] flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
            ACERCA DE · NEXA CHURCH
          </span>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#F4F4F5] p-1 transition-colors"
          >
            <IconClose className="w-3 h-3" />
          </button>
        </div>

        {/* Content body formatted strictly to prompt guidelines */}
        <div className="p-7 text-center space-y-5">
          <div className="flex flex-col items-center justify-center space-y-3">
            <img
              src="/logo.png"
              alt="NEXA Logo"
              className="w-16 h-16 object-contain rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.25)] border border-[#222226]"
            />
            <div className="space-y-1">
              <h1 className="text-xl font-sans font-black tracking-wider text-[#F4F4F5]">
                NEXA <span className="text-red-500 font-extrabold">CHURCH</span>
              </h1>
              <div className="text-[11px] font-sans font-bold tracking-widest text-zinc-400 uppercase">
                PRESENTATION SYSTEM
              </div>
              <div className="text-[11px] font-sans text-cyan-400 font-mono pt-0.5">
                Versión {CURRENT_APP_VERSION}
              </div>
            </div>
          </div>

          <div className="space-y-0.5 pt-3 border-t border-[#1C1C1F]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#71717A]">
              DESARROLLADO POR
            </div>
            <div className="text-xs font-mono font-bold text-[#F4F4F5] tracking-widest">
              SHALIM TECHNOLOGIES
            </div>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans px-2">
            Software de presentación y control audiovisual profesional para iglesias y producción en vivo.
          </p>

          {/* Sistema de Comprobación de Actualizaciones Remotas */}
          <div className="pt-3 border-t border-[#1C1C1F] flex flex-col items-center gap-2">
            <button
              onClick={handleCheckUpdate}
              disabled={isChecking}
              className="px-3 py-1.5 bg-[#14151B] hover:bg-[#1E202B] disabled:opacity-50 text-[#D4D4D8] border border-[#272936] rounded text-[11px] font-mono transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-cyan-400' : 'text-[#8E92A2]'}`} />
              <span>{isChecking ? 'Comprobando servidor...' : 'Buscar actualizaciones'}</span>
            </button>

            {updateResult && (
              <div className="w-full text-left bg-[#12131A] border border-[#222432] rounded p-2.5 text-[11px] font-mono space-y-1.5">
                {updateResult.hasUpdate && updateResult.remoteInfo ? (
                  <div>
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Nueva version {updateResult.remoteInfo.version} disponible</span>
                    </div>
                    <p className="text-[10px] text-[#A1A1AA] mt-1 font-sans">
                      {updateResult.remoteInfo.changelog?.[0] || 'Mejoras de rendimiento y estabilidad.'}
                    </p>
                    <a
                      href={updateResult.remoteInfo.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block w-full py-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition-colors"
                    >
                      Descargar e instalar version {updateResult.remoteInfo.version}
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-1">
                    {updateResult.error ? (
                      <span className="text-zinc-400">
                        No se encontraron nuevas actualizaciones en este momento.
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        NEXA Church se encuentra en la version mas reciente (v{CURRENT_APP_VERSION}).
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-[#71717A] pt-3 border-t border-[#1C1C1F]">
            © 2026 SHALIM TECHNOLOGIES
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#111114] border-t border-[#1C1C1F] flex items-center justify-center">
          <button
            onClick={onClose}
            className="w-full py-1.5 bg-[#18181C] hover:bg-[#222228] text-[#F4F4F5] text-xs font-mono font-semibold border border-[#27272E] transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};