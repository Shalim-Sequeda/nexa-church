import React, { useState, useEffect } from 'react';
import {
  Radio,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Tv,
  Info,
  X,
  Wifi,
} from 'lucide-react';
import { getBroadcastServerInfo, BroadcastServerInfo } from '../../services/tauri';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const [serverInfo, setServerInfo] = useState<BroadcastServerInfo | null>(null);
  const [copiedType, setCopiedType] = useState<'lower' | 'remote' | null>(null);

  useEffect(() => {
    if (isOpen) {
      getBroadcastServerInfo().then((info) => setServerInfo(info));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'lower' | 'remote') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const lowerThirdUrl = serverInfo?.url_lower_third || 'http://localhost:5210/lower-third';
  const remoteUrl = serverInfo?.url_remote || 'http://localhost:5210/remote';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0B0C10] border border-[#222228] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-12 px-5 bg-[#101116] border-b border-[#1E1F26] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              TRANSMISIÓN & CONTROL REMOTO
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
          {/* Section 1: Lower Thirds */}
          <div className="bg-[#121319] border border-[#22232C] rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-red-600/15 border border-red-500/30 text-red-400">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Lower Thirds para Streaming (OBS / vMix)
                  </h3>
                </div>
              </div>
            </div>

            {/* URL Box */}
            <div className="flex items-center gap-2 bg-[#090A0D] border border-[#242530] p-2.5 rounded">
              <code className="text-xs font-mono text-zinc-200 truncate flex-1 select-all">
                {lowerThirdUrl}
              </code>
              <button
                onClick={() => handleCopy(lowerThirdUrl, 'lower')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1D24] hover:bg-[#282933] text-white text-xs font-mono font-bold rounded border border-[#323440] transition-colors shrink-0"
              >
                {copiedType === 'lower' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COPIADO</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPIAR</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleOpenUrl(lowerThirdUrl)}
                title="Probar en navegador"
                className="p-1.5 bg-[#1C1D24] hover:bg-[#282933] text-zinc-300 hover:text-white rounded border border-[#323440] transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2 bg-[#0E0F14] p-3 rounded border border-[#1E1F28] text-xs text-zinc-400 leading-relaxed">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <strong>Cómo conectar en OBS Studio:</strong> Agrega una fuente tipo <em>Navegador (Browser Source)</em>, pega la URL anterior y configura el tamaño en <strong>1920</strong> de ancho y <strong>1080</strong> de alto. El texto se actualizará en tiempo real al hacer clic en <em>TAKE</em>.
              </div>
            </div>
          </div>

          {/* Section 2: Remote Control */}
          <div className="bg-[#121319] border border-[#22232C] rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-600/15 border border-emerald-500/30 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Control Remoto Web (Móvil / Tablet)
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                <Wifi className="w-3 h-3" />
                <span>WI-FI ACTIVO</span>
              </div>
            </div>

            {/* URL Box */}
            <div className="flex items-center gap-2 bg-[#090A0D] border border-[#242530] p-2.5 rounded">
              <code className="text-xs font-mono text-zinc-200 truncate flex-1 select-all">
                {remoteUrl}
              </code>
              <button
                onClick={() => handleCopy(remoteUrl, 'remote')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1D24] hover:bg-[#282933] text-white text-xs font-mono font-bold rounded border border-[#323440] transition-colors shrink-0"
              >
                {copiedType === 'remote' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COPIADO</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPIAR</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleOpenUrl(remoteUrl)}
                title="Abrir en este equipo"
                className="p-1.5 bg-[#1C1D24] hover:bg-[#282933] text-zinc-300 hover:text-white rounded border border-[#323440] transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2 bg-[#0E0F14] p-3 rounded border border-[#1E1F28] text-xs text-zinc-400 leading-relaxed">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <strong>Instrucciones para celular:</strong> Conecta el teléfono al mismo Wi-Fi de esta computadora y abre el enlace anterior en Safari o Chrome.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-5 bg-[#101116] border-t border-[#1E1F26] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1C1D24] hover:bg-[#282933] text-white text-xs font-mono font-bold rounded border border-[#323440] transition-colors"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};
