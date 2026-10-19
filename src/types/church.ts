export type SceneType =
  | 'text'
  | 'bible'
  | 'song'
  | 'video'
  | 'image'
  | 'announcement'
  | 'title'
  | 'black';

export interface SceneStyle {
  fontFamily?: string;
  fontSize?: number; // Base point/px size
  textColor?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'medium' | 'bold';
  textShadow?: boolean;
  aspectRatio?: '16:9' | '16:10' | '4:3';
  transition?: 'cut' | 'fade';
}

export interface BibleContent {
  version: string; // e.g. RVR1960
  book: string;    // e.g. Salmos
  chapter: number; // e.g. 23
  verse: number;   // e.g. 1
  verseEnd?: number;
  reference: string; // e.g. Salmos 23:1
  text: string;
}

export interface MediaContent {
  filePath: string;
  fileName: string;
  mediaType: 'audio' | 'video' | 'image';
  duration?: number;
  aspectRatio?: '16:9' | '16:10' | '4:3';
  isMissing?: boolean;
  loop?: boolean;
}

export type SongSectionType =
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'intro'
  | 'outro'
  | 'pre-chorus'
  | 'tag'
  | 'interlude'
  | 'custom';

export interface SongSection {
  id: string;
  type: SongSectionType;
  label: string; // e.g. "Estrofa 1", "Coro", "Puente", etc.
  slides: string[]; // Texto de cada diapositiva de la sección
}

export interface SongArrangement {
  id: string;
  name: string; // e.g. "Estándar", "Acústico", "Corto"
  sequence: string[]; // Lista de IDs de secciones en el orden que se cantan
}

export interface ChurchSong {
  id: string;
  title: string;
  artist?: string;
  author?: string;
  originalKey?: string; // Tono (ej: "G", "C", "D", "Am")
  tempo?: number; // BPM
  timeSignature?: string; // "4/4", "6/8", etc.
  ccliNumber?: string;
  tags?: string[];
  sections: SongSection[];
  arrangements: SongArrangement[];
  defaultArrangementId: string;
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    backgroundImageUrl?: string;
    fontFamily?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SongSlideMeta {
  index: number;
  sectionId?: string;
  sectionType?: SongSectionType;
  sectionLabel?: string;
  stanzaNumber?: number;
}

export interface SongContent {
  title: string;
  author?: string;
  slides: string[];
  activeSlideIndex: number;
  slidesMeta?: SongSlideMeta[];
  mediaPath?: string; // Optional backing video/audio track
  songId?: string;
  arrangementId?: string;
  sectionId?: string;
  sectionLabel?: string;
  sectionType?: SongSectionType;
}

export interface AnnouncementBackground {
  type: 'color' | 'image';
  color?: string;
  filePath?: string;
}

export interface TextLayer {
  id: string;
  type: 'text';
  text: string;
  x: number; // Porcentaje horizontal (0-100)
  y: number; // Porcentaje vertical (0-100)
  width?: number; // Porcentaje de ancho (opcional)
  fontSize: number; // En píxeles base de referencia (ej. 48)
  fontFamily?: string; // Tipo de letra (Inter, Merriweather, Montserrat, Oswald, etc.)
  fontWeight: 'normal' | 'medium' | 'bold' | 'black';
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ImageLayer {
  id: string;
  type: 'image';
  filePath: string;
  fileName: string;
  x: number; // Porcentaje horizontal (0-100)
  y: number; // Porcentaje vertical (0-100)
  width: number; // Porcentaje de ancho respecto al canvas
  opacity?: number;
}

export interface Announcement {
  id: string;
  name: string;
  background?: AnnouncementBackground;
  layers: (TextLayer | ImageLayer)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementContent {
  title: string;
  date?: string;
  time?: string;
  details?: string;
  tag?: string;
  announcement?: Announcement;
}

export interface TitleContent {
  title: string;
  subtitle?: string;
  preacher?: string;
  series?: string;
}

export interface Scene {
  id: string;
  title: string;
  type: SceneType;
  groupId?: string;
  order: number;
  style: SceneStyle;
  content: {
    text?: string;
    bible?: BibleContent;
    media?: MediaContent;
    song?: SongContent;
    announcement?: AnnouncementContent;
    title?: TitleContent;
  };
}

export interface SceneGroup {
  id: string;
  name: string; // e.g. BIENVENIDA, ALABANZA, PALABRA, OFRENDA, ANUNCIOS, DESPEDIDA
  color?: string;
  order: number;
}

export interface ChurchProject {
  id: string;
  name: string;
  date: string;
  eventType?: 'culto' | 'congreso' | 'conferencia' | 'evento' | 'especial';
  groups: SceneGroup[];
  scenes: Scene[];
  updatedAt: string;
}

export interface DisplayInfo {
  id: number;
  name: string;
  is_primary: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
}

export interface AudioTrackInfo {
  filePath: string;
  fileName: string;
  duration?: number;
}

export type PresentationSyncMessage =
  | {
      type: 'LIVE_UPDATE';
      scene: Scene | null;
      isBlackout: boolean;
      transition: 'cut' | 'fade';
      timestamp: number;
      mediaLoadId: number;
      backgroundAudio?: AudioTrackInfo | null;
    }
  | {
      type: 'MEDIA_ACTION';
      action: 'play' | 'pause' | 'seek' | 'volume' | 'speed' | 'stop';
      target?: 'video' | 'audio' | 'all';
      time?: number;
      volume?: number;
      speed?: number;
      isMuted?: boolean;
      mediaLoadId?: number;
    }
  | {
      type: 'MEDIA_STATE_UPDATE';
      channel: 'video' | 'audio';
      mediaLoadId: number;
      currentTime: number;
      duration: number;
      isPlaying: boolean;
      volume: number;
      speed: number;
      isMuted: boolean;
      ended: boolean;
      activeMediaId: string | null;
    }
  | {
      type: 'REQUEST_STATE';
    }
  | {
      type: 'STATE_RESPONSE';
      scene: Scene | null;
      isBlackout: boolean;
      mediaLoadId: number;
      backgroundAudio?: AudioTrackInfo | null;
    }
  | {
      type: 'DISPOSE_ALL_MEDIA';
    }
  | {
      type: 'STAGE_SYNC_MESSAGE';
      payload: any;
    };
