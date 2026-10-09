import { useSyncExternalStore } from 'react';
import { Announcement, TextLayer, ImageLayer, Scene } from '../types/church';
import { loadSavedAnnouncements, saveAnnouncement, deleteAnnouncement } from '../services/tauri';
import { presentationStore } from './presentationStore';
import { churchStore } from './churchStore';

export interface AnnouncementStoreState {
  announcements: Announcement[];
  activeAnnouncement: Announcement | null;
  selectedLayerId: string | null;
  isEditorOpen: boolean;
  isLoading: boolean;
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-default-1',
    name: 'Bienvenida Domingo',
    background: {
      type: 'color',
      color: '#0D0E12',
    },
    layers: [
      {
        id: 'layer-title',
        type: 'text',
        text: 'CULTO DE ADORACIÓN Y PALABRA',
        x: 50,
        y: 40,
        fontSize: 48,
        fontWeight: 'black',
        color: '#FFFFFF',
        alignment: 'center',
      },
      {
        id: 'layer-schedule',
        type: 'text',
        text: 'Domingo · 6:00 PM\nTe esperamos junto a tu familia',
        x: 50,
        y: 65,
        fontSize: 26,
        fontWeight: 'medium',
        color: '#D4D4D8',
        alignment: 'center',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann-default-2',
    name: 'Escuela Bíblica de Niños',
    background: {
      type: 'color',
      color: '#0A0F0D',
    },
    layers: [
      {
        id: 'layer-eb-1',
        type: 'text',
        text: 'ESCUELA BÍBLICA INFANTIL',
        x: 50,
        y: 38,
        fontSize: 46,
        fontWeight: 'black',
        color: '#F4F4F5',
        alignment: 'center',
      },
      {
        id: 'layer-eb-2',
        type: 'text',
        text: 'Clases dinámicas todos los domingos durante el servicio',
        x: 50,
        y: 62,
        fontSize: 24,
        fontWeight: 'normal',
        color: '#A1A1AA',
        alignment: 'center',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialState: AnnouncementStoreState = {
  announcements: DEFAULT_ANNOUNCEMENTS,
  activeAnnouncement: null,
  selectedLayerId: null,
  isEditorOpen: false,
  isLoading: false,
};

let state: AnnouncementStoreState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: Partial<AnnouncementStoreState> | ((prev: AnnouncementStoreState) => Partial<AnnouncementStoreState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  notify();
}

export const announcementStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: async () => {
    setState({ isLoading: true });
    try {
      const loaded = await loadSavedAnnouncements();
      if (loaded && loaded.length > 0) {
        const mapped: Announcement[] = loaded.map((item) => ({
          id: item.id,
          name: item.name,
          background: item.background || { type: 'color', color: '#09090B' },
          layers: (item.layers as (TextLayer | ImageLayer)[]) || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        setState({ announcements: mapped, isLoading: false });
      } else {
        setState({ announcements: DEFAULT_ANNOUNCEMENTS, isLoading: false });
      }
    } catch (e) {
      console.error('Error inicializando almacén de anuncios:', e);
      setState({ isLoading: false });
    }
  },

  openEditorForNew: () => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      name: 'Nuevo Anuncio',
      background: {
        type: 'color',
        color: '#080808',
      },
      layers: [
        {
          id: `layer-${Date.now()}-1`,
          type: 'text',
          text: 'TÍTULO DEL ANUNCIO',
          x: 50,
          y: 40,
          fontSize: 48,
          fontWeight: 'bold',
          color: '#FFFFFF',
          alignment: 'center',
        },
        {
          id: `layer-${Date.now()}-2`,
          type: 'text',
          text: 'Detalles o fecha del evento',
          x: 50,
          y: 62,
          fontSize: 24,
          fontWeight: 'normal',
          color: '#D4D4D8',
          alignment: 'center',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState({
      activeAnnouncement: newAnnouncement,
      selectedLayerId: newAnnouncement.layers[0]?.id || null,
      isEditorOpen: true,
    });
  },

  newAnnouncement: (name?: string) => {
    announcementStore.openEditorForNew();
    if (name) {
      announcementStore.updateActiveName(name);
    }
  },

  openEditorForEdit: (announcement: Announcement) => {
    // Clon profundo para edición no destructiva antes de guardar
    const clone: Announcement = JSON.parse(JSON.stringify(announcement));
    setState({
      activeAnnouncement: clone,
      selectedLayerId: clone.layers[0]?.id || null,
      isEditorOpen: true,
    });
  },

  closeEditor: () => {
    setState({ isEditorOpen: false, activeAnnouncement: null, selectedLayerId: null });
  },

  updateActiveName: (name: string) => {
    if (!state.activeAnnouncement) return;
    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        name,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setBackgroundColor: (color: string) => {
    if (!state.activeAnnouncement) return;
    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        background: {
          type: 'color',
          color,
        },
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setBackgroundImage: (filePath: string) => {
    if (!state.activeAnnouncement) return;
    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        background: {
          type: 'image',
          filePath,
        },
        updatedAt: new Date().toISOString(),
      },
    });
  },

  addTextLayer: () => {
    if (!state.activeAnnouncement) return;
    const newLayer: TextLayer = {
      id: `layer-text-${Date.now()}`,
      type: 'text',
      text: 'Nuevo Texto',
      x: 50,
      y: 50,
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      alignment: 'center',
    };

    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        layers: [...state.activeAnnouncement.layers, newLayer],
        updatedAt: new Date().toISOString(),
      },
      selectedLayerId: newLayer.id,
    });
  },

  addImageLayer: (filePath: string, fileName: string) => {
    if (!state.activeAnnouncement) return;
    const newLayer: ImageLayer = {
      id: `layer-img-${Date.now()}`,
      type: 'image',
      filePath,
      fileName,
      x: 50,
      y: 80,
      width: 25,
      opacity: 1,
    };

    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        layers: [...state.activeAnnouncement.layers, newLayer],
        updatedAt: new Date().toISOString(),
      },
      selectedLayerId: newLayer.id,
    });
  },

  selectLayer: (layerId: string | null) => {
    setState({ selectedLayerId: layerId });
  },

  updateTextLayer: (layerId: string, patch: Partial<TextLayer>) => {
    if (!state.activeAnnouncement) return;
    const updatedLayers = state.activeAnnouncement.layers.map((layer) => {
      if (layer.id === layerId && layer.type === 'text') {
        return { ...layer, ...patch } as TextLayer;
      }
      return layer;
    });

    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        layers: updatedLayers,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  updateImageLayer: (layerId: string, patch: Partial<ImageLayer>) => {
    if (!state.activeAnnouncement) return;
    const updatedLayers = state.activeAnnouncement.layers.map((layer) => {
      if (layer.id === layerId && layer.type === 'image') {
        return { ...layer, ...patch } as ImageLayer;
      }
      return layer;
    });

    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        layers: updatedLayers,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeLayer: (layerId: string) => {
    if (!state.activeAnnouncement) return;
    const filtered = state.activeAnnouncement.layers.filter((l) => l.id !== layerId);
    setState({
      activeAnnouncement: {
        ...state.activeAnnouncement,
        layers: filtered,
        updatedAt: new Date().toISOString(),
      },
      selectedLayerId: state.selectedLayerId === layerId ? (filtered[0]?.id || null) : state.selectedLayerId,
    });
  },

  saveCurrentAnnouncement: async () => {
    if (!state.activeAnnouncement) return;
    const toSave = {
      ...state.activeAnnouncement,
      updatedAt: new Date().toISOString(),
    };

    // Actualizar en el estado en memoria
    const list = state.announcements.filter((a) => a.id !== toSave.id);
    list.unshift(toSave);

    setState({
      announcements: list,
      activeAnnouncement: toSave,
    });

    // Persistir a disco en AppData via Tauri
    try {
      await saveAnnouncement({
        id: toSave.id,
        name: toSave.name,
        background: toSave.background,
        layers: toSave.layers,
        created_at: toSave.createdAt,
        updated_at: toSave.updatedAt,
      });
    } catch (e) {
      console.error('Error persistiendo anuncio en disco:', e);
    }
  },

  duplicateAnnouncement: async (announcement: Announcement) => {
    const duplicated: Announcement = {
      ...JSON.parse(JSON.stringify(announcement)),
      id: `ann-${Date.now()}`,
      name: `${announcement.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = [duplicated, ...state.announcements];
    setState({ announcements: list });

    try {
      await saveAnnouncement({
        id: duplicated.id,
        name: duplicated.name,
        background: duplicated.background,
        layers: duplicated.layers,
        created_at: duplicated.createdAt,
        updated_at: duplicated.updatedAt,
      });
    } catch (e) {
      console.error('Error guardando anuncio duplicado:', e);
    }
  },

  deleteAnnouncementById: async (id: string) => {
    const list = state.announcements.filter((a) => a.id !== id);
    setState({
      announcements: list,
      activeAnnouncement: state.activeAnnouncement?.id === id ? null : state.activeAnnouncement,
      isEditorOpen: state.activeAnnouncement?.id === id ? false : state.isEditorOpen,
    });

    try {
      await deleteAnnouncement(id);
    } catch (e) {
      console.error('Error eliminando anuncio de disco:', e);
    }
  },

  createAnnouncementScene: (announcement: Announcement): Scene => {
    return {
      id: `sc-ann-${announcement.id}`,
      title: announcement.name,
      type: 'announcement',
      order: 0,
      style: {
        backgroundColor: announcement.background?.type === 'color' ? announcement.background.color : '#050505',
        aspectRatio: '16:9',
        transition: 'cut',
      },
      content: {
        announcement: {
          title: announcement.name,
          announcement: announcement,
        },
      },
    };
  },

  sendToPreview: (announcement: Announcement) => {
    const scene = announcementStore.createAnnouncementScene(announcement);
    presentationStore.setPreviewScene(scene);
  },

  presentDirectly: (announcement: Announcement) => {
    const scene = announcementStore.createAnnouncementScene(announcement);
    presentationStore.presentSceneDirectly(scene);
  },

  addToProject: (announcement: Announcement) => {
    const scene = announcementStore.createAnnouncementScene(announcement);
    churchStore.addScene(scene);
  },
};

export function useAnnouncements() {
  return useSyncExternalStore(announcementStore.subscribe, announcementStore.getSnapshot);
}
