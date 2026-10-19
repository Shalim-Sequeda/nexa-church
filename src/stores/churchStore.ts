import { useSyncExternalStore } from 'react';
import { ChurchProject, Scene, SceneGroup, SceneType } from '../types/church';
import { presentationStore, registerNextSceneGetter } from './presentationStore';
import { openFileDialog, readProjectFile, saveFileDialog, writeProjectFile } from '../services/tauri';
import { renderPdfPagesToImages } from '../services/pdfService';

export interface ChurchState {
  currentProject: ChurchProject;
  activeSceneId: string | null;
  activeGroupId: string | null;
  filterText: string;
  isSaving: boolean;
  isDirty: boolean;
  projectFilePath: string | null;
  isImportingPdf: boolean;
  pdfProgress: { current: number; total: number; filename: string } | null;
  pdfError: string | null;
  showExitPrompt: boolean;
}

const DEFAULT_GROUPS: SceneGroup[] = [
  { id: 'grp-bienvenida', name: 'BIENVENIDA', color: '#71717A', order: 0 },
  { id: 'grp-alabanza', name: 'ALABANZA', color: '#A1A1AA', order: 1 },
  { id: 'grp-palabra', name: 'PALABRA', color: '#10B981', order: 2 },
  { id: 'grp-ofrenda', name: 'OFRENDA', color: '#F59E0B', order: 3 },
  { id: 'grp-anuncios', name: 'ANUNCIOS', color: '#D4D4D8', order: 4 },
  { id: 'grp-despedida', name: 'DESPEDIDA', color: '#52525B', order: 5 },
];

const DEFAULT_SCENES: Scene[] = [
  {
    id: 'sc-1',
    title: '01 — Bienvenida al Culto',
    type: 'title',
    groupId: 'grp-bienvenida',
    order: 0,
    style: {
      fontSize: 52,
      textColor: '#FFFFFF',
      backgroundColor: '#090B10',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      title: {
        title: '¡BIENVENIDOS A LA CASA DE DIOS!',
        subtitle: 'Culto de Adoración y Palabra',
        series: 'SHALIM TECHNOLOGIES — NEXA Church',
      },
    },
  },
  {
    id: 'sc-2',
    title: '02 — Canción: Grande es tu fidelidad',
    type: 'song',
    groupId: 'grp-alabanza',
    order: 1,
    style: {
      fontSize: 44,
      textColor: '#F8FAFC',
      backgroundColor: '#0B0F19',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'medium',
      transition: 'fade',
    },
    content: {
      song: {
        title: 'Grande es tu fidelidad',
        author: 'Himnario Cristiano',
        slides: [
          'Oh Dios eterno, tu misericordia\nNi una sombra de duda tendrá;\nTu compasión y bondad nunca fallan,\nY por los siglos el mismo serás.',
          '¡Grande es tu fidelidad!\n¡Grande es tu fidelidad!\nCada mañana renuevas tu amor;\nNada me falta, pues todo provees,\n¡Grande, Señor, es tu fidelidad!',
          'Tú me perdonas, me impartes la paz,\nTu presencia me guía y consuela;\nFuerzas me das hoy, valor para el mañana,\nGrandes bendiciones derramas en mí.',
        ],
        activeSlideIndex: 0,
      },
    },
  },
  {
    id: 'sc-3',
    title: '03 — Canción: Tu fidelidad',
    type: 'song',
    groupId: 'grp-alabanza',
    order: 2,
    style: {
      fontSize: 44,
      textColor: '#F8FAFC',
      backgroundColor: '#0B0F19',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'medium',
      transition: 'fade',
    },
    content: {
      song: {
        title: 'Tu fidelidad es grande',
        slides: [
          'Tu fidelidad es grande,\nTu fidelidad incomparable es;\nNadie como tú, bendito Dios,\nGrande es tu fidelidad.',
        ],
        activeSlideIndex: 0,
      },
    },
  },
  {
    id: 'sc-4',
    title: '04 — Salmos 23:1',
    type: 'bible',
    groupId: 'grp-palabra',
    order: 3,
    style: {
      fontSize: 48,
      textColor: '#F8FAFC',
      backgroundColor: '#090B10',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      bible: {
        version: 'RVR1960',
        book: 'Salmos',
        chapter: 23,
        verse: 1,
        reference: 'Salmos 23:1',
        text: 'Jehová es mi pastor; nada me faltará.',
      },
    },
  },
  {
    id: 'sc-5',
    title: '05 — Video de bienvenida',
    type: 'video',
    groupId: 'grp-bienvenida',
    order: 4,
    style: {
      backgroundColor: '#000000',
      aspectRatio: '16:9',
      transition: 'cut',
    },
    content: {
      media: {
        filePath: 'C:/Videos/Iglesia/Bienvenida.mp4',
        fileName: 'Bienvenida.mp4',
        mediaType: 'video',
        duration: 120,
      },
    },
  },
  {
    id: 'sc-6',
    title: '06 — Predicación: El poder de la fe',
    type: 'title',
    groupId: 'grp-palabra',
    order: 5,
    style: {
      fontSize: 54,
      textColor: '#F4F4F5',
      backgroundColor: '#090B10',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      title: {
        title: 'PREDICACIÓN',
        subtitle: '"El poder de la fe inquebrantable"',
        preacher: 'Pastor Principal',
      },
    },
  },
  {
    id: 'sc-7',
    title: '07 — Juan 3:16',
    type: 'bible',
    groupId: 'grp-palabra',
    order: 6,
    style: {
      fontSize: 44,
      textColor: '#F8FAFC',
      backgroundColor: '#090B10',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'medium',
      transition: 'fade',
    },
    content: {
      bible: {
        version: 'RVR1960',
        book: 'Juan',
        chapter: 3,
        verse: 16,
        reference: 'Juan 3:16',
        text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
      },
    },
  },
  {
    id: 'sc-8',
    title: '08 — Momento de Ofrenda',
    type: 'text',
    groupId: 'grp-ofrenda',
    order: 7,
    style: {
      fontSize: 42,
      textColor: '#FCD34D',
      backgroundColor: '#0F121C',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      text: 'DIOS AMA AL DADOR ALEGRE\n\n2 Corintios 9:7\n"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad."',
    },
  },
  {
    id: 'sc-9',
    title: '09 — Anuncio: Reunión de Jóvenes',
    type: 'announcement',
    groupId: 'grp-anuncios',
    order: 8,
    style: {
      fontSize: 40,
      textColor: '#F8FAFC',
      backgroundColor: '#111827',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      announcement: {
        title: 'REUNIÓN DE JÓVENES',
        date: 'VIERNES',
        time: '7:00 PM',
        details: '¡No te lo pierdas! Ven con un amigo.',
        tag: 'MINISTERIO JUVENIL',
      },
    },
  },
  {
    id: 'sc-10',
    title: '10 — Despedida y Bendición Pastoral',
    type: 'text',
    groupId: 'grp-despedida',
    order: 9,
    style: {
      fontSize: 46,
      textColor: '#F8FAFC',
      backgroundColor: '#090B10',
      textAlign: 'center',
      textShadow: true,
      fontWeight: 'bold',
      transition: 'fade',
    },
    content: {
      text: '¡LA PAZ DE CRISTO SEA CON VOSOTROS!\n\n"Jehová te bendiga, y te guarde;\nJehová haga resplandecer su rostro sobre ti."\nNúmeros 6:24-25',
    },
  },
];

export function getFormattedToday(): string {
  const now = new Date();
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  return `${days[now.getDay()]} ${now.getDate()} DE ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function generateDefaultEventName(eventType: 'culto' | 'congreso' | 'conferencia' | 'evento' | 'especial' = 'culto'): string {
  const prefix = eventType === 'congreso' ? 'CONGRESO' :
                 eventType === 'conferencia' ? 'CONFERENCIA' :
                 eventType === 'especial' ? 'EVENTO ESPECIAL' :
                 eventType === 'evento' ? 'REUNIÓN' : 'CULTO';
  return `${prefix} — ${getFormattedToday()}`;
}

export const INITIAL_PROJECT: ChurchProject = {
  id: `proj-${Date.now()}`,
  name: generateDefaultEventName('culto'),
  date: new Date().toISOString().split('T')[0],
  eventType: 'culto',
  groups: DEFAULT_GROUPS,
  scenes: DEFAULT_SCENES,
  updatedAt: new Date().toISOString(),
};

const STORAGE_PROJECT_KEY = 'nexa_church_active_project_data_v2';
const STORAGE_FILEPATH_KEY = 'nexa_church_active_project_path_v2';

let persistTimeout: ReturnType<typeof setTimeout> | null = null;

function autoPersistProject(project: ChurchProject, path: string | null, immediate = false) {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
    persistTimeout = null;
  }

  const doPersist = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
        if (path) {
          localStorage.setItem(STORAGE_FILEPATH_KEY, path);
        } else {
          localStorage.removeItem(STORAGE_FILEPATH_KEY);
        }
      }
    } catch (err) {
      console.warn('Error persistiendo proyecto localmente:', err);
    }
  };

  if (immediate) {
    doPersist();
  } else {
    persistTimeout = setTimeout(doPersist, 150);
  }
}

function getInitialProjectState(): { project: ChurchProject; filePath: string | null } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_PROJECT_KEY);
      const path = localStorage.getItem(STORAGE_FILEPATH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0 && parsed.name) {
          return { project: parsed, filePath: path || null };
        }
      }
    }
  } catch (err) {
    console.warn('No se pudo restaurar proyecto previo:', err);
  }
  return { project: INITIAL_PROJECT, filePath: null };
}

const loadedInitial = getInitialProjectState();

const initialState: ChurchState = {
  currentProject: loadedInitial.project,
  activeSceneId: loadedInitial.project.scenes[0]?.id || 'sc-1',
  activeGroupId: null,
  filterText: '',
  isSaving: false,
  isDirty: false,
  projectFilePath: loadedInitial.filePath,
  isImportingPdf: false,
  pdfProgress: null,
  pdfError: null,
  showExitPrompt: false,
};

let state: ChurchState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: Partial<ChurchState> | ((prev: ChurchState) => Partial<ChurchState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  const projectChanged = Boolean(next.currentProject && next.currentProject !== state.currentProject);
  const isDirty = next.isDirty !== undefined ? next.isDirty : (projectChanged ? true : state.isDirty);
  state = { ...state, ...next, isDirty };
  if (projectChanged || next.projectFilePath !== undefined) {
    autoPersistProject(state.currentProject, state.projectFilePath);
  }
  notify();
}

export const churchStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: () => {
    if (typeof window !== 'undefined' && window.location.search.includes('window=')) {
      return; // Solo la ventana principal (main) administra el proyecto y los cues
    }
    // Set initial preview to the first scene
    if (state.currentProject.scenes.length > 0) {
      presentationStore.setPreviewScene(state.currentProject.scenes[0]);
    }

    // Registrar proveedor de siguiente escena para Lower Thirds y Control Remoto
    registerNextSceneGetter(() => {
      const scenes = state.currentProject.scenes;
      const currentRefId = presentationStore.getSnapshot().liveScene?.id || state.activeSceneId;
      const idx = scenes.findIndex((s) => s.id === currentRefId);
      return idx >= 0 && idx < scenes.length - 1 ? scenes[idx + 1] : null;
    });

    // Sincronizar proyecto actualizado si se modifica desde otra ventana
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_PROJECT_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && Array.isArray(parsed.scenes)) {
              state = { ...state, currentProject: parsed };
              notify();
            }
          } catch {}
        }
      });
    }
  },

  setActiveSceneId: (id: string | null) => {
    setState({ activeSceneId: id });
    if (id) {
      const scene = state.currentProject.scenes.find((s) => s.id === id);
      if (scene) {
        presentationStore.setPreviewScene(scene);
      }
    }
  },

  setActiveGroupId: (id: string | null) => {
    setState({ activeGroupId: id });
  },

  setFilterText: (text: string) => {
    setState({ filterText: text });
  },

  // Gestión de escenas
  addScene: (sceneData: Partial<Scene> & { title: string; type: SceneType }) => {
    const currentScenes = state.currentProject.scenes;
    const newScene: Scene = {
      id: `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: sceneData.title,
      type: sceneData.type,
      groupId: sceneData.groupId || state.activeGroupId || currentScenes[0]?.groupId || 'grp-palabra',
      order: currentScenes.length,
      style: {
        fontSize: 46,
        textColor: '#F8FAFC',
        backgroundColor: '#090B10',
        textAlign: 'center',
        textShadow: true,
        fontWeight: 'bold',
        transition: 'fade',
        ...sceneData.style,
      },
      content: sceneData.content || {},
    };

    const updated = [...currentScenes, newScene];
    setState((prev) => ({
      currentProject: { ...prev.currentProject, scenes: updated, updatedAt: new Date().toISOString() },
      activeSceneId: newScene.id,
    }));

    // Cargar inmediatamente en PREVIEW para que el operador la inspeccione
    presentationStore.setPreviewScene(newScene);
    return newScene;
  },

  /**
   * Agregar múltiples escenas en bloque (sin límite de cantidad)
   */
  addScenes: (scenesData: Array<Partial<Scene> & { title: string; type: SceneType }>): Scene[] => {
    if (scenesData.length === 0) return [];
    const currentScenes = state.currentProject.scenes;
    const baseOrder = currentScenes.length;

    const newScenes: Scene[] = scenesData.map((data, idx) => ({
      id: `sc-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      title: data.title,
      type: data.type,
      groupId: data.groupId || (state.activeGroupId ?? undefined) || currentScenes[0]?.groupId || 'grp-alabanza',
      order: baseOrder + idx,
      style: {
        fontSize: 46,
        textColor: '#F8FAFC',
        backgroundColor: '#000000',
        textAlign: 'center',
        textShadow: false,
        fontWeight: 'normal',
        transition: 'fade',
        ...data.style,
      },
      content: data.content || {},
    }));

    const updated = [...currentScenes, ...newScenes];
    setState((prev) => ({
      currentProject: { ...prev.currentProject, scenes: updated, updatedAt: new Date().toISOString() },
      activeSceneId: newScenes[0].id,
    }));

    // Cargar la primera página en PREVIEW para inspección
    presentationStore.setPreviewScene(newScenes[0]);
    return newScenes;
  },

  /**
   * Importa un archivo PDF, convierte cada una de sus páginas en una escena/cue de alta resolución
   * y las agrega al proyecto sin límite en el número de páginas.
   */
  importPdfToScenes: async (customFilePath?: string): Promise<Scene[] | null> => {
    let filePath: string | null | undefined = customFilePath;
    if (!filePath) {
      filePath = await openFileDialog([
        { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] },
      ]);
    }
    if (!filePath) return null;

    const fileNameOnly = filePath.split(/[\\/]/).pop() || 'Archivo PDF';

    setState({
      isImportingPdf: true,
      pdfProgress: { current: 0, total: 1, filename: fileNameOnly },
      pdfError: null,
    });

    try {
      const pages = await renderPdfPagesToImages(filePath, (current, total, filename) => {
        setState({
          pdfProgress: { current, total, filename },
        });
      });

      const scenesToAdd: Array<Partial<Scene> & { title: string; type: SceneType }> = pages.map((p) => ({
        title: `${p.pdfName} — Pág. ${p.pageNumber}/${p.totalPages}`,
        type: 'image',
        groupId: (state.activeGroupId ?? undefined) || 'grp-alabanza',
        style: {
          backgroundColor: '#000000',
          transition: 'fade',
        },
        content: {
          media: {
            filePath: p.imagePath,
            fileName: `${p.pdfName}_pag_${p.pageNumber}.jpg`,
            mediaType: 'image',
          },
        },
      }));

      const created = churchStore.addScenes(scenesToAdd);

      setState({
        isImportingPdf: false,
        pdfProgress: null,
        pdfError: null,
      });

      return created;
    } catch (err: any) {
      console.error('Error importando PDF a Cues:', err);
      setState({
        isImportingPdf: false,
        pdfProgress: null,
        pdfError: err?.message || 'Error procesando el archivo PDF.',
      });
      return null;
    }
  },

  updateScene: (id: string, partial: Partial<Scene>) => {
    setState((prev) => {
      const updated = prev.currentProject.scenes.map((s) => (s.id === id ? { ...s, ...partial } : s));
      const active = updated.find((s) => s.id === id);
      if (active && prev.activeSceneId === id) {
        presentationStore.setPreviewScene(active);
      }
      return {
        currentProject: { ...prev.currentProject, scenes: updated, updatedAt: new Date().toISOString() },
      };
    });
  },

  duplicateScene: (id: string) => {
    const scene = state.currentProject.scenes.find((s) => s.id === id);
    if (!scene) return;

    const duplicated: Scene = {
      ...scene,
      id: `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${scene.title} (Copia)`,
      order: scene.order + 1,
    };

    const scenes = [...state.currentProject.scenes];
    const index = scenes.findIndex((s) => s.id === id);
    scenes.splice(index + 1, 0, duplicated);

    // Re-index orders
    const reordered = scenes.map((s, idx) => ({ ...s, order: idx }));
    setState((prev) => ({
      currentProject: { ...prev.currentProject, scenes: reordered, updatedAt: new Date().toISOString() },
      activeSceneId: duplicated.id,
    }));
    presentationStore.setPreviewScene(duplicated);
  },

  deleteScene: (id: string) => {
    const remaining = state.currentProject.scenes.filter((s) => s.id !== id);
    const reordered = remaining.map((s, idx) => ({ ...s, order: idx }));
    const nextActive = reordered[0]?.id || null;

    setState((prev) => ({
      currentProject: { ...prev.currentProject, scenes: reordered, updatedAt: new Date().toISOString() },
      activeSceneId: nextActive,
    }));

    if (reordered.length > 0) {
      presentationStore.setPreviewScene(reordered[0]);
    } else {
      presentationStore.setPreviewScene(null);
    }
  },

  reorderScenes: (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;
    const scenes = [...state.currentProject.scenes];
    const [moved] = scenes.splice(startIndex, 1);
    scenes.splice(endIndex, 0, moved);

    const reordered = scenes.map((s, idx) => ({ ...s, order: idx }));
    setState((prev) => ({
      currentProject: { ...prev.currentProject, scenes: reordered, updatedAt: new Date().toISOString() },
    }));
  },

  // Navegación de culto en vivo (Siguiente / Anterior)
  nextScene: () => {
    const scenes = state.currentProject.scenes;
    if (scenes.length === 0) return;

    // Tomar como referencia la escena en LIVE o en PREVIEW dentro de los cues
    const currentRefId = presentationStore.getSnapshot().liveScene?.id || state.activeSceneId;
    const currentIndex = scenes.findIndex((s) => s.id === currentRefId);

    if (currentIndex !== -1 && currentIndex < scenes.length - 1) {
      const nextScene = scenes[currentIndex + 1];
      setState({ activeSceneId: nextScene.id });
      presentationStore.setPreviewScene(nextScene);
      // Presentar directamente al avanzar durante el culto
      presentationStore.presentPreview();
    }
  },

  previousScene: () => {
    const scenes = state.currentProject.scenes;
    if (scenes.length === 0) return;

    const currentRefId = presentationStore.getSnapshot().liveScene?.id || state.activeSceneId;
    const currentIndex = scenes.findIndex((s) => s.id === currentRefId);

    if (currentIndex > 0) {
      const prevScene = scenes[currentIndex - 1];
      setState({ activeSceneId: prevScene.id });
      presentationStore.setPreviewScene(prevScene);
      presentationStore.presentPreview();
    }
  },

  jumpToChorusScene: (): boolean => {
    const scenes = state.currentProject.scenes;
    if (scenes.length === 0) return false;
    const currentRefId = presentationStore.getSnapshot().liveScene?.id || state.activeSceneId;
    const currentIndex = scenes.findIndex((s) => s.id === currentRefId);

    const chorusScenes = scenes
      .map((sc, idx) => ({ sc, idx }))
      .filter(({ sc }) => {
        if (sc.type !== 'song') return false;
        const s = sc.content.song;
        return (
          s?.sectionType === 'chorus' ||
          (s?.sectionLabel && s.sectionLabel.toLowerCase().includes('coro')) ||
          sc.title.toLowerCase().includes('coro')
        );
      });

    if (chorusScenes.length === 0) return false;

    const nextChorus = chorusScenes.find(({ idx }) => idx > currentIndex);
    const target = nextChorus ? nextChorus.sc : chorusScenes[0].sc;

    setState({ activeSceneId: target.id });
    presentationStore.setPreviewScene(target);
    presentationStore.presentPreview();
    return true;
  },

  jumpToVerseScene: (stanzaNum: number): boolean => {
    const scenes = state.currentProject.scenes;
    if (scenes.length === 0) return false;

    const target = scenes.find((sc) => {
      if (sc.type !== 'song') return false;
      const s = sc.content.song;
      const label = (s?.sectionLabel || sc.title).toLowerCase();
      return (
        (s?.sectionType === 'verse' && label.includes(String(stanzaNum))) ||
        label.includes(`estrofa ${stanzaNum}`) ||
        label.includes(`verso ${stanzaNum}`)
      );
    });

    if (!target) return false;

    setState({ activeSceneId: target.id });
    presentationStore.setPreviewScene(target);
    presentationStore.presentPreview();
    return true;
  },

  // Gestión y personalización del Evento / Proyecto
  setProjectName: (name: string) => {
    setState((prev) => ({
      currentProject: {
        ...prev.currentProject,
        name: name.trim() || generateDefaultEventName(prev.currentProject.eventType || 'culto'),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  setProjectDetails: (details: {
    name?: string;
    date?: string;
    eventType?: 'culto' | 'congreso' | 'conferencia' | 'evento' | 'especial';
  }) => {
    setState((prev) => ({
      currentProject: {
        ...prev.currentProject,
        name: details.name !== undefined ? (details.name.trim() || generateDefaultEventName(details.eventType || prev.currentProject.eventType || 'culto')) : prev.currentProject.name,
        date: details.date ?? prev.currentProject.date,
        eventType: details.eventType ?? prev.currentProject.eventType,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  // Persistencia de proyectos
  newProject: (eventType: 'culto' | 'congreso' | 'conferencia' | 'evento' | 'especial' = 'culto') => {
    const newProj: ChurchProject = {
      id: `proj-${Date.now()}`,
      name: generateDefaultEventName(eventType),
      date: new Date().toISOString().split('T')[0],
      eventType,
      groups: DEFAULT_GROUPS,
      scenes: [],
      updatedAt: new Date().toISOString(),
    };
    setState({
      currentProject: newProj,
      activeSceneId: null,
      projectFilePath: null,
      isDirty: false,
      showExitPrompt: false,
    });
    presentationStore.setPreviewScene(null);
  },

  setShowExitPrompt: (show: boolean) => {
    setState({ showExitPrompt: show });
  },

  loadProjectFromFile: async () => {
    const path = await openFileDialog([{ name: 'Proyecto NEXA Church (*.nexachurch, *.json)', extensions: ['nexachurch', 'json'] }]);
    if (!path) return;

    try {
      const content = await readProjectFile(path);
      const project: ChurchProject = JSON.parse(content);
      setState({
        currentProject: project,
        projectFilePath: path,
        activeSceneId: project.scenes[0]?.id || null,
        isDirty: false,
        showExitPrompt: false,
      });
      if (project.scenes.length > 0) {
        presentationStore.setPreviewScene(project.scenes[0]);
      }
    } catch (e) {
      console.error('Error cargando proyecto:', e);
    }
  },

  saveProject: async (): Promise<boolean> => {
    let path = state.projectFilePath;
    if (!path) {
      path = await saveFileDialog(`${state.currentProject.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.nexachurch`);
      if (!path) return false;
    }

    setState({ isSaving: true });
    try {
      const json = JSON.stringify(state.currentProject, null, 2);
      await writeProjectFile(path, json);
      setState({ projectFilePath: path, isSaving: false, isDirty: false, showExitPrompt: false });
      return true;
    } catch (e) {
      console.error('Error guardando proyecto:', e);
      setState({ isSaving: false });
      return false;
    }
  },
};

export function useChurch() {
  return useSyncExternalStore(churchStore.subscribe, churchStore.getSnapshot);
}