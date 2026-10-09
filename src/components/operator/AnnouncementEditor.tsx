import React from 'react';
import {
  X,
  Type,
  Image as ImageIcon,
  Save,
  Trash2,
  Eye,
  Play,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FolderOpen,
} from 'lucide-react';
import { useAnnouncements, announcementStore } from '../../stores/announcementStore';
import { AnnouncementRenderer } from './AnnouncementRenderer';
import { openFileDialog } from '../../services/tauri';
import { TextLayer, ImageLayer } from '../../types/church';

export const AnnouncementEditor: React.FC = () => {
  const store = useAnnouncements();
  const announcement = store.activeAnnouncement;

  if (!store.isEditorOpen || !announcement) {
    return null;
  }

  const selectedLayer = announcement.layers.find((l) => l.id === store.selectedLayerId);

  const handleSelectBackground = async () => {
    const selected = await openFileDialog([
      { name: 'Imágenes y Fondos en Bucle (*.jpg, *.png, *.webp, *.gif)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] },
    ]);
    if (selected) {
      announcementStore.setBackgroundImage(selected);
    }
  };

  const handleAddImageLayer = async () => {
    const selected = await openFileDialog([
      { name: 'Logos, GIFs e Imágenes (*.png, *.gif, *.webp, *.jpg)', extensions: ['png', 'gif', 'webp', 'jpg', 'jpeg'] },
    ]);
    if (selected) {
      const fileName = selected.split(/[\\/]/).pop() || 'Imagen';
      announcementStore.addImageLayer(selected, fileName);
    }
  };

  const handleSave = async () => {
    await announcementStore.saveCurrentAnnouncement();
  };

  const handlePreview = () => {
    announcementStore.sendToPreview(announcement);
  };

  const handleLive = () => {
    announcementStore.presentDirectly(announcement);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-5xl h-[88vh] bg-[#0A0A0A] border border-[#27272A] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="h-10 px-4 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#71717A] uppercase">
              EDITOR DE ANUNCIOS
            </span>
            <span className="text-[#3F3F46]">·</span>
            <input
              type="text"
              value={announcement.name}
              onChange={(e) => announcementStore.updateActiveName(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#F4F4F5] border-b border-transparent hover:border-[#3F3F46] focus:border-[#E4E4E7] focus:outline-none px-1 py-0.5"
              placeholder="Nombre del anuncio..."
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePreview}
              className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-[#D4D4D8] bg-[#181818] hover:bg-[#27272A] border border-[#27272A] flex items-center gap-1 transition-colors"
              title="Cargar en PREVIEW"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>

            <button
              onClick={handleLive}
              className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-white bg-[#181818] hover:bg-[#E11D48] border border-[#27272A] hover:border-[#E11D48] flex items-center gap-1 transition-colors"
              title="Disparar a LIVE en proyector"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Live</span>
            </button>

            <button
              onClick={handleSave}
              className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase text-[#09090B] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#FFFFFF] flex items-center gap-1 transition-colors ml-1"
              title="Guardar anuncio en disco"
            >
              <Save className="w-3 h-3" />
              <span>Guardar</span>
            </button>

            <button
              onClick={() => announcementStore.closeEditor()}
              className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#181818] ml-2"
              title="Cerrar editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body: Canvas Center + Sidebar Layers */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Canvas Preview (16:9 Broadcast Studio) */}
          <div className="flex-1 bg-[#000000] p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full max-w-4xl aspect-video border border-[#27272A] relative overflow-hidden shadow-2xl bg-[#050505] [container-type:inline-size]">
              <AnnouncementRenderer announcement={announcement} scale={1.0} />
            </div>

            {/* Quick Action Bar under Canvas */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleSelectBackground}
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] border border-[#27272A] text-[#E4E4E7] text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Fondo Local</span>
              </button>

              <button
                onClick={() => announcementStore.addTextLayer()}
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] border border-[#27272A] text-[#E4E4E7] text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>+ Texto</span>
              </button>

              <button
                onClick={handleAddImageLayer}
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] border border-[#27272A] text-[#E4E4E7] text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>+ Logo / Imagen</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Layers & Properties (320px) */}
          <div className="w-80 bg-[#0A0A0A] border-l border-[#1C1C1C] flex flex-col shrink-0 min-h-0 overflow-y-auto divide-y divide-[#181818]">
            {/* Layers List */}
            <div className="p-3">
              <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block mb-2">
                CAPAS DEL ANUNCIO
              </span>

              <div className="flex flex-col gap-1">
                {/* Background Layer */}
                <div
                  className={`px-2.5 py-1.5 flex items-center justify-between text-xs border ${
                    !store.selectedLayerId
                      ? 'bg-[#181818] border-[#3F3F46] text-[#F4F4F5]'
                      : 'bg-[#121212] border-[#1C1C1C] text-[#A1A1AA] hover:bg-[#181818]'
                  } cursor-pointer transition-colors`}
                  onClick={() => announcementStore.selectLayer(null)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-[#71717A]" />
                    <span className="truncate font-medium">
                      Fondo ({announcement.background?.type === 'image' ? 'Imagen local' : 'Color sólido'})
                    </span>
                  </div>
                </div>

                {/* Content Layers */}
                {announcement.layers.map((layer) => {
                  const isSelected = store.selectedLayerId === layer.id;
                  const title =
                    layer.type === 'text'
                      ? (layer as TextLayer).text.slice(0, 22) || 'Texto vacío'
                      : (layer as ImageLayer).fileName || 'Imagen/Logo';

                  return (
                    <div
                      key={layer.id}
                      className={`px-2.5 py-1.5 flex items-center justify-between text-xs border ${
                        isSelected
                          ? 'bg-[#181818] border-[#3F3F46] text-[#F4F4F5]'
                          : 'bg-[#121212] border-[#1C1C1C] text-[#A1A1AA] hover:bg-[#181818]'
                      } cursor-pointer transition-colors`}
                      onClick={() => announcementStore.selectLayer(layer.id)}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        {layer.type === 'text' ? (
                          <Type className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400/80" />
                        )}
                        <span className="truncate font-medium">{title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          announcementStore.removeLayer(layer.id);
                        }}
                        className="p-1 text-[#71717A] hover:text-[#EF4444] rounded-none transition-colors"
                        title="Eliminar capa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Layer Inspector / Controls */}
            <div className="p-3 flex-1">
              {!selectedLayer ? (
                /* Background Inspector */
                <div className="space-y-4">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block">
                    PROPIEDADES DE FONDO
                  </span>

                  <div>
                    <label className="text-[11px] text-[#A1A1AA] block mb-1.5">Archivo de Fondo</label>
                    <button
                      onClick={handleSelectBackground}
                      className="w-full px-2.5 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] border border-[#27272A] text-xs text-[#E4E4E7] flex items-center justify-center gap-2 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#A1A1AA]" />
                      <span className="truncate">
                        {announcement.background?.filePath
                          ? announcement.background.filePath.split(/[\\/]/).pop()
                          : 'Elegir archivo local...'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#A1A1AA] block mb-1.5">Color de Fondo Sólido</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcement.background?.color || '#000000'}
                        onChange={(e) => announcementStore.setBackgroundColor(e.target.value)}
                        className="w-8 h-8 p-0 bg-transparent border border-[#27272A] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={announcement.background?.color || '#000000'}
                        onChange={(e) => announcementStore.setBackgroundColor(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-mono bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : selectedLayer.type === 'text' ? (
                /* Text Layer Inspector */
                <div className="space-y-3.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block">
                    PROPIEDADES DE TEXTO
                  </span>

                  <div>
                    <label className="text-[11px] text-[#A1A1AA] block mb-1">Contenido</label>
                    <textarea
                      rows={3}
                      value={(selectedLayer as TextLayer).text}
                      onChange={(e) =>
                        announcementStore.updateTextLayer(selectedLayer.id, { text: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none focus:border-[#3F3F46]"
                      placeholder="Escribe el texto aquí..."
                    />
                  </div>

                  {/* Font Family (Tipo de Letra) */}
                  <div>
                    <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">
                      Tipo de Letra (Fuente)
                    </label>
                    <select
                      value={(selectedLayer as TextLayer).fontFamily || 'Inter, sans-serif'}
                      onChange={(e) =>
                        announcementStore.updateTextLayer(selectedLayer.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none"
                    >
                      <option value="Inter, sans-serif">Sans Moderno (Inter / UI)</option>
                      <option value="'Montserrat', sans-serif">Titular Fuerte (Montserrat)</option>
                      <option value="'Oswald', sans-serif">Condensado Impacto (Oswald)</option>
                      <option value="'Merriweather', serif">Serif Clásico (Merriweather / Editorial)</option>
                      <option value="'Playfair Display', serif">Elegante / Ceremonial (Playfair)</option>
                      <option value="Impact, sans-serif">Máximo Impacto (Impact)</option>
                      <option value="Georgia, serif">Solemne / Bíblico (Georgia)</option>
                      <option value="'JetBrains Mono', monospace">Monospace / Moderno</option>
                    </select>
                  </div>

                  {/* Font Size & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">
                        Tamaño ({(selectedLayer as TextLayer).fontSize}px ref)
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="84"
                        step="2"
                        value={(selectedLayer as TextLayer).fontSize}
                        onChange={(e) =>
                          announcementStore.updateTextLayer(selectedLayer.id, {
                            fontSize: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[#E4E4E7] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">Grosor</label>
                      <select
                        value={(selectedLayer as TextLayer).fontWeight}
                        onChange={(e) =>
                          announcementStore.updateTextLayer(selectedLayer.id, {
                            fontWeight: e.target.value as any,
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-[#121212] border border-[#1C1C1C] text-[#F4F4F5] focus:outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="medium">Medio</option>
                        <option value="bold">Negrita</option>
                        <option value="black">Black</option>
                      </select>
                    </div>
                  </div>

                  {/* Alignment & Color */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">Alineación</label>
                      <div className="flex items-center gap-1 bg-[#121212] p-0.5 border border-[#1C1C1C]">
                        <button
                          onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { alignment: 'left' })}
                          className={`p-1 flex-1 flex justify-center ${
                            (selectedLayer as TextLayer).alignment === 'left'
                              ? 'bg-[#1C1C1C] text-white'
                              : 'text-[#71717A]'
                          }`}
                        >
                          <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { alignment: 'center' })}
                          className={`p-1 flex-1 flex justify-center ${
                            (selectedLayer as TextLayer).alignment === 'center'
                              ? 'bg-[#1C1C1C] text-white'
                              : 'text-[#71717A]'
                          }`}
                        >
                          <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { alignment: 'right' })}
                          className={`p-1 flex-1 flex justify-center ${
                            (selectedLayer as TextLayer).alignment === 'right'
                              ? 'bg-[#1C1C1C] text-white'
                              : 'text-[#71717A]'
                          }`}
                        >
                          <AlignRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={(selectedLayer as TextLayer).color || '#FFFFFF'}
                          onChange={(e) =>
                            announcementStore.updateTextLayer(selectedLayer.id, { color: e.target.value })
                          }
                          className="w-7 h-7 p-0 bg-transparent border border-[#27272A] cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-[#D4D4D8]">
                          {(selectedLayer as TextLayer).color || '#FFFFFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical & Horizontal Presets */}
                  <div>
                    <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1.5">
                      Posición Predefinida
                    </label>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                      <button
                        onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { y: 22 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Arriba
                      </button>
                      <button
                        onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { y: 50 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Centro
                      </button>
                      <button
                        onClick={() => announcementStore.updateTextLayer(selectedLayer.id, { y: 78 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Abajo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Image Layer Inspector */
                <div className="space-y-3.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block">
                    PROPIEDADES DE IMAGEN / LOGO
                  </span>

                  <div>
                    <label className="text-[11px] text-[#A1A1AA] block mb-1">Archivo</label>
                    <div className="text-xs font-mono text-[#E4E4E7] truncate bg-[#121212] p-2 border border-[#1C1C1C]">
                      {(selectedLayer as ImageLayer).fileName}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1">
                      Tamaño / Ancho ({(selectedLayer as ImageLayer).width}%)
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="80"
                      step="2"
                      value={(selectedLayer as ImageLayer).width}
                      onChange={(e) =>
                        announcementStore.updateImageLayer(selectedLayer.id, {
                          width: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#E4E4E7] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#71717A] font-mono uppercase block mb-1.5">
                      Posición Vertical
                    </label>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                      <button
                        onClick={() => announcementStore.updateImageLayer(selectedLayer.id, { y: 20 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Arriba
                      </button>
                      <button
                        onClick={() => announcementStore.updateImageLayer(selectedLayer.id, { y: 50 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Centro
                      </button>
                      <button
                        onClick={() => announcementStore.updateImageLayer(selectedLayer.id, { y: 80 })}
                        className="py-1 bg-[#121212] hover:bg-[#1C1C1C] border border-[#1C1C1C] text-[#A1A1AA]"
                      >
                        Abajo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
