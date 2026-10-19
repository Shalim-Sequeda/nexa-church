import { describe, it, expect, beforeEach } from 'vitest';
import { presentationStore } from '../src/stores/presentationStore';
import { churchStore } from '../src/stores/churchStore';
import { bibleStore } from '../src/stores/bibleStore';
import { songStore } from '../src/stores/songStore';
import { ChurchSong } from '../src/types/church';

describe('NEXA Church — Holyrics Workflow & Continuous Bible Stepping', () => {
  beforeEach(() => {
    presentationStore.resetForTesting();
    churchStore.newProject();
  });

  it('TEST 1: Salto directo al Coro (C) y Estrofas (1-9) en canciones con diapositivas', () => {
    const testSong: ChurchSong = {
      id: 'song-test-holyrics',
      title: 'Canción Test',
      sections: [
        {
          id: 'sec-v1',
          type: 'verse',
          label: 'Estrofa 1',
          slides: ['Línea 1 estrofa 1', 'Línea 2 estrofa 1'],
        },
        {
          id: 'sec-c',
          type: 'chorus',
          label: 'Coro',
          slides: ['Línea 1 coro', 'Línea 2 coro'],
        },
        {
          id: 'sec-v2',
          type: 'verse',
          label: 'Estrofa 2',
          slides: ['Línea 1 estrofa 2'],
        },
      ],
      arrangements: [
        {
          id: 'arr-test',
          name: 'Estándar',
          sequence: ['sec-v1', 'sec-c', 'sec-v2'],
        },
      ],
      defaultArrangementId: 'arr-test',
    };

    // Presentar canción en vivo
    songStore.presentSongLive(testSong);
    const live = presentationStore.getSnapshot().liveScene;
    expect(live).not.toBeNull();
    expect(live?.type).toBe('song');
    expect(live?.content.song?.activeSlideIndex).toBe(0);

    // 1. Saltar al Coro (tecla C)
    const jumpedChorus = presentationStore.jumpToSongChorus();
    expect(jumpedChorus).toBe(true);
    const currentAfterChorus = presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex;
    // Estrofa 1 tiene 2 diapositivas (índices 0 y 1). Coro comienza en índice 2.
    expect(currentAfterChorus).toBe(2);

    // 2. Saltar a la Estrofa 2 (tecla 2)
    const jumpedV2 = presentationStore.jumpToSongVerse(2);
    expect(jumpedV2).toBe(true);
    const currentAfterV2 = presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex;
    // Coro tiene 2 diapositivas (índices 2 y 3). Estrofa 2 comienza en índice 4.
    expect(currentAfterV2).toBe(4);

    // 3. Saltar a la Estrofa 1 (tecla 1)
    const jumpedV1 = presentationStore.jumpToSongVerse(1);
    expect(jumpedV1).toBe(true);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(0);
  });

  it('TEST 2: Navegación de versículos continua en vivo durante la predicación', () => {
    // Pastor predica Habacuc 1:1 al 1:5
    bibleStore.setBook('HAB');
    bibleStore.setChapter(1);
    bibleStore.setVerse(1);
    bibleStore.presentNow();

    const liveInitial = presentationStore.getSnapshot().liveScene;
    expect(liveInitial?.type).toBe('bible');
    expect(liveInitial?.content.bible?.verse).toBe(1);

    // Pastor lee el versículo 2 -> Operador presiona Flecha Derecha / Abajo
    const next1 = bibleStore.nextVerseLive();
    expect(next1).toBe(true);
    const liveV2 = presentationStore.getSnapshot().liveScene;
    expect(liveV2?.content.bible?.verse).toBe(2);

    // Pastor lee el versículo 3 -> Flecha Derecha / Abajo
    const next2 = bibleStore.nextVerseLive();
    expect(next2).toBe(true);
    const liveV3 = presentationStore.getSnapshot().liveScene;
    expect(liveV3?.content.bible?.verse).toBe(3);

    // Operador retrocede al versículo 2 -> Flecha Izquierda / Arriba
    const prev1 = bibleStore.previousVerseLive();
    expect(prev1).toBe(true);
    const liveBack = presentationStore.getSnapshot().liveScene;
    expect(liveBack?.content.bible?.verse).toBe(2);
  });

  it('TEST 3: Salto a escenas de Coro y Estrofas en lista de Cues', () => {
    // Agregar dos escenas de canción a la lista de cues
    churchStore.addScenes([
      {
        title: 'Canción - Estrofa 1',
        type: 'song',
        content: {
          song: {
            title: 'Canción',
            slides: ['Línea estrofa 1'],
            activeSlideIndex: 0,
            sectionType: 'verse',
            sectionLabel: 'Estrofa 1',
          },
        },
      },
      {
        title: 'Canción - Coro',
        type: 'song',
        content: {
          song: {
            title: 'Canción',
            slides: ['Línea coro'],
            activeSlideIndex: 0,
            sectionType: 'chorus',
            sectionLabel: 'Coro',
          },
        },
      },
    ]);

    // Presentar la primera escena
    const scenes = churchStore.getSnapshot().currentProject.scenes;
    expect(scenes.length).toBe(2);

    presentationStore.presentSceneDirectly(scenes[0]);
    expect(presentationStore.getSnapshot().liveScene?.id).toBe(scenes[0].id);

    // Saltar al coro mediante churchStore.jumpToChorusScene()
    const jumped = churchStore.jumpToChorusScene();
    expect(jumped).toBe(true);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.sectionType).toBe('chorus');
  });

  it('TEST 4: Apartado Exclusivo de Canción: navegación aislada sin interferencia con otros Cues', () => {
    // Escenario crítico del usuario: hay una canción vieja en Cues, pero el operador
    // selecciona una NUEVA canción directamente en el cancionero para operar como en Holyrics.
    churchStore.addScene({
      title: 'Canción 1 Vieja',
      type: 'song',
      content: {
        song: {
          title: 'Canción 1 Vieja',
          slides: ['Slide 1'],
          activeSlideIndex: 0,
          sectionType: 'chorus',
          sectionLabel: 'Coro',
        },
      },
    });

    const song2: ChurchSong = {
      id: 'song-holyrics-exclusiva',
      title: 'Canción Nueva Exclusiva',
      artist: 'Artista Adoración',
      sections: [
        {
          id: 'sec-v1',
          type: 'verse',
          label: 'Estrofa 1',
          slides: ['Verso A de canción 2'],
        },
        {
          id: 'sec-c',
          type: 'chorus',
          label: 'Coro',
          slides: ['Coro glorioso de canción 2'],
        },
      ],
      arrangements: [
        {
          id: 'arr-1',
          name: 'Estándar',
          sequence: ['sec-v1', 'sec-c'],
        },
      ],
      defaultArrangementId: 'arr-1',
    };

    // Operador selecciona la Canción Nueva en el Cancionero
    songStore.selectSong(song2, true);
    expect(songStore.getSnapshot().selectedSongId).toBe(song2.id);

    // Debe haberse cargado automáticamente a Preview
    const preview = presentationStore.getSnapshot().previewScene;
    expect(preview).not.toBeNull();
    expect(preview?.content.song?.songId).toBe(song2.id);
    expect(preview?.content.song?.activeSlideIndex).toBe(0);

    // Operador presiona C para saltar al Coro de ESTA canción
    const chorusJumped = songStore.jumpToSelectedSongChorus();
    expect(chorusJumped).toBe(true);

    // El preview debe haberse actualizado al índice 1 (Coro de la canción 2, NO la canción 1)
    const previewAfterChorus = presentationStore.getSnapshot().previewScene;
    expect(previewAfterChorus?.content.song?.songId).toBe(song2.id);
    expect(previewAfterChorus?.content.song?.activeSlideIndex).toBe(1);

    // Operador presiona ENTER (TAKE oficial)
    presentationStore.presentPreview();
    const liveAfterTake = presentationStore.getSnapshot().liveScene;
    expect(liveAfterTake?.content.song?.songId).toBe(song2.id);
    expect(liveAfterTake?.content.song?.activeSlideIndex).toBe(1);

    // Operador presiona 1 para volver a la Estrofa 1
    const verse1Jumped = songStore.jumpToSelectedSongVerse(1);
    expect(verse1Jumped).toBe(true);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(0);
  });

  it('TEST 5: Cambio de fondos de adoración dinámico en vivo y en preview', () => {
    const songWithBg: ChurchSong = {
      id: 'song-bg-test',
      title: 'Canción con Fondo',
      theme: {
        backgroundColor: '#000000',
        backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
      },
      sections: [
        {
          id: 'sec-1',
          type: 'verse',
          label: 'Estrofa 1',
          slides: ['Diapositiva de prueba'],
        },
      ],
      arrangements: [
        { id: 'arr-1', name: 'Estándar', sequence: ['sec-1'] },
      ],
      defaultArrangementId: 'arr-1',
    };

    // 1. Presentar canción en vivo
    songStore.presentSongLive(songWithBg);
    expect(presentationStore.getSnapshot().liveScene?.style.backgroundImageUrl).toBe(
      '/backgrounds/worship/worship_ambient_blue.jpg'
    );

    // 2. Cargar en preview para edición/preparación
    songStore.previewSong(songWithBg);
    expect(presentationStore.getSnapshot().previewScene?.style.backgroundImageUrl).toBe(
      '/backgrounds/worship/worship_ambient_blue.jpg'
    );

    // 3. Cambiar fondo en el cancionero a uno de los nuevos fondos de adoración
    songStore.setSongBackground('song-bg-test', '/backgrounds/worship/worship_golden_sanctuary.jpg');

    // REGLA SAGRADA DE EMISIÓN:
    // El estilo en PREVIEW se actualiza para inspección del operador
    expect(presentationStore.getSnapshot().previewScene?.style.backgroundImageUrl).toBe(
      '/backgrounds/worship/worship_golden_sanctuary.jpg'
    );

    // LIVE DEBE PERMANECER INMUTABLE (Protección contra saltos accidentales en pantalla al público)
    expect(presentationStore.getSnapshot().liveScene?.style.backgroundImageUrl).toBe(
      '/backgrounds/worship/worship_ambient_blue.jpg'
    );

    // 4. Solo al pulsar TAKE / En Vivo (presentPreview), la nueva configuración pasa a Live
    presentationStore.presentPreview();
    expect(presentationStore.getSnapshot().liveScene?.style.backgroundImageUrl).toBe(
      '/backgrounds/worship/worship_golden_sanctuary.jpg'
    );
  });

  it('TEST 6: Agregar canción a Cues crea un Cue unificado consolidado (asSingleCue: true)', () => {
    const multiSectionSong: ChurchSong = {
      id: 'song-multi-cue',
      title: 'Canción Larga',
      sections: [
        { id: 's1', type: 'verse', label: 'Estrofa 1', slides: ['V1'] },
        { id: 's2', type: 'chorus', label: 'Coro', slides: ['C1'] },
        { id: 's3', type: 'verse', label: 'Estrofa 2', slides: ['V2'] },
        { id: 's4', type: 'bridge', label: 'Puente', slides: ['P1'] },
      ],
      arrangements: [
        { id: 'a1', name: 'Estándar', sequence: ['s1', 's2', 's3', 's4'] },
      ],
      defaultArrangementId: 'a1',
    };

    const initialCueCount = churchStore.getSnapshot().currentProject.scenes.length;

    // Agregar a proyecto sin parámetros extra
    const addedScenes = songStore.addSongToProject(multiSectionSong);
    expect(addedScenes).not.toBeNull();
    // Debe haber retornado exactamente 1 escena consolidada, NO 4 escenas
    expect(addedScenes?.length).toBe(1);

    const newCueCount = churchStore.getSnapshot().currentProject.scenes.length;
    expect(newCueCount).toBe(initialCueCount + 1);

    const consolidatedCue = churchStore.getSnapshot().currentProject.scenes[newCueCount - 1];
    expect(consolidatedCue.title).toBe('Canción: Canción Larga');
    expect(consolidatedCue.content.song?.slides.length).toBe(4);
  });

  it('TEST 7: Navegación cíclica en canción seleccionada (pulsar C o 1 múltiples veces cicla entre diapositivas)', () => {
    const multiSlideSong: ChurchSong = {
      id: 'song-cyclic-test',
      title: 'Canción Cíclica',
      sections: [
        {
          id: 's-v1',
          type: 'verse',
          label: 'Estrofa 1',
          slides: ['V1 Parte 1', 'V1 Parte 2'],
        },
        {
          id: 's-pre',
          type: 'pre-chorus',
          label: 'Pre-Coro',
          slides: ['Pre-coro texto'],
        },
        {
          id: 's-c',
          type: 'chorus',
          label: 'Coro',
          slides: ['Coro Parte 1', 'Coro Parte 2'],
        },
      ],
      arrangements: [
        { id: 'arr-c', name: 'Estándar', sequence: ['s-v1', 's-pre', 's-c'] },
      ],
      defaultArrangementId: 'arr-c',
    };

    songStore.selectSong(multiSlideSong, true);
    songStore.presentSongLive(multiSlideSong);

    // Diapositivas:
    // 0: Estrofa 1 (1/2)
    // 1: Estrofa 1 (2/2)
    // 2: Pre-Coro
    // 3: Coro (1/2)
    // 4: Coro (2/2)

    // 1. Presionar 'C' primera vez -> Va a Coro Parte 1 (índice 3)
    songStore.jumpToSelectedSongChorus();
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(3);

    // 2. Presionar 'C' segunda vez -> Avanza a Coro Parte 2 (índice 4)
    songStore.jumpToSelectedSongChorus();
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(4);

    // 3. Presionar 'C' tercera vez -> Cicla de vuelta a Coro Parte 1 (índice 3)
    songStore.jumpToSelectedSongChorus();
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(3);

    // 4. Presionar 'R' -> Salta a Pre-Coro (índice 2)
    songStore.jumpToSelectedSongPreChorus();
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(2);

    // 5. Presionar '1' -> Salta a Estrofa 1 Parte 1 (índice 0)
    songStore.jumpToSelectedSongVerse(1);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(0);

    // 6. Presionar '1' segunda vez -> Avanza a Estrofa 1 Parte 2 (índice 1)
    songStore.jumpToSelectedSongVerse(1);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(1);
  });

  it('TEST 8: Aislamiento total Live vs Preview: cambiar fondo en Preview o avanzar Live no intercambia escenas', () => {
    const songLive: ChurchSong = {
      id: 'song-live-a',
      title: 'Canción en Emisión (Live)',
      theme: {
        fontSize: 44,
        fontFamily: 'Inter',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
      },
      sections: [{ id: 'sla-1', type: 'verse', label: 'Estrofa 1', slides: ['Slide Live 1', 'Slide Live 2'] }],
      arrangements: [{ id: 'arr-la', name: 'Estándar', sequence: ['sla-1'] }],
      defaultArrangementId: 'arr-la',
    };

    const songPreview: ChurchSong = {
      id: 'song-prev-b',
      title: 'Canción Preparada en Vista Previa',
      theme: {
        fontSize: 44,
        fontFamily: 'Inter',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        backgroundImageUrl: '/backgrounds/worship/worship_celestial_indigo.jpg',
      },
      sections: [{ id: 'spb-1', type: 'verse', label: 'Estrofa 1', slides: ['Slide Preview 1'] }],
      arrangements: [{ id: 'arr-pb', name: 'Estándar', sequence: ['spb-1'] }],
      defaultArrangementId: 'arr-pb',
    };

    // 1. Enviar Canción A a LIVE
    songStore.presentSongLive(songLive);
    expect(presentationStore.getSnapshot().liveScene?.content.song?.songId).toBe('song-live-a');

    // 2. Enviar Canción B a PREVIEW (el operador la está preparando para el siguiente momento)
    songStore.previewSong(songPreview);
    expect(presentationStore.getSnapshot().previewScene?.content.song?.songId).toBe('song-prev-b');

    // 3. El operador cambia el fondo de Canción B en la biblioteca
    songStore.setSongBackground('song-prev-b', '/backgrounds/worship/worship_amber_horizon.jpg');

    // VERIFICACIÓN 1: Canción A en LIVE sigue estando en LIVE con su fondo original intacto
    const liveNow = presentationStore.getSnapshot().liveScene;
    expect(liveNow?.content.song?.songId).toBe('song-live-a');
    expect(liveNow?.style.backgroundImageUrl).toBe('/backgrounds/worship/worship_ambient_blue.jpg');

    // VERIFICACIÓN 2: PREVIEW sigue mostrando Canción B (NO fue sobreescrita por la de Live)
    const prevNow = presentationStore.getSnapshot().previewScene;
    expect(prevNow?.content.song?.songId).toBe('song-prev-b');
    expect(prevNow?.style.backgroundImageUrl).toBe('/backgrounds/worship/worship_amber_horizon.jpg');

    // VERIFICACIÓN 3: Al avanzar diapositiva en Canción A (Live), PREVIEW no se sobreescribe
    presentationStore.nextSongSlide();
    expect(presentationStore.getSnapshot().liveScene?.content.song?.activeSlideIndex).toBe(1);
    expect(presentationStore.getSnapshot().previewScene?.content.song?.songId).toBe('song-prev-b');
  });
});

