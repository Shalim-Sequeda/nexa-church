import React, { useState, useEffect } from 'react';
import { X, Calendar, Sparkles, Check, Plus, Tag } from 'lucide-react';
import { useChurch, churchStore, getFormattedToday, generateDefaultEventName } from '../../stores/churchStore';

interface EventEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EventTypeOption = 'culto' | 'congreso' | 'conferencia' | 'evento' | 'especial';

interface PresetType {
  id: EventTypeOption;
  label: string;
  badge: string;
  icon: string;
  examples: string[];
}

const PRESETS: PresetType[] = [
  {
    id: 'culto',
    label: 'Culto General / Dominical',
    badge: 'CULTO',
    icon: '✝️',
    examples: ['Culto Dominical de Celebración', 'Culto de Alabanza y Adoración', 'Culto General', 'Culto Matutino'],
  },
  {
    id: 'congreso',
    label: 'Congreso',
    badge: 'CONGRESO',
    icon: '🏛️',
    examples: ['Congreso Internacional de Familias', 'Congreso Nacional de Jóvenes', 'Congreso de Mujeres', 'Congreso Ministerial'],
  },
  {
    id: 'conferencia',
    label: 'Conferencia',
    badge: 'CONFERENCIA',
    icon: '🎙️',
    examples: ['Conferencia Apostólica', 'Conferencia de Liderazgo y Visión', 'Conferencia de Misiones', 'Conferencia de Pastores'],
  },
  {
    id: 'especial',
    label: 'Evento Especial / Vigilia',
    badge: 'ESPECIAL',
    icon: '🔥',
    examples: ['Vigilia de Oración y Poder', 'Noche de Milagros', 'Seminario Bíblico', 'Campaña Evangelística'],
  },
  {
    id: 'evento',
    label: 'Reunión / Otro Evento',
    badge: 'REUNIÓN',
    icon: '👥',
    examples: ['Reunión de Jóvenes', 'Reunión de Matrimonios', 'Escuela Dominical', 'Reunión de Oración'],
  },
];

export const EventEditorModal: React.FC<EventEditorModalProps> = ({ isOpen, onClose }) => {
  const church = useChurch();
  const currentProject = church.currentProject;

  const [eventType, setEventType] = useState<EventTypeOption>(
    (currentProject.eventType as EventTypeOption) || 'culto'
  );
  const [eventName, setEventName] = useState(currentProject.name || '');
  const [eventDate, setEventDate] = useState(currentProject.date || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setEventType((currentProject.eventType as EventTypeOption) || 'culto');
      setEventName(currentProject.name || '');
      setEventDate(currentProject.date || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetType) => {
    setEventType(preset.id);
    // Sugerir un nombre dinámico con la fecha actual si el usuario lo desea
    const prefix = preset.badge;
    const todayFormatted = getFormattedToday();
    setEventName(`${prefix} — ${todayFormatted}`);
  };

  const handleApply = () => {
    if (!eventName.trim()) return;
    churchStore.setProjectDetails({
      name: eventName.trim(),
      eventType,
      date: eventDate,
    });
    onClose();
  };

  const handleCreateNew = () => {
    churchStore.newProject(eventType);
    if (eventName.trim()) {
      churchStore.setProjectDetails({
        name: eventName.trim(),
        date: eventDate,
        eventType,
      });
    }
    onClose();
  };

  const activePreset = PRESETS.find((p) => p.id === eventType) || PRESETS[0];

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-none w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="h-11 px-4 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#A1A1AA]" />
            <h3 className="text-xs font-bold text-[#F4F4F5] uppercase tracking-wider font-mono">
              Configurar Nombre y Tipo de Evento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* 1. Selector de Tipo de Evento */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold block mb-2">
              Tipo de Evento o Servicio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = eventType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 p-2.5 text-left border transition-all ${
                      isSelected
                        ? 'bg-[#1C1C1C] border-[#F4F4F5] text-[#F4F4F5]'
                        : 'bg-[#121212] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-bold truncate">
                        {preset.badge}
                      </div>
                      <div className="text-[9px] text-[#71717A] truncate">
                        {preset.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nombre del Evento */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold">
                Título del Evento / Servicio
              </label>
              <button
                type="button"
                onClick={() => setEventName(generateDefaultEventName(eventType))}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                title="Generar nombre automático con fecha actual"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fecha actual</span>
              </button>
            </div>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ej. CONGRESO INTERNACIONAL DE JÓVENES 2026..."
              className="w-full px-3 py-2 bg-[#121212] border border-[#27272A] focus:border-[#F4F4F5] text-[#F4F4F5] font-mono text-xs outline-none transition-colors"
            />

            {/* Ejemplos rápidos según el tipo seleccionado */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-mono text-[#71717A]">Sugerencias:</span>
              {activePreset.examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setEventName(`${ex.toUpperCase()} — ${getFormattedToday()}`)}
                  className="px-2 py-0.5 bg-[#141414] hover:bg-[#1F1F1F] text-[#A1A1AA] hover:text-[#F4F4F5] text-[9px] font-mono border border-[#27272A] transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Fecha del Evento */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold block mb-1.5">
              Fecha del Evento
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#27272A] focus:border-[#F4F4F5] text-[#F4F4F5] font-mono text-xs outline-none transition-colors cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={() => setEventDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 bg-[#181818] hover:bg-[#222222] text-[#D4D4D8] border border-[#27272A] text-xs font-mono transition-colors flex items-center gap-1.5"
                title="Poner fecha de hoy"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hoy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-12 px-4 bg-[#121212] border-t border-[#1C1C1C] flex items-center justify-between">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#A1A1AA] hover:text-[#F4F4F5] text-xs font-mono border border-[#27272A] transition-colors"
            title="Crear un nuevo proyecto en blanco con este nombre y fecha"
          >
            <Plus className="w-3 h-3" />
            <span>Crear Proyecto Nuevo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-transparent hover:bg-[#181818] text-[#A1A1AA] hover:text-[#F4F4F5] text-xs font-mono transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!eventName.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#F4F4F5] hover:bg-white disabled:opacity-30 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
