import { describe, it, expect, beforeEach } from 'vitest';
import { presentationStore } from '../src/stores/presentationStore';
import { churchStore, generateDefaultEventName, getFormattedToday } from '../src/stores/churchStore';
import { bibleStore } from '../src/stores/bibleStore';
import { announcementStore } from '../src/stores/announcementStore';
import { songStore, PRESET_WORSHIP_SONGS } from '../src/stores/songStore';
import { stageStore } from '../src/stores/stageStore';
import { mediaStore } from '../src/stores/mediaStore';
import { getBibleDynamicFontSizes, getSongDynamicFontSizes } from '../src/utils/bibleTypography';
import { resolveMediaUrl, loadMediaBlobUrl, clearMediaBlobCache } from '../src/services/tauri';
import {
  parseBibleReference,
  getBibleVerseText,
  getAuthenticVerseText,
  parseBibleBiText,
  getChapterVerseCount,
  getVersionButtonLabels,
} from '../src/data/bibleData';
import { Scene, Announcement, SceneType } from '../src/types/church';

describe('NEXA Church — Tests Obligatorios', () => {
  beforeEach(() => {
    presentationStore.resetForTesting();
    churchStore.newProject();
  });

  // TEST 1 — PREVIEW / LIVE INDEPENDENCE
  it('TEST 1: PREVIEW y LIVE son estados estrictamente independientes', () => {
    const sceneA: Scene = {
      id: 'test-a',
      title: 'Salmos 23:1',
      type: 'bible',
      order: 0,
      style: { fontSize: 48 },
      content: { bible: { version: 'RVR1960', book: 'Salmos', chapter: 23, verse: 1, reference: 'Salmos 23:1', text: 'Jehová es mi pastor; nada me faltará.' } },
    };

    const sceneB: Scene = {
      id: 'test-b',
      title: 'Juan 3:16',
      type: 'bible',
      order: 1,
      style: { fontSize: 44 },
      content: { bible: { version: 'RVR1960', book: 'Juan', chapter: 3, verse: 16, reference: 'Juan 3:16', text: 'Porque de tal manera amó Dios al mundo...' } },
    };

    // 1. Cargar A en Preview y Presentar
    presentationStore.setPreviewScene(sceneA);
    expect(presentationStore.getSnapshot().previewScene?.id).toBe('test-a');
    expect(presentationStore.getSnapshot().liveScene).toBeNull();

    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('test-a');

    // 2. Modificar PREVIEW a B
    presentationStore.setPreviewScene(sceneB);
    expect(presentationStore.getSnapshot().previewScene?.id).toBe('test-b');

    // REGLA CRÍTICA: LIVE continúa mostrando A inalterado
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('test-a');
    expect(presentationStore.getSnapshot().liveScene?.content.bible?.reference).toBe('Salmos 23:1');

    // 3. Presentar B
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('test-b');
    expect(presentationStore.getSnapshot().liveScene?.content.bible?.reference).toBe('Juan 3:16');
  });

  // TEST 2 & TEST 3 — VIDEO ATÓMICO Y CAMBIO MANUAL
  it('TEST 2 & 3: Cambio de video detiene el anterior y comienza estrictamente desde 00:00', () => {
    const videoA: Scene = {
      id: 'vid-a',
      title: 'Video Bienvenida',
      type: 'video',
      order: 0,
      style: {},
      content: { media: { filePath: 'C:/Videos/A.mp4', fileName: 'A.mp4', mediaType: 'video', duration: 180 } },
    };

    const videoB: Scene = {
      id: 'vid-b',
      title: 'Video Especial',
      type: 'video',
      order: 1,
      style: {},
      content: { media: { filePath: 'C:/Videos/B.mp4', fileName: 'B.mp4', mediaType: 'video', duration: 210 } },
    };

    // Presentar Video A y simular reproducción en el segundo 45
    presentationStore.setPreviewScene(videoA);
    presentationStore.presentPreview();
    presentationStore.updateMediaProgress(45, 180);

    expect(presentationStore.getSnapshot().liveScene?.id).toBe('vid-a');
    expect(presentationStore.getSnapshot().mediaPlayback.currentTime).toBe(45);
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('C:/Videos/A.mp4');

    // Cambiar a Video B y presentar
    presentationStore.setPreviewScene(videoB);
    presentationStore.presentPreview();

    // Comprobar que Video B toma el control a partir de 00:00 y activeMediaId es B
    const snapshot = presentationStore.getSnapshot();
    expect(snapshot.liveScene?.id).toBe('vid-b');
    expect(snapshot.mediaPlayback.activeMediaId).toBe('C:/Videos/B.mp4');
    expect(snapshot.mediaPlayback.currentTime).toBe(0);
    expect(snapshot.mediaPlayback.isPlaying).toBe(true);
  });

  // TEST 5 — REEMPLAZO TOTAL ENTRE TIPOS DE CONTENIDO
  it('TEST 5: Cada cambio de tipo reemplaza completamente el contenido anterior sin estados zombies', () => {
    const sequenceTypes = ['bible', 'song', 'video', 'image', 'text', 'announcement', 'title', 'black'] as const;

    for (const type of sequenceTypes) {
      const scene: Scene = {
        id: `seq-${type}`,
        title: `Escena ${type}`,
        type,
        order: 0,
        style: {},
        content: {
          text: type === 'text' ? 'Texto de prueba' : undefined,
          media: type === 'video' || type === 'image' ? { filePath: `test.${type === 'video' ? 'mp4' : 'jpg'}`, fileName: 'test', mediaType: type === 'video' ? 'video' : 'image' } : undefined,
        },
      };

      presentationStore.setPreviewScene(scene);
      presentationStore.presentPreview();

      const live = presentationStore.getSnapshot().liveScene;
      expect(live?.type).toBe(type);
      expect(live?.id).toBe(`seq-${type}`);

      // Si no es medio, la reproducción debe estar inactiva
      if (type !== 'video' && type !== 'song') {
        expect(presentationStore.getSnapshot().mediaPlayback.isPlaying).toBe(false);
      }
    }
  });

  // TEST 7 — BOTÓN NEGRO / BLACK
  it('TEST 7: Botón NEGRO activa blackout total y conserva la escena LIVE al reactivar', () => {
    const scene: Scene = {
      id: 'sc-praise',
      title: 'Momento de Alabanza',
      type: 'title',
      order: 0,
      style: {},
      content: { title: { title: 'ALABANZA Y ADORACIÓN' } },
    };

    presentationStore.setPreviewScene(scene);
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().isBlackout).toBe(false);

    // 1. Presionar NEGRO (B)
    presentationStore.toggleBlackout();
    expect(presentationStore.getSnapshot().isBlackout).toBe(true);
    // La escena LIVE se conserva internamente
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('sc-praise');

    // 2. Reactivar salida
    presentationStore.toggleBlackout();
    expect(presentationStore.getSnapshot().isBlackout).toBe(false);
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('sc-praise');
  });

  // TEST 8 — BIBLIA OFFLINE Y PARSER
  it('TEST 8: Biblia offline resuelve referencias y textos canónicos de RVR1960', () => {
    // Parser de referencias
    const parsedPsalms = parseBibleReference('Salmos 23:1');
    expect(parsedPsalms).not.toBeNull();
    expect(parsedPsalms?.book.name).toBe('Salmos');
    expect(parsedPsalms?.chapter).toBe(23);
    expect(parsedPsalms?.verse).toBe(1);

    const parsedJohn = parseBibleReference('jn 3 16');
    expect(parsedJohn).not.toBeNull();
    expect(parsedJohn?.book.name).toBe('Juan');
    expect(parsedJohn?.chapter).toBe(3);
    expect(parsedJohn?.verse).toBe(16);

    // Texto exacto de Salmos 23:1
    const textPsalms = getBibleVerseText('Salmos', 23, 1);
    expect(textPsalms).toBe('Jehová es mi pastor; nada me faltará.');

    // Búsqueda en store
    bibleStore.searchReference('Juan 3:16');
    expect(bibleStore.getSnapshot().selectedBook.name).toBe('Juan');
    expect(bibleStore.getSnapshot().selectedChapter).toBe(3);
    expect(bibleStore.getSnapshot().selectedVerse).toBe(16);
    expect(bibleStore.getSnapshot().activeVerseText).toContain('de tal manera amó Dios al mundo');

    // Creación de escena bíblica y carga en Preview
    bibleStore.sendToPreview();
    const preview = presentationStore.getSnapshot().previewScene;
    expect(preview?.type).toBe('bible');
    expect(preview?.content.bible?.reference).toBe('Juan 3:16');
  });

  // TEST — GESTIÓN DEL CULTO Y REORDENAMIENTO
  it('Gestión de escenas y proyecto: duplicar, reordenar y siguiente/anterior', () => {
    const sc1 = churchStore.addScene({ title: 'Bienvenida', type: 'text', content: { text: 'Hola' } });
    const sc2 = churchStore.addScene({ title: 'Canción 1', type: 'song', content: { song: { title: 'C1', slides: ['S1'], activeSlideIndex: 0 } } });

    expect(churchStore.getSnapshot().currentProject.scenes.length).toBe(2);

    // Reordenar
    churchStore.reorderScenes(0, 1);
    const scenesAfter = churchStore.getSnapshot().currentProject.scenes;
    expect(scenesAfter[0].id).toBe(sc2.id);
    expect(scenesAfter[1].id).toBe(sc1.id);

    // Empezar en la primera escena (sc2)
    churchStore.setActiveSceneId(sc2.id);

    // Siguiente / Anterior
    churchStore.nextScene();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(sc1.id);

    churchStore.previousScene();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(sc2.id);
  });

  // TEST — TEXTOS BÍBLICOS EXPANDIDOS Y CAPÍTULO COMPLETO
  it('Biblia: Juan 3 versículos 1 al 36 y Salmos 91 versículos 1 al 16 están disponibles', () => {
    // Juan 3:1 y Juan 3:36
    const j1 = getBibleVerseText('Juan', 3, 1);
    expect(j1).toContain('Nicodemo');
    const j36 = getBibleVerseText('Juan', 3, 36);
    expect(j36).toContain('vida eterna');

    // Salmos 91:1 y Salmos 91:16
    const s1 = getBibleVerseText('Salmos', 91, 1);
    expect(s1).toContain('abrigo del Altísimo');
    const s16 = getBibleVerseText('Salmos', 91, 16);
    expect(s16).toContain('larga vida');
  });

  // TEST — IMPORTACIÓN Y VALIDACIÓN DE ARCHIVO JSON DE BIBLIA
  it('Biblia JSON: Valida formato y rechaza archivos sin estructura correcta', async () => {
    const validJson = JSON.stringify({
      name: 'Traducción Especial 2026',
      copyright: 'Dominio Público',
      verses: {
        'Génesis 1:1': 'Al principio creó Dios los cielos y la tierra.',
      },
    });

    await bibleStore.importBibleJsonString(validJson);
    expect(bibleStore.getSnapshot().isCustomVersion).toBe(true);
    expect(bibleStore.getSnapshot().currentVersion.name).toBe('Traducción Especial 2026');

    // Archivo inválido o sin versículos lanza error
    const invalidJson = JSON.stringify({ name: 'Vacío', data: [] });
    await expect(async () => await bibleStore.importBibleJsonString(invalidJson)).rejects.toThrow();
  });

  // TEST — TIMELINE IPC SINCRONIZADA Y CONTROL DE VELOCIDAD
  it('Timeline: MEDIA_STATE_UPDATE actualiza milimétricamente el operador y la velocidad', () => {
    const vid: Scene = {
      id: 'vid-sync',
      title: 'Video Test',
      type: 'video',
      order: 0,
      style: {},
      content: { media: { filePath: 'test.mp4', fileName: 'test.mp4', mediaType: 'video', duration: 120 } },
    };

    presentationStore.presentSceneDirectly(vid);

    // Simular evento nativo del <video> recibido vía IPC
    presentationStore.applyMediaStateFromPresentation({
      currentTime: 42.55,
      duration: 120,
      isPlaying: true,
      volume: 0.85,
      speed: 1.25,
      isMuted: false,
      ended: false,
      activeMediaId: 'test.mp4',
    });

    const state = presentationStore.getSnapshot().mediaPlayback;
    expect(state.currentTime).toBe(42.55);
    expect(state.duration).toBe(120);
    expect(state.isPlaying).toBe(true);
    expect(state.speed).toBe(1.25);
    expect(state.volume).toBe(0.85);

    // Ajustar velocidad desde el operador
    presentationStore.setPlaybackSpeed(1.5);
    expect(presentationStore.getSnapshot().mediaPlayback.speed).toBe(1.5);
  });

  // TEST — ESCENARIO CRÍTICO 3 & 4: MP3 LIVE + MP4 PREVIEW -> TAKE / PRESENTAR
  it('TEST 3 & 4: MP3 LIVE no se altera al preparar MP4 en PREVIEW, y TAKE cede el control del audio al MP4 iniciando en 00:00', () => {
    // 1. Colocar MP3 en LIVE
    const songMp3: Scene = {
      id: 'sc-mp3',
      title: 'Pistas de Adoración',
      type: 'song',
      order: 0,
      style: {},
      content: {
        song: {
          title: 'Pista de Adoración Instrumental',
          slides: ['Instrumental'],
          activeSlideIndex: 0,
          mediaPath: 'C:/Audio/adoracion.mp3',
        },
        media: {
          filePath: 'C:/Audio/adoracion.mp3',
          fileName: 'adoracion.mp3',
          mediaType: 'audio',
          duration: 300,
        },
      },
    };

    presentationStore.presentSceneDirectly(songMp3);
    const initialLoadId = presentationStore.getSnapshot().mediaLoadId;

    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.isPlaying).toBe(true);
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('C:/Audio/adoracion.mp3');

    // 2. Colocar MP4 en PREVIEW
    const videoMp4: Scene = {
      id: 'sc-mp4',
      title: 'Video Testimonio',
      type: 'video',
      order: 1,
      style: {},
      content: {
        media: {
          filePath: 'C:/Videos/testimonio.mp4',
          fileName: 'testimonio.mp4',
          mediaType: 'video',
          duration: 240,
        },
      },
    };

    presentationStore.setPreviewScene(videoMp4);

    // REGLA CRÍTICA: MP3 continúa en LIVE inalterado
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('sc-mp3');
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('C:/Audio/adoracion.mp3');
    expect(presentationStore.getSnapshot().mediaPlayback.isPlaying).toBe(true);

    // 3. TAKE / PRESENTAR
    presentationStore.presentPreview();

    const postTake = presentationStore.getSnapshot();
    // Video toma el control en LIVE
    expect(postTake.liveScene?.id).toBe('sc-mp4');
    expect(postTake.currentAudioSource).toBe('video');
    expect(postTake.mediaPlayback.activeMediaId).toBe('C:/Videos/testimonio.mp4');
    expect(postTake.mediaPlayback.currentTime).toBe(0);
    expect(postTake.mediaPlayback.isPlaying).toBe(true);
    // mediaLoadId incrementó para descartar eventos del MP3 anterior
    expect(postTake.mediaLoadId).toBeGreaterThan(initialLoadId);
  });

  // TEST — ESCENARIO 6, 7 & 8: IMAGEN / BIBLIA / BLACK + MP3 CONTINÚA
  it('TEST 6, 7 & 8: MP3 de fondo continúa ininterrumpidamente al cambiar entre Imagen, Biblia y Blackout', () => {
    // 1. Iniciar con Canción/Audio
    const songMp3: Scene = {
      id: 'sc-bgm',
      title: 'Fondo Ambiental',
      type: 'song',
      order: 0,
      style: {},
      content: {
        song: { title: 'Ambiente', slides: [''], activeSlideIndex: 0, mediaPath: 'ambient.mp3' },
        media: { filePath: 'ambient.mp3', fileName: 'ambient.mp3', mediaType: 'audio', duration: 180 },
      },
    };
    presentationStore.presentSceneDirectly(songMp3);
    presentationStore.updateMediaProgress(30, 180);

    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.currentTime).toBe(30);

    // 2. Cambiar a Imagen
    const imageScene: Scene = {
      id: 'sc-img',
      title: 'Fondo Bienvenida',
      type: 'image',
      order: 1,
      style: {},
      content: { media: { filePath: 'bienvenida.jpg', fileName: 'bienvenida.jpg', mediaType: 'image' } },
    };
    presentationStore.setPreviewScene(imageScene);
    presentationStore.presentPreview();

    // El visual es la imagen pero el audio de fondo permanece activo
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('sc-img');
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('ambient.mp3');

    // 3. Cambiar a Versículo Bíblico
    const bibleScene: Scene = {
      id: 'sc-bible-verse',
      title: 'Lucas 1:5',
      type: 'bible',
      order: 2,
      style: {},
      content: { bible: { version: 'RVR1960', book: 'Lucas', chapter: 1, verse: 5, reference: 'Lucas 1:5', text: 'Hubo en los días de Herodes...' } },
    };
    presentationStore.setPreviewScene(bibleScene);
    presentationStore.presentPreview();

    // El visual es la biblia y el audio continúa
    expect(presentationStore.getSnapshot().liveScene?.id).toBe('sc-bible-verse');
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('ambient.mp3');

    // 4. Corte a negro (Blackout)
    presentationStore.toggleBlackout();
    expect(presentationStore.getSnapshot().isBlackout).toBe(true);
    // El audio de fondo NO se corta en Blackout
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('ambient.mp3');
  });

  // TEST — PERSISTENCIA DE BIBLIA EN DISCO / RELOAD
  it('Biblia: Las versiones importadas persisten y se recuperan tras reiniciar (init)', async () => {
    const customBibleJson = JSON.stringify({
      name: 'Reina-Valera 1960 Autorizada',
      copyright: 'Sociedades Bíblicas',
      verses: {
        'Salmos 1:1': 'Bienaventurado el varón que no anduvo en consejo de malos...',
        'Salmos 1:2': 'Sino que en la ley de Jehová está su delicia...',
      },
    });

    await bibleStore.importBibleJsonString(customBibleJson);

    // Confirmar que está activa
    expect(bibleStore.getSnapshot().isCustomVersion).toBe(true);
    expect(bibleStore.getSnapshot().currentVersion.name).toBe('Reina-Valera 1960 Autorizada');

    // Simular cierre y apertura de la aplicación mediante init()
    await bibleStore.init();

    // Confirmar que la versión sigue disponible tras recargar
    expect(Object.keys(bibleStore.getSnapshot().customVersions).length).toBeGreaterThan(0);
    const hasImported = Object.values(bibleStore.getSnapshot().customVersions).some(
      (v) => v.name === 'Reina-Valera 1960 Autorizada'
    );
    expect(hasImported).toBe(true);
  });

  // TEST — RESOLUCIÓN DE MEDIOS LOCALES (WINDOWS PATHS, EXTENSIONES, ESPACIOS)
  it('IMÁGENES LOCALES: resolveMediaUrl normaliza y resuelve rutas Windows con espacios y caracteres especiales', () => {
    // 1. Ruta Windows clásica con contrabarras
    const winPath1 = 'C:\\Users\\Pastor\\Pictures\\23.jpeg';
    const resolved1 = resolveMediaUrl(winPath1);
    expect(resolved1).toBe('C:/Users/Pastor/Pictures/23.jpeg');

    // 2. Ruta con espacios y carpetas profundas
    const winPath2 = 'C:\\Iglesia Central\\Multimedia 2026\\Campamento Jóvenes\\Fondo Principal.png';
    const resolved2 = resolveMediaUrl(winPath2);
    expect(resolved2).toBe('C:/Iglesia Central/Multimedia 2026/Campamento Jóvenes/Fondo Principal.png');

    // 3. Extensiones soportadas
    const formats = ['banner.jpg', 'foto.jpeg', 'logo.png', 'fondo.webp', 'grafica.bmp'];
    formats.forEach((f) => {
      const p = `D:\\Recursos\\${f}`;
      expect(resolveMediaUrl(p)).toBe(`D:/Recursos/${f}`);
    });

    // 4. Cadenas vacías o inválidas
    expect(resolveMediaUrl('')).toBe('');
    expect(resolveMediaUrl('   ')).toBe('');

    // 5. Preservar URLs remotas o data:
    expect(resolveMediaUrl('https://example.com/foto.jpg')).toBe('https://example.com/foto.jpg');
    expect(resolveMediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  // TEST — SISTEMA DE ANUNCIOS PERSONALIZADOS (CREACIÓN, PERSISTENCIA, CAPAS)
  it('ANUNCIOS: Crear, agregar capas de texto/logo, persistir y recargar tras reinicio', async () => {
    // 1. Crear nuevo anuncio
    announcementStore.openEditorForNew();
    expect(announcementStore.getSnapshot().isEditorOpen).toBe(true);
    expect(announcementStore.getSnapshot().activeAnnouncement).not.toBeNull();

    // 2. Configurar fondo local
    announcementStore.setBackgroundImage('C:\\Fondos\\culto_noche.jpg');
    expect(announcementStore.getSnapshot().activeAnnouncement?.background?.type).toBe('image');
    expect(announcementStore.getSnapshot().activeAnnouncement?.background?.filePath).toBe('C:\\Fondos\\culto_noche.jpg');

    // 3. Modificar texto y agregar logo
    announcementStore.updateActiveName('Culto Especial de Milagros');
    announcementStore.addTextLayer();
    announcementStore.addImageLayer('C:\\Logos\\iglesia_logo.png', 'iglesia_logo.png');

    const layers = announcementStore.getSnapshot().activeAnnouncement?.layers || [];
    expect(layers.length).toBeGreaterThanOrEqual(3);
    const hasImageLayer = layers.some((l) => l.type === 'image');
    expect(hasImageLayer).toBe(true);

    // 4. Guardar
    await announcementStore.saveCurrentAnnouncement();
    announcementStore.closeEditor();
    expect(announcementStore.getSnapshot().isEditorOpen).toBe(false);

    // 5. Simular reinicio y recarga desde disco
    await announcementStore.init();
    const savedList = announcementStore.getSnapshot().announcements;
    const found = savedList.find((a) => a.name === 'Culto Especial de Milagros');
    expect(found).toBeDefined();
    expect(found?.background?.filePath).toBe('C:\\Fondos\\culto_noche.jpg');
  });

  // TEST — ANUNCIO EN PREVIEW -> TAKE -> LIVE + AUDIO INDEPENDIENTE
  it('ANUNCIO + AUDIO: Un anuncio proyectado en LIVE convive con el MP3 de fondo sin interrumpirlo', () => {
    // 1. Iniciar audio de fondo en LIVE
    const songMp3: Scene = {
      id: 'sc-bgm-ann',
      title: 'Musica Instrumental',
      type: 'song',
      order: 0,
      style: {},
      content: {
        song: { title: 'Instrumental', slides: [''], activeSlideIndex: 0, mediaPath: 'Instrumental.mp3' },
        media: { filePath: 'C:/Musica/Instrumental.mp3', fileName: 'Instrumental.mp3', mediaType: 'audio', duration: 240 },
      },
    };
    presentationStore.presentSceneDirectly(songMp3);
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('Instrumental.mp3');

    // 2. Crear anuncio
    const announcement: Announcement = {
      id: 'ann-live-test',
      name: 'Vigilia de Oración',
      background: { type: 'color', color: '#090A0E' },
      layers: [
        {
          id: 't-1',
          type: 'text',
          text: 'GRAN VIGILIA DE ORACIÓN',
          x: 50,
          y: 45,
          fontSize: 50,
          fontWeight: 'black',
          color: '#FFFFFF',
          alignment: 'center',
        },
      ],
    };

    // 3. Cargar anuncio en PREVIEW
    announcementStore.sendToPreview(announcement);
    expect(presentationStore.getSnapshot().previewScene?.type).toBe('announcement');
    expect(presentationStore.getSnapshot().previewScene?.title).toBe('Vigilia de Oración');

    // Confirmar que el audio sigue sonando
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('Instrumental.mp3');

    // 4. Disparar TAKE / PRESENTAR a LIVE
    presentationStore.presentPreview();

    // Confirmar que el anuncio ahora está en LIVE
    expect(presentationStore.getSnapshot().liveScene?.type).toBe('announcement');
    expect(presentationStore.getSnapshot().liveScene?.title).toBe('Vigilia de Oración');
    expect(presentationStore.getSnapshot().liveScene?.content.announcement?.announcement?.name).toBe('Vigilia de Oración');

    // REGLA CRÍTICA: El audio de fondo NO se corta
    expect(presentationStore.getSnapshot().currentAudioSource).toBe('background');
    expect(presentationStore.getSnapshot().mediaPlayback.activeMediaId).toBe('Instrumental.mp3');
  });

  // TEST — REEMPLAZO ATÓMICO ENTRE ANUNCIOS
  it('ANUNCIOS: Cambio de Anuncio A a Anuncio B reemplaza el visual atómicamente', () => {
    const annA: Announcement = {
      id: 'ann-a',
      name: 'Anuncio A',
      layers: [{ id: '1', type: 'text', text: 'A', x: 50, y: 50, fontSize: 40, fontWeight: 'bold', color: '#FFF', alignment: 'center' }],
    };
    const annB: Announcement = {
      id: 'ann-b',
      name: 'Anuncio B',
      layers: [{ id: '2', type: 'text', text: 'B', x: 50, y: 50, fontSize: 40, fontWeight: 'bold', color: '#FFF', alignment: 'center' }],
    };

    announcementStore.sendToPreview(annA);
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.title).toBe('Anuncio A');

    announcementStore.sendToPreview(annB);
    expect(presentationStore.getSnapshot().liveScene?.title).toBe('Anuncio A'); // LIVE inalterado
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.title).toBe('Anuncio B'); // Reemplazo atómico
  });

  // TEST — CARGA NATIVA DE IMÁGENES Y GESTIÓN DE MEMORIA / CACHÉ
  it('NATIVE MEDIA LOADER: loadMediaBlobUrl y ciclo de vida de caché con revocación', async () => {
    expect(await loadMediaBlobUrl('')).toBe('');
    expect(await loadMediaBlobUrl('   ')).toBe('');

    // Remote / Data URLs pasan sin alteración
    expect(await loadMediaBlobUrl('https://images.unsplash.com/photo.jpg')).toBe('https://images.unsplash.com/photo.jpg');
    expect(await loadMediaBlobUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');

    // En entorno no-Tauri, fallback elegante a ruta normalizada
    const testPath = 'C:\\Users\\Pastor\\Downloads\\23.jpeg';
    const loaded = await loadMediaBlobUrl(testPath);
    expect(loaded).toBe('C:/Users/Pastor/Downloads/23.jpeg');

    // Limpieza de caché no arroja excepciones
    expect(() => clearMediaBlobCache()).not.toThrow();
  });

  // TEST — MOTOR BÍBLICO ROBUSTO, NORMALIZACIÓN Y FORMATO .BI
  it('BIBLE ENGINE: Parseo de referencias con acentos, prefijos, rangos y formato .bi', () => {
    // 1. Parseo con acentos y variaciones
    const ref1 = parseBibleReference('Salmos 8:2');
    expect(ref1).not.toBeNull();
    expect(ref1?.book.name).toBe('Salmos');
    expect(ref1?.chapter).toBe(8);
    expect(ref1?.verse).toBe(2);

    const ref2 = parseBibleReference('salmos 8 2');
    expect(ref2).not.toBeNull();
    expect(ref2?.book.name).toBe('Salmos');
    expect(ref2?.chapter).toBe(8);
    expect(ref2?.verse).toBe(2);

    const ref3 = parseBibleReference('Génesis 1:1');
    expect(ref3).not.toBeNull();
    expect(ref3?.book.name).toBe('Génesis');

    const ref4 = parseBibleReference('San Mateo 5:3');
    expect(ref4).not.toBeNull();
    expect(ref4?.book.name).toBe('Mateo');

    const ref5 = parseBibleReference('1 Juan 1:9');
    expect(ref5).not.toBeNull();
    expect(ref5?.book.name).toBe('1 Juan');

    const ref6 = parseBibleReference('Juan 3:16-18');
    expect(ref6).not.toBeNull();
    expect(ref6?.book.name).toBe('Juan');
    expect(ref6?.chapter).toBe(3);
    expect(ref6?.verse).toBe(16);

    // 2. Parser de formato .bi nativo (BookNum|Chapter|Verse|Text)
    const biSample = [
      '19|8|1|¡Oh Jehová, Señor nuestro, Cuán glorioso es tu nombre en toda la tierra!',
      '19|8|2|De la boca de los niños y de los que maman, fundaste la fortaleza, A causa de tus enemigos, Para hacer callar al enemigo y al vengativo.',
      '43|3|16|Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    ].join('\n');

    const parsedBi = parseBibleBiText(biSample, 'Reina Valera 1960');
    expect(parsedBi.versionName).toBe('Reina Valera 1960');
    expect(parsedBi.verses['Salmos 8:2']).toBe(
      'De la boca de los niños y de los que maman, fundaste la fortaleza, A causa de tus enemigos, Para hacer callar al enemigo y al vengativo.'
    );
    expect(parsedBi.verses['Juan 3:16']).toContain('Porque de tal manera amó Dios al mundo');

    // 3. Resolución auténtica con versículos de traducción importada
    const text = getAuthenticVerseText('Salmos', 8, 2, parsedBi.verses);
    expect(text).toBe(
      'De la boca de los niños y de los que maman, fundaste la fortaleza, A causa de tus enemigos, Para hacer callar al enemigo y al vengativo.'
    );

    // 4. Conteo dinámico de versículos por capítulo
    const count = getChapterVerseCount('Salmos', 8, parsedBi.verses);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // TEST — MOTOR BÍBLICO DE OPERACIÓN RÁPIDA (BOTONES, CONTEO CANÓNICO Y VALIDACIÓN)
  it('BIBLE RAPID ENGINE: Botones dinámicos, conteo canónico exacto y validación de referencias', () => {
    // 1. Conteo canónico exacto para libros sin depender de placeholders globales
    expect(getChapterVerseCount('Salmos', 23)).toBe(6);
    expect(getChapterVerseCount('Salmos', 119)).toBe(176);
    expect(getChapterVerseCount('Juan', 3)).toBe(36);
    expect(getChapterVerseCount('Judas', 1)).toBe(25);
    expect(getChapterVerseCount('Mateo', 28)).toBe(20);

    // 2. Generación dinámica de etiquetas y botones de versiones
    const labelsRVR = getVersionButtonLabels('RVR1960', 'Reina Valera 1960');
    expect(labelsRVR.label).toBe('RVR1960');
    expect(labelsRVR.subLabel).toBe('RVR60');

    const labelsCustom = getVersionButtonLabels('custom-btx', 'Biblia Textual IV');
    expect(labelsCustom.label).toBeTruthy();
    expect(labelsCustom.subLabel).toBeTruthy();

    const allVers = bibleStore.getAllVersions();
    expect(allVers.length).toBeGreaterThan(0);
    expect(allVers.some((v) => v.id.includes('RVA1909') || v.id.includes('1960') || v.id.includes('SEVA'))).toBe(true);

    // 3. Cambio de versión mantiene o ajusta libro/capítulo/versículo válidos
    bibleStore.searchReference('Salmos 23:1');
    const snapshot1 = bibleStore.getSnapshot();
    expect(snapshot1.selectedBook.name).toBe('Salmos');
    expect(snapshot1.selectedChapter).toBe(23);
    expect(snapshot1.selectedVerse).toBe(1);

    // 4. Validación de versículos: si se introduce número mayor al existente, genera advertencia y no altera referencia inválida
    bibleStore.setVerse(999);
    expect(bibleStore.getSnapshot().searchError).toContain('versículos');
    expect(bibleStore.getSnapshot().selectedVerse).toBe(1); // Mantiene versículo válido

    // 5. Ajuste automático al cambiar a un libro con menos capítulos (ej. Judas tiene 1 capítulo)
    bibleStore.setBook('JUD');
    expect(bibleStore.getSnapshot().selectedBook.name).toBe('Judas');
    expect(bibleStore.getSnapshot().selectedChapter).toBe(1); // 23 ajustado a 1
  });

  // TEST — IMPORTACIÓN DE PDF A CUES Y AUSENCIA DE LÍMITES EN ESCENAS
  it('PDF & CUES: Permite importar múltiples páginas como escenas sin límites de cantidad', () => {
    // 1. Limpiar e inicializar nuevo proyecto
    churchStore.newProject();
    const initialCount = churchStore.getSnapshot().currentProject.scenes.length;

    // 2. Simular importación de un PDF de canciones de 35 páginas
    const totalPages = 35;
    const songName = 'Cuan Grande es El';
    const fakeScenes: Array<Partial<Scene> & { title: string; type: SceneType }> = [];

    for (let p = 1; p <= totalPages; p++) {
      fakeScenes.push({
        title: `${songName} — Pág. ${p}/${totalPages}`,
        type: 'image',
        groupId: 'grp-alabanza',
        style: {
          backgroundColor: '#000000',
          transition: 'fade',
        },
        content: {
          media: {
            filePath: `C:/Users/Shalim/AppData/Roaming/SHALIM_TECHNOLOGIES/NEXA_Church/pdf_pages/cuan_grande_es_el/page_${String(p).padStart(3, '0')}.jpg`,
            fileName: `${songName}_pag_${p}.jpg`,
            mediaType: 'image',
          },
        },
      });
    }

    const added = churchStore.addScenes(fakeScenes);
    expect(added.length).toBe(35);

    const projectScenes = churchStore.getSnapshot().currentProject.scenes;
    // Se sumaron exactamente las 35 páginas sin truncar ni restringir
    expect(projectScenes.length).toBe(initialCount + 35);

    // 3. Verificar orden secuencial estricto y títulos
    const firstPdfScene = projectScenes[initialCount];
    const lastPdfScene = projectScenes[initialCount + 34];

    expect(firstPdfScene.title).toBe('Cuan Grande es El — Pág. 1/35');
    expect(firstPdfScene.type).toBe('image');
    expect(firstPdfScene.content.media?.mediaType).toBe('image');
    expect(firstPdfScene.content.media?.filePath).toContain('page_001.jpg');

    expect(lastPdfScene.title).toBe('Cuan Grande es El — Pág. 35/35');
    expect(lastPdfScene.order).toBe(firstPdfScene.order + 34);

    // 4. La primera página se carga automáticamente en PREVIEW
    expect(presentationStore.getSnapshot().previewScene?.id).toBe(firstPdfScene.id);

    // 5. Presentar a LIVE y verificar paso de página
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(firstPdfScene.id);

    // Seleccionar y cargar la siguiente página (Pág. 2)
    const secondPdfScene = projectScenes[initialCount + 1];
    churchStore.setActiveSceneId(secondPdfScene.id);
    expect(presentationStore.getSnapshot().previewScene?.id).toBe(secondPdfScene.id);
    // LIVE continúa mostrando la Pág. 1 hasta hacer TAKE
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(firstPdfScene.id);

    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(secondPdfScene.id);
  });

  // TEST — FONDO DE IMAGEN PERSONALIZADO EN VISUALIZADOR DE VERSÍCULOS
  it('BIBLE SCENE: Integra imagen de fondo personalizada directamente en la escena bíblica', () => {
    // 1. Configurar versículo en bibleStore
    bibleStore.searchReference('Salmos 23:1');
    expect(bibleStore.getSnapshot().activeVerseText).toBeTruthy();

    // 2. Asignar imagen de fondo personalizada
    const customBg = 'C:/Users/Pastor/Pictures/Fondo_Cruz_Atardecer.jpg';
    bibleStore.setBackgroundImage(customBg);
    expect(bibleStore.getSnapshot().backgroundImageUrl).toBe(customBg);

    // 3. Generar escena bíblica
    const bibleScene = bibleStore.createBibleScene();
    expect(bibleScene).not.toBeNull();
    expect(bibleScene?.type).toBe('bible');
    expect(bibleScene?.title).toBe('Salmos 23:1');

    // Verificar que la escena integra tanto el versículo como el fondo de imagen en una sola escena
    expect(bibleScene?.content.bible?.reference).toBe('Salmos 23:1');
    expect(bibleScene?.content.bible?.text).toContain('pastor');
    expect(bibleScene?.style.backgroundImageUrl).toBe(customBg);
    expect(bibleScene?.style.textShadow).toBe(true);

    // 4. Cargar en PREVIEW y presentar a LIVE
    bibleStore.sendToPreview();
    expect(presentationStore.getSnapshot().previewScene?.content.bible?.reference).toBe('Salmos 23:1');
    expect(presentationStore.getSnapshot().previewScene?.style.backgroundImageUrl).toBe(customBg);

    presentationStore.presentPreview();
    const live = presentationStore.getSnapshot().liveScene;
    expect(live?.type).toBe('bible');
    expect(live?.content.bible?.reference).toBe('Salmos 23:1');
    expect(live?.style.backgroundImageUrl).toBe(customBg);

    // 5. Agregar a Cues del proyecto
    bibleStore.addToProject();
    const projectScenes = churchStore.getSnapshot().currentProject.scenes;
    const addedScene = projectScenes[projectScenes.length - 1];
    expect(addedScene.title).toBe('Salmos 23:1');
    expect(addedScene.style.backgroundImageUrl).toBe(customBg);

    // 6. Quitar fondo de imagen restaura predeterminado
    bibleStore.clearBackgroundImage();
    expect(bibleStore.getSnapshot().backgroundImageUrl).toBeNull();
    const defaultScene = bibleStore.createBibleScene();
    expect(defaultScene?.style.backgroundImageUrl).toBeUndefined();
  });

  // TEST — GESTIÓN DINÁMICA DE EVENTOS (CULTO, CONGRESO, CONFERENCIA, ETC.)
  it('EVENTOS: Permite cambiar tipo de evento, nombre y fecha dinámicamente sin nombres estáticos', () => {
    // 1. Comprobar generador de nombre por defecto para diferentes tipos
    const today = getFormattedToday();
    expect(generateDefaultEventName('culto')).toBe(`CULTO — ${today}`);
    expect(generateDefaultEventName('congreso')).toBe(`CONGRESO — ${today}`);
    expect(generateDefaultEventName('conferencia')).toBe(`CONFERENCIA — ${today}`);
    expect(generateDefaultEventName('especial')).toBe(`EVENTO ESPECIAL — ${today}`);

    // 2. Personalizar detalles del proyecto en churchStore
    churchStore.setProjectDetails({
      name: 'CONGRESO INTERNACIONAL DE JÓVENES 2026',
      eventType: 'congreso',
      date: '2026-11-15',
    });

    const project = churchStore.getSnapshot().currentProject;
    expect(project.name).toBe('CONGRESO INTERNACIONAL DE JÓVENES 2026');
    expect(project.eventType).toBe('congreso');
    expect(project.date).toBe('2026-11-15');

    // 3. Crear nuevo proyecto seleccionando tipo Conferencia
    churchStore.newProject('conferencia');
    const newProj = churchStore.getSnapshot().currentProject;
    expect(newProj.name).toBe(`CONFERENCIA — ${today}`);
    expect(newProj.eventType).toBe('conferencia');
  });

  // TEST — ESTADOS FIDEDIGNOS DE TRANSMISIÓN / PROYECTOR (NUNCA EN FALSO ROJO)
  it('TALLY LOGIC: Distingue con precisión entre Standby, Local Only, En el Aire y Blackout', () => {
    // 1. Estado inicial: Sin escena en vivo -> STANDBY (Inactivo, no debe ser rojo)
    expect(presentationStore.getSnapshot().liveScene).toBeNull();
    expect(presentationStore.getSnapshot().presentationWindowOpen).toBe(false);
    expect(presentationStore.getSnapshot().isBlackout).toBe(false);

    // 2. Cargar escena y presentar SIN tener ventana de proyector abierta -> LOCAL ONLY
    const scene: Scene = {
      id: 'sc-tally',
      title: 'Título de Prueba',
      type: 'title',
      order: 0,
      style: {},
      content: { title: { title: 'Bienvenidos', subtitle: 'Congreso 2026' } },
    };
    presentationStore.setPreviewScene(scene);
    presentationStore.presentPreview();

    const snapshotLocal = presentationStore.getSnapshot();
    const isLiveActive = snapshotLocal.liveScene !== null;
    const isProjectorOpen = snapshotLocal.presentationWindowOpen;
    const isBlackout = snapshotLocal.isBlackout;

    // Está preparado en monitor local pero NO en el aire al proyector
    expect(isLiveActive).toBe(true);
    expect(isProjectorOpen).toBe(false);
    expect(isBlackout).toBe(false);
    const isReallyOnAirLocal = isLiveActive && !isBlackout && isProjectorOpen;
    const isLocalOnly = isLiveActive && !isBlackout && !isProjectorOpen;
    expect(isReallyOnAirLocal).toBe(false); // NO ESTÁ EN EL AIRE
    expect(isLocalOnly).toBe(true);         // LOCAL ONLY

    // 3. Simular apertura del proyector -> VERDADERO EN EL AIRE
    presentationStore.openPresentationForTesting();
    const snapshotOnAir = presentationStore.getSnapshot();
    const isReallyOnAir = snapshotOnAir.liveScene !== null && !snapshotOnAir.isBlackout && snapshotOnAir.presentationWindowOpen;
    expect(isReallyOnAir).toBe(true);

    // 4. Activar Blackout -> BLACKOUT (no en el aire normal)
    presentationStore.toggleBlackout();
    const snapshotBlack = presentationStore.getSnapshot();
    expect(snapshotBlack.isBlackout).toBe(true);
    const isReallyOnAirBlack = snapshotBlack.liveScene !== null && !snapshotBlack.isBlackout && snapshotBlack.presentationWindowOpen;
    expect(isReallyOnAirBlack).toBe(false);
  });

  // TEST — ESCALADO INTELIGENTE DE VERSÍCULOS Y TAMAÑO DE REFERENCIA
  it('BIBLE TYPOGRAPHY: Auto-escala versículos largos sin cortes y mantiene la referencia del mismo tamaño', () => {
    const shortVerse = 'Jesús lloró.'; // 12 chars
    const mediumVerse = 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'; // 147 chars
    const longVerse = 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir, ni lo alto, ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.'; // 267 chars

    const shortSizes = getBibleDynamicFontSizes(shortVerse, 46, false);
    const mediumSizes = getBibleDynamicFontSizes(mediumVerse, 46, false);
    const longSizes = getBibleDynamicFontSizes(longVerse, 46, false);

    // 1. La referencia tiene una escala legible y armónica respecto al contenido
    expect(shortSizes.reference).toBeGreaterThan(30);
    expect(shortSizes.reference).toBeLessThanOrEqual(shortSizes.content);
    expect(mediumSizes.reference).toBeGreaterThan(25);
    expect(longSizes.reference).toBeGreaterThan(20);

    // 2. Versículos más largos reducen progresivamente su escala para no salirse de la pantalla
    expect(shortSizes.content).toBeGreaterThan(mediumSizes.content);
    expect(mediumSizes.content).toBeGreaterThan(longSizes.content);

    // 3. Proporcionalidad idéntica en monitores de Preview y Live (isMonitor = true)
    const monitorSizes = getBibleDynamicFontSizes(longVerse, 46, true);
    expect(monitorSizes.reference).toBeLessThanOrEqual(monitorSizes.content);
    expect(monitorSizes.content).toBeLessThan(longSizes.content);
    expect(monitorSizes.content).toBeGreaterThanOrEqual(10);
  });

  // TEST — SOPORTE DE GIF MULTIMEDIA (BUCLE INFINITO / VIDEOS DE MOVIMIENTO FIJO)
  it('MULTIMEDIA: Soporta reproducción de GIFs en bucle infinito como fondo o escena', () => {
    const gifMedia = {
      id: 'c:/multimedia/cruz_animada.gif',
      name: 'Cruz_Animada.gif',
      path: 'C:/Multimedia/Cruz_Animada.gif',
      extension: 'gif',
      size: 3500000,
      media_type: 'image' as const,
    };

    // 1. Crear escena a partir de un GIF
    const scene = mediaStore.createMediaScene(gifMedia);
    expect(scene.type).toBe('image');
    expect(scene.content.media?.filePath).toBe('C:/Multimedia/Cruz_Animada.gif');
    expect(scene.content.media?.mediaType).toBe('image');
    // Debe marcar loop: true para movimiento continuo sin límite de tiempo
    expect(scene.content.media?.loop).toBe(true);

    // 2. Enviar GIF a Preview y Live
    presentationStore.setPreviewScene(scene);
    expect(presentationStore.getSnapshot().previewScene?.content.media?.filePath).toBe('C:/Multimedia/Cruz_Animada.gif');

    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.content.media?.filePath).toBe('C:/Multimedia/Cruz_Animada.gif');
    expect(presentationStore.getSnapshot().liveScene?.content.media?.loop).toBe(true);

    // 3. Filtrado por tipo 'gif'
    mediaStore.setFilterType('gif');
    expect(mediaStore.getSnapshot().filterType).toBe('gif');
    mediaStore.setFilterType('all');
    expect(mediaStore.getSnapshot().filterType).toBe('all');
  });

  // TEST — ESCALADO PROPORCIONAL MULTI-PANTALLA (CQW)
  it('MULTI-DISPLAY: getBibleDynamicFontSizes genera unidades cqw idénticas para Laptop y Video Beam', () => {
    const verseText = 'Porque de tal manera amó Dios al mundo...';
    const sizes = getBibleDynamicFontSizes(verseText, 46, false);
    expect(sizes.fontSizeCqw).toBeDefined();
    expect(sizes.fontSizeCqw).toMatch(/^[0-9.]+cqw$/);
  });

  // TEST — PERSISTENCIA, CONTROL DE CAMBIOS PENDIENTES (isDirty) Y PROMPT DE SALIDA
  it('PERSISTENCE: churchStore rastrea cambios pendientes (isDirty) y gestiona aviso de salida', () => {
    churchStore.newProject('congreso');
    expect(churchStore.getSnapshot().isDirty).toBe(false);
    expect(churchStore.getSnapshot().showExitPrompt).toBe(false);

    // 1. Modificar nombre del evento marca isDirty en true
    churchStore.setProjectName('EL SONIDO DEL DESPERTAR 2026');
    expect(churchStore.getSnapshot().currentProject.name).toBe('EL SONIDO DEL DESPERTAR 2026');
    expect(churchStore.getSnapshot().isDirty).toBe(true);

    // 2. Gestionar aviso de guardado antes de salir
    churchStore.setShowExitPrompt(true);
    expect(churchStore.getSnapshot().showExitPrompt).toBe(true);
    churchStore.setShowExitPrompt(false);
    expect(churchStore.getSnapshot().showExitPrompt).toBe(false);

    // 3. Crear nuevo proyecto resetea isDirty a false
    churchStore.newProject('culto');
    expect(churchStore.getSnapshot().isDirty).toBe(false);
  });

  // TEST — TIPOGRAFÍAS PERSONALIZADAS EN CAPAS DE ANUNCIOS
  it('ANNOUNCEMENTS: Soporta selección y actualización de tipos de letra (fontFamily)', () => {
    announcementStore.newAnnouncement('Anuncio Congreso');
    const ann = announcementStore.getSnapshot().activeAnnouncement;
    expect(ann).toBeDefined();

    announcementStore.addTextLayer();
    const updated = announcementStore.getSnapshot().activeAnnouncement;
    const textLayer = updated?.layers.find((l) => l.type === 'text');
    expect(textLayer).toBeDefined();

    if (textLayer) {
      announcementStore.updateTextLayer(textLayer.id, {
        fontFamily: "'Montserrat', sans-serif",
      });
      const finalAnn = announcementStore.getSnapshot().activeAnnouncement;
      const finalTextLayer = finalAnn?.layers.find((l) => l.id === textLayer.id) as any;
      expect(finalTextLayer?.fontFamily).toBe("'Montserrat', sans-serif");
    }
  });

  // TEST — WORSHIP ENGINE & SONG LIBRARY (v1.4.0)
  it('SONG LIBRARY: Inicializa con cancionero preinstalado en español y búsqueda funcional', async () => {
    await songStore.init();
    const songs = songStore.getSnapshot().songs;
    expect(songs.length).toBeGreaterThanOrEqual(PRESET_WORSHIP_SONGS.length);

    // Buscar "Cuán Grande es Dios"
    const cg = songs.find((s) => s.title.includes('Cuán Grande es Dios'));
    expect(cg).toBeDefined();
    expect(cg?.originalKey).toBe('G');
    expect(cg?.tempo).toBe(78);
    expect(cg?.sections.length).toBeGreaterThan(0);
  });

  it('SONG CUES: Permite incorporar canciones completas como Cues organizados por sección en el proyecto', () => {
    churchStore.newProject('culto');
    const initialCueCount = churchStore.getSnapshot().currentProject.scenes.length;

    const testSong = PRESET_WORSHIP_SONGS[0]; // Cuán Grande es Dios
    const addedCues = songStore.addSongToProject(testSong);

    expect(addedCues).toBeDefined();
    expect(addedCues!.length).toBeGreaterThan(0);

    const projectScenes = churchStore.getSnapshot().currentProject.scenes;
    expect(projectScenes.length).toBe(initialCueCount + addedCues!.length);

    // Cada Cue de canción debe tener formato semántico [Sección] Título
    const firstSongCue = addedCues![0];
    expect(firstSongCue.type).toBe('song');
    expect(firstSongCue.content.song?.title).toBe(testSong.title);
    expect(firstSongCue.content.song?.songId).toBe(testSong.id);
  });

  it('SONG PREVIEW & LIVE: Vista previa directa y emisión a Live sin alterar el resto de cues', () => {
    const testSong = PRESET_WORSHIP_SONGS[1]; // Grande es Tu Fidelidad
    songStore.previewSong(testSong);

    const preview = presentationStore.getSnapshot().previewScene;
    expect(preview).toBeDefined();
    expect(preview?.type).toBe('song');
    expect(preview?.content.song?.title).toBe(testSong.title);

    // Emisión a Live directa
    songStore.presentSongLive(testSong);
    const live = presentationStore.getSnapshot().liveScene;
    expect(live).toBeDefined();
    expect(live?.type).toBe('song');
    expect(live?.content.song?.title).toBe(testSong.title);
  });

  it('SONG THEME & BACKGROUND: Propaga fondo personalizado y tipografía a los Cues y la presentación', () => {
    churchStore.newProject('culto');
    const customSong = {
      ...PRESET_WORSHIP_SONGS[0],
      theme: {
        backgroundImageUrl: 'C:/Wallpapers/Church_Stage_Backdrop.jpg',
        backgroundColor: '#1E293B',
        fontFamily: "'Poppins', sans-serif",
        fontSize: 48,
        textColor: '#FEF08A',
        textAlign: 'center' as const,
      },
    };

    const addedCues = songStore.addSongToProject(customSong);
    expect(addedCues).toBeDefined();
    expect(addedCues!.length).toBeGreaterThan(0);

    const cue = addedCues![0];
    expect(cue.style.backgroundImageUrl).toBe('C:/Wallpapers/Church_Stage_Backdrop.jpg');
    expect(cue.style.fontFamily).toBe("'Poppins', sans-serif");
    expect(cue.style.textColor).toBe('#FEF08A');
    expect(cue.style.fontSize).toBe(48);

    // Test live presentation with custom theme
    songStore.presentSongLive(customSong);
    const live = presentationStore.getSnapshot().liveScene;
    expect(live?.style.backgroundImageUrl).toBe('C:/Wallpapers/Church_Stage_Backdrop.jpg');
    expect(live?.style.fontFamily).toBe("'Poppins', sans-serif");
  });

  it('SONG TYPOGRAPHY SCALING: Escala dinámicamente con la misma contundencia que los versículos', () => {
    const singleLine = '¡Eres bueno!';
    const fourLines = 'Oh Dios eterno, tu misericordia\nNi una sombra de duda tendrá;\nTu compasión y bondad nunca fallan,\nY por los siglos el mismo serás.';

    const sizesSingle = getSongDynamicFontSizes(singleLine, 46, false);
    const sizesFour = getSongDynamicFontSizes(fourLines, 46, false);

    expect(parseFloat(sizesSingle.fontSizeCqw)).toBeGreaterThan(parseFloat(sizesFour.fontSizeCqw));
    expect(sizesFour.lineHeight).toBeLessThanOrEqual(1.30);
    expect(sizesSingle.fontSizeCqw).toContain('cqw');
  });

  // FASE 2 (v1.5) — RETORNO DE ESCENARIO (STAGE DISPLAY) & PREACHER TIMER
  it('STAGE TIMER: Manejo completo de temporizador de predicación (inicio, pausa, reinicio y minutos)', () => {
    stageStore.resetForTesting();
    expect(stageStore.getSnapshot().timer.isRunning).toBe(false);

    // Ajustar minutos del sermón
    stageStore.setTimerMinutes(40);
    expect(stageStore.getSnapshot().timer.initialMinutes).toBe(40);
    expect(stageStore.getSnapshot().timer.remainingSeconds).toBe(2400);

    // Iniciar cronómetro
    stageStore.startTimer();
    expect(stageStore.getSnapshot().timer.isRunning).toBe(true);

    // Ajustar tiempo al vuelo (+60s)
    stageStore.adjustTimerSeconds(60);
    expect(stageStore.getSnapshot().timer.remainingSeconds).toBe(2460);

    // Pausar cronómetro
    stageStore.pauseTimer();
    expect(stageStore.getSnapshot().timer.isRunning).toBe(false);
    expect(stageStore.getSnapshot().timer.remainingSeconds).toBe(2460);

    // Reiniciar al valor inicial
    stageStore.resetTimer();
    expect(stageStore.getSnapshot().timer.isRunning).toBe(false);
    expect(stageStore.getSnapshot().timer.remainingSeconds).toBe(2400);
  });

  it('STAGE PRIVATE ALERTS: Mensajes privados a tarima sin afectar la proyección de la congregación', () => {
    stageStore.resetForTesting();
    expect(stageStore.getSnapshot().privateMessage.isVisible).toBe(false);

    // Emitir mensaje discreto a la tarima
    stageStore.showPrivateMessage('Vehículo ABC-123 con luces encendidas');
    const stageState = stageStore.getSnapshot();
    expect(stageState.privateMessage.isVisible).toBe(true);
    expect(stageState.privateMessage.text).toBe('Vehículo ABC-123 con luces encendidas');

    // La proyección principal permanece limpia e independiente
    expect(presentationStore.getSnapshot().liveScene).toBeNull();

    // Ocultar mensaje privado
    stageStore.hidePrivateMessage();
    expect(stageStore.getSnapshot().privateMessage.isVisible).toBe(false);
  });

  it('STAGE NEXT SLIDE: Detección precisa de diapositiva actual y siguiente diapositiva en secuencia', () => {
    churchStore.newProject('culto');
    const scenes: Scene[] = [
      {
        id: 'scene-1',
        title: 'Estrofa 1',
        type: 'song',
        order: 0,
        style: {},
        content: { song: { title: 'Tu Fidelidad', sectionLabel: 'Estrofa 1', slides: ['Tu fidelidad es grande...'], activeSlideIndex: 0 } },
      },
      {
        id: 'scene-2',
        title: 'Coro',
        type: 'song',
        order: 1,
        style: {},
        content: { song: { title: 'Tu Fidelidad', sectionLabel: 'Coro', slides: ['Nadie como tú, bendito Dios...'], activeSlideIndex: 0 } },
      },
      {
        id: 'scene-3',
        title: 'Puente',
        type: 'song',
        order: 2,
        style: {},
        content: { song: { title: 'Tu Fidelidad', sectionLabel: 'Puente', slides: ['Grande es tu fidelidad.'], activeSlideIndex: 0 } },
      },
    ];

    const addedScenes = scenes.map(s => churchStore.addScene(s));

    // Presentar la primera diapositiva (Estrofa 1)
    presentationStore.setPreviewScene(addedScenes[0]);
    presentationStore.presentPreview();

    const live = presentationStore.getSnapshot().liveScene;
    expect(live?.id).toBe(addedScenes[0].id);

    // Encontrar el siguiente slide en la lista del proyecto
    const allProjectScenes = churchStore.getSnapshot().currentProject.scenes;
    const currentIndex = allProjectScenes.findIndex(s => s.id === live?.id);
    expect(currentIndex).toBeGreaterThanOrEqual(0);

    const nextScene = currentIndex >= 0 && currentIndex + 1 < allProjectScenes.length
      ? allProjectScenes[currentIndex + 1]
      : null;

    expect(nextScene).not.toBeNull();
    expect(nextScene?.id).toBe(addedScenes[1].id);
    expect(nextScene?.title).toBe('Coro');
  });
});