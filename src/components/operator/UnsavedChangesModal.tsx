import React, { useState } from 'react';
import {
  IconPhosphorExit,
  IconPhosphorSave,
  IconPhosphorClose,
} from '../common/NexaIcons';
import { churchStore, useChurch } from '../../stores/churchStore';
import { exitApp } from '../../services/tauri';

export const UnsavedChangesModal: React.FC = () => {
  const church = useChurch();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!church.showExitPrompt) return null;

  const handleSaveAndExit = async () => {
    setIsProcessing(true);
    try {
      const saved = await churchStore.saveProject();
      if (saved) {
        await exitApp();
      } else {
        setIsProcessing(false);
      }
    } catch {
      setIsProcessing(false);
    }
  };

  const handleExitDirectly = async () => {
    setIsProcessing(true);
    churchStore.setShowExitPrompt(false);
    await exitApp();
  };

  const handleCancel = () => {
    if (isProcessing) return;
    churchStore.setShowExitPrompt(false);
  };

  const hasUnsavedChanges = church.isDirty;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="bg-[#0B0C0E] border border-[#1E2028] w-full max-w-[490px] rounded-lg overflow-hidden shadow-2xl relative">
        {/* Top bar: Red accent & close button */}
        <div className="pt-4 px-6 flex items-center justify-between">
          <div
            className="w-8 h-[3px] bg-red-600 rounded-sm shadow-[0_0_8px_rgba(220,38,38,0.7)]"
            aria-hidden="true"
          />
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="text-[#696E7E] hover:text-[#EDEDED] focus:outline-none focus:ring-1 focus:ring-red-500/50 p-1 rounded transition-colors duration-150 disabled:opacity-50"
            title="Cerrar"
            aria-label="Cerrar diálogo"
          >
            <IconPhosphorClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="px-6 pt-3 pb-6">
          <div className="flex items-start gap-4">
            {/* Circular badge with Phosphor icon */}
            <div
              className="w-12 h-12 rounded-full bg-[#181013] border border-red-600/25 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(220,38,38,0.15)] mt-0.5"
              aria-hidden="true"
            >
              {hasUnsavedChanges ? (
                <IconPhosphorSave className="w-6 h-6 text-red-500" />
              ) : (
                <IconPhosphorExit className="w-6 h-6 text-red-500" />
              )}
            </div>

            {/* Typography hierarchy */}
            <div className="flex-1 min-w-0 pr-1">
              <h2
                id="exit-dialog-title"
                className="text-base sm:text-[17px] font-semibold text-[#F2F3F5] leading-snug tracking-tight"
              >
                {hasUnsavedChanges
                  ? '¿Deseas guardar los cambios antes de salir?'
                  : '¿Estás seguro de que deseas cerrar?'}
              </h2>
              <p className="text-xs sm:text-[13px] text-[#8C91A0] leading-relaxed mt-1.5">
                {hasUnsavedChanges
                  ? 'Tienes modificaciones recientes no guardadas en disco.'
                  : 'El proyecto activo se conservará y podrá restaurarse automáticamente al volver a abrir la aplicación.'}
              </p>
            </div>
          </div>

          {/* Sutil separador horizontal */}
          <div className="border-t border-[#1A1C24] my-5" />

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 rounded bg-[#121317] hover:bg-[#1A1B22] text-[#9CA1B0] hover:text-[#F2F3F5] text-xs font-semibold tracking-wide border border-[#232530] transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#3E4254]"
            >
              CANCELAR
            </button>

            {hasUnsavedChanges ? (
              <>
                <button
                  onClick={handleExitDirectly}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded bg-[#160E12] hover:bg-[#221319] text-[#F87171] hover:text-red-300 text-xs font-semibold tracking-wide border border-red-900/40 hover:border-red-700/60 transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                >
                  SALIR SIN GUARDAR
                </button>
                <button
                  onClick={handleSaveAndExit}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold tracking-wide border border-red-500/50 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 shadow-[0_0_16px_rgba(220,38,38,0.35)] hover:shadow-[0_0_22px_rgba(220,38,38,0.5)] focus:outline-none focus:ring-2 focus:ring-red-500/70"
                >
                  <IconPhosphorSave className="w-3.5 h-3.5 text-white" />
                  <span>{isProcessing ? 'GUARDANDO...' : 'GUARDAR Y SALIR'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleExitDirectly}
                disabled={isProcessing}
                className="px-4 py-2 rounded bg-[#180E12] hover:bg-[#251319] text-[#F87171] hover:text-white text-xs font-semibold tracking-wide border border-red-700/50 hover:border-red-500/80 flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 shadow-[0_0_12px_rgba(220,38,38,0.15)] focus:outline-none focus:ring-1 focus:ring-red-500/50"
              >
                <IconPhosphorExit className="w-3.5 h-3.5 text-red-400" />
                <span>SALIR DE LA APLICACIÓN</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
