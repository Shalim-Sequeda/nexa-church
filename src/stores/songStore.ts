import { useSyncExternalStore } from 'react';
import { ChurchSong, SongSection, Scene, SongSlideMeta } from '../types/church';
import { loadSavedSongs, saveSong as tauriSaveSong, deleteSong as tauriDeleteSong } from '../services/tauri';
import { presentationStore } from './presentationStore';
import { churchStore } from './churchStore';

export interface SongStoreState {
  songs: ChurchSong[];
  selectedSongId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  isEditorOpen: boolean;
  isCreatingNew: boolean;
  editingSong: ChurchSong | null;
  isImporterOpen: boolean;
  isLoading: boolean;
}

export const PRESET_WORSHIP_SONGS: ChurchSong[] = [
  {
    id: 'song-cuan-grande-es-dios',
    title: 'Cuán Grande es Dios',
    artist: 'Chris Tomlin / En Espíritu y en Verdad',
    author: 'Chris Tomlin, Ed Cash, Jesse Reeves',
    originalKey: 'G',
    tempo: 78,
    timeSignature: '4/4',
    tags: ['Adoración', 'Grandeza', 'Alabanza'],
    theme: {
      backgroundImageUrl: '/backgrounds/worship/worship_golden_sanctuary.jpg',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 44,
      textColor: '#FFFFFF',
      backgroundColor: '#0B0F19',
      textAlign: 'center',
    },
    sections: [
      {
        id: 'sec-cg-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'El esplendor de un Rey, vestido en majestad,\nLa tierra alegre está, la tierra alegre está.\nCubierto está de luz, venció a la oscuridad,\nY tiembla a su voz, y tiembla a su voz.',
        ],
      },
      {
        id: 'sec-cg-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          '¡Cuán grande es Dios! Cántale:\n¡Cuán grande es Dios! Y todos lo verán,\n¡Cuán grande, cuán grande es Dios!',
        ],
      },
      {
        id: 'sec-cg-v2',
        type: 'verse',
        label: 'Estrofa 2',
        slides: [
          'Día a día Él está, y el tiempo está en Él,\nPrincipio y el fin, principio y el fin.\nLa Trinidad en Dios, el Padre, Hijo, Espíritu,\nCordero y el León, Cordero y el León.',
        ],
      },
      {
        id: 'sec-cg-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Tu Nombre sobre todo es,\nEres digno de alabar;\nY mi ser cantará:\n¡Cuán grande es Dios!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-cg-std',
        name: 'Estándar',
        sequence: ['sec-cg-v1', 'sec-cg-c', 'sec-cg-v2', 'sec-cg-c', 'sec-cg-b', 'sec-cg-c'],
      },
    ],
    defaultArrangementId: 'arr-cg-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-no-hay-lugar-mas-alto',
    title: 'No Hay Lugar Más Alto',
    artist: 'Miel San Marcos / Christine D\'Clario',
    author: 'Josh Morales, Luis Morales Jr.',
    originalKey: 'A',
    tempo: 68,
    timeSignature: '4/4',
    tags: ['Adoración', 'Rendición'],
    theme: {
      backgroundImageUrl: '/backgrounds/worship/worship_celestial_indigo.jpg',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 44,
      textColor: '#FFFFFF',
      backgroundColor: '#090B10',
      textAlign: 'center',
    },
    sections: [
      {
        id: 'sec-nhl-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'A tus pies arde mi corazón,\nA tus pies entrego lo que soy.\nEs el lugar de mi seguridad,\nDonde nadie me puede señalar.',
        ],
      },
      {
        id: 'sec-nhl-pre',
        type: 'pre-chorus',
        label: 'Pre-Coro',
        slides: [
          'Me perdonaste, me acercaste a tu presencia,\nMe levantaste, hoy me postro a adorarte.',
        ],
      },
      {
        id: 'sec-nhl-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'No hay lugar más alto, más grande,\nQue estar a tus pies, que estar a tus pies.\nNo hay lugar más alto, más grande,\nQue estar a tus pies, que estar a tus pies.',
        ],
      },
      {
        id: 'sec-nhl-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Y aquí permaneceré, postrado a tus pies,\nY aquí permaneceré a los pies de Cristo.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-nhl-std',
        name: 'Estándar',
        sequence: ['sec-nhl-v1', 'sec-nhl-pre', 'sec-nhl-c', 'sec-nhl-b', 'sec-nhl-c'],
      },
    ],
    defaultArrangementId: 'arr-nhl-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-hosanna-barrientos',
    title: 'Hosanna',
    artist: 'Marco Barrientos',
    author: 'Brooke Ligertwood',
    originalKey: 'G',
    tempo: 76,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Exaltación', 'Avivamiento'],
    theme: {
      backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 44,
      textColor: '#FFFFFF',
      backgroundColor: '#08080C',
      textAlign: 'center',
    },
    sections: [
      {
        id: 'sec-hos-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Veo al Rey de gloria venir con fuego y poder,\nLa tierra tiembla, la tierra tiembla.\nVeo su amor y gracia mi pecado perdonar,\nLe alabaremos, le alabaremos.',
        ],
      },
      {
        id: 'sec-hos-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          '¡Hosanna, Hosanna!\nHosanna en las alturas.\n¡Hosanna, Hosanna!\nHosanna en las alturas.',
        ],
      },
      {
        id: 'sec-hos-v2',
        type: 'verse',
        label: 'Estrofa 2',
        slides: [
          'Veo una generación con fe y con pasión,\nDispuestos a vencer, dispuestos a vencer.\nVeo avivamiento en cada corazón,\nClamando a ti, clamando a ti.',
        ],
      },
      {
        id: 'sec-hos-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Sana mi corazón, límpiame de lo que no te agrada;\nMuestra tu amor en mí, como tú me amas.\nQuiero ser para ti un siervo de tu verdad,\nHasta que vengas por mí en tu gloria.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-hos-std',
        name: 'Estándar',
        sequence: ['sec-hos-v1', 'sec-hos-c', 'sec-hos-v2', 'sec-hos-c', 'sec-hos-b', 'sec-hos-c'],
      },
    ],
    defaultArrangementId: 'arr-hos-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-lo-haras-otra-vez',
    title: 'Lo Harás Otra Vez',
    artist: 'Elevation Worship',
    author: 'Mack Brock, Chris Brown, Steven Furtick',
    originalKey: 'Bb',
    tempo: 72,
    timeSignature: '4/4',
    tags: ['Adoración', 'Fe', 'Milagros'],
    sections: [
      {
        id: 'sec-lh-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Muros caerán, gigantes caerán,\nSé que la noche en luz cambiarás.\nMi Dios nunca falla, mi Dios vencerá,\nSé que la noche en luz cambiarás.',
        ],
      },
      {
        id: 'sec-lh-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Tu promesa sigue en pie, grande es tu fidelidad;\nConfiado estoy en ti, en tus manos estoy.\nNunca me has fallado, y no fallarás hoy,\n¡Lo harás otra vez!',
        ],
      },
      {
        id: 'sec-lh-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Yo sé que tú mueves montañas,\nYo creo que lo harás otra vez.\nAbriste camino en el mar,\nY creo que lo harás otra vez.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-lh-std',
        name: 'Estándar',
        sequence: ['sec-lh-v1', 'sec-lh-c', 'sec-lh-b', 'sec-lh-c'],
      },
    ],
    defaultArrangementId: 'arr-lh-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-que-se-abra-el-cielo',
    title: 'Que Se Abra el Cielo',
    artist: 'Christine D\'Clario / Marcos Brunet',
    author: 'Marcos Brunet',
    originalKey: 'C',
    tempo: 70,
    timeSignature: '4/4',
    tags: ['Adoración', 'Presencia', 'Clamor'],
    sections: [
      {
        id: 'sec-qsc-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Dios está aquí, su presencia se siente hoy,\nÁngeles cantan en este lugar.\nEl Rey de gloria desciende con poder,\nSu manto llena el templo celestial.',
        ],
      },
      {
        id: 'sec-qsc-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Que se abra el cielo, que se abra el cielo,\nDerrama de tu gloria, derrama de tu gloria.\nHaz descender tu fuego, haz descender tu fuego,\n¡Ven y llena este lugar!',
        ],
      },
      {
        id: 'sec-qsc-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Queremos ver tu gloria, queremos ver tu gloria,\nComo en el principio, desciende en este altar.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-qsc-std',
        name: 'Estándar',
        sequence: ['sec-qsc-v1', 'sec-qsc-c', 'sec-qsc-b', 'sec-qsc-c'],
      },
    ],
    defaultArrangementId: 'arr-qsc-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-santo-es-el-que-vive',
    title: 'Santo es el que Vive',
    artist: 'Montesanto',
    author: 'Montesanto',
    originalKey: 'D',
    tempo: 72,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Majestad', 'Júbilo'],
    sections: [
      {
        id: 'sec-sev-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'El León rugió, la tumba se abrió,\nLa muerte no pudo detener al Salvador.\nVencedor de la cruz, vestido de luz,\nSentado a la diestra del Padre está Jesús.',
        ],
      },
      {
        id: 'sec-sev-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Santo es el que vive, Santo es el Cordero,\nDigno de la gloria, digno de honor.\n¡Aleluya al Gran Rey!',
        ],
      },
      {
        id: 'sec-sev-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Cantamos Santo, Santo, Santo,\nDigno, Digno, Digno.\nEl cielo y la tierra se rinden ante Ti.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-sev-std',
        name: 'Estándar',
        sequence: ['sec-sev-v1', 'sec-sev-c', 'sec-sev-b', 'sec-sev-c'],
      },
    ],
    defaultArrangementId: 'arr-sev-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-ya-no-soy-esclavo',
    title: 'Ya No Soy Esclavo',
    artist: 'Julio Melgar / Bethel Music',
    author: 'Brian Johnson, Joel Case, Jonathan David Helser',
    originalKey: 'Bb',
    tempo: 74,
    timeSignature: '4/4',
    tags: ['Adoración', 'Identidad', 'Libertad'],
    sections: [
      {
        id: 'sec-yne-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Me envuelves hoy con una canción,\nMelodía de tu amor.\nCantando paz y libertad,\nDe mis enemigos me libras hoy.',
        ],
      },
      {
        id: 'sec-yne-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Ya no soy un esclavo del temor,\nYo soy hijo de Dios.\nYa no soy un esclavo del temor,\nYo soy hijo de Dios.',
        ],
      },
      {
        id: 'sec-yne-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Abriste el mar para que yo camine,\nTu amor ahogó todo mi temor.\nMe rescataste y hoy puedo cantar:\n¡Yo soy hijo de Dios!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-yne-std',
        name: 'Estándar',
        sequence: ['sec-yne-v1', 'sec-yne-c', 'sec-yne-b', 'sec-yne-c'],
      },
    ],
    defaultArrangementId: 'arr-yne-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-yeshua',
    title: 'Yeshua — Quiero Conocer a Jesús',
    artist: 'Alessandro Vilas Boas / Generación 12',
    author: 'Alessandro Vilas Boas',
    originalKey: 'C',
    tempo: 68,
    timeSignature: '4/4',
    tags: ['Adoración', 'Jesús', 'Amado'],
    sections: [
      {
        id: 'sec-yesh-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Mi amado es el más bello entre millares y millares,\nMi amado es el más bello entre millares y millares.',
        ],
      },
      {
        id: 'sec-yesh-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          '¡Yeshua, ah-ah-ah!\n¡Yeshua, ah-ah-ah!\n¡Yeshua, ah-ah-ah!\n¡Yeshua!',
        ],
      },
      {
        id: 'sec-yesh-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'El reino es tuyo, el poder es tuyo,\nLa gloria es tuya por siempre, amén.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-yesh-std',
        name: 'Estándar',
        sequence: ['sec-yesh-v1', 'sec-yesh-c', 'sec-yesh-b', 'sec-yesh-c'],
      },
    ],
    defaultArrangementId: 'arr-yesh-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-grande-es-tu-fidelidad',
    title: 'Grande es Tu Fidelidad',
    artist: 'Himnario Cristiano',
    author: 'Thomas O. Chisholm / William M. Runyan',
    originalKey: 'D',
    tempo: 72,
    timeSignature: '3/4',
    tags: ['Himno', 'Fidelidad', 'Clásico'],
    sections: [
      {
        id: 'sec-gf-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Oh Dios eterno, tu misericordia\nNi una sombra de duda tendrá;\nTu compasión y bondad nunca fallan,\nY por los siglos el mismo serás.',
        ],
      },
      {
        id: 'sec-gf-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          '¡Grande es tu fidelidad!\n¡Grande es tu fidelidad!\nCada mañana renuevas tu amor;\nNada me falta, pues todo provees,\n¡Grande, Señor, es tu fidelidad!',
        ],
      },
      {
        id: 'sec-gf-v2',
        type: 'verse',
        label: 'Estrofa 2',
        slides: [
          'El sol, la luna, las olas del mar,\nTodo testifica de tu eterno amor;\nLa primavera, el invierno y verano\nCantan la gloria de tu creación.',
        ],
      },
      {
        id: 'sec-gf-v3',
        type: 'verse',
        label: 'Estrofa 3',
        slides: [
          'Tú me perdonas, me impartes la paz,\nTu presencia me guía y consuela;\nFuerzas me das hoy, valor para el mañana,\nGrandes bendiciones derramas en mí.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-gf-std',
        name: 'Completo',
        sequence: ['sec-gf-v1', 'sec-gf-c', 'sec-gf-v2', 'sec-gf-c', 'sec-gf-v3', 'sec-gf-c'],
      },
    ],
    defaultArrangementId: 'arr-gf-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-la-bondad-de-dios',
    title: 'La Bondad de Dios',
    artist: 'Bethel Music / Jenn Johnson',
    author: 'Jenn Johnson, Ed Cash, Jason Ingram',
    originalKey: 'Ab',
    tempo: 70,
    timeSignature: '4/4',
    tags: ['Adoración', 'Gratitud', 'Contemporáneo'],
    sections: [
      {
        id: 'sec-bd-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Te amo, Dios, tu amor nunca me falla,\nEn tus manos todos mis días están.\nDesde el amanecer hasta que el sol se ponga,\nCantaré de la bondad de Dios.',
        ],
      },
      {
        id: 'sec-bd-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'En mi vida has sido bueno,\nEn mi vida has sido tan, tan fiel.\nCon cada aliento que pueda respirar,\nCantaré de la bondad de Dios.',
        ],
      },
      {
        id: 'sec-bd-v2',
        type: 'verse',
        label: 'Estrofa 2',
        slides: [
          'Amo tu voz, me has guiado por el fuego,\nEn la oscuridad tu presencia cerca está.\nTe conozco como Padre, te conozco como Amigo,\nHe vivido en la bondad de Dios.',
        ],
      },
      {
        id: 'sec-bd-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'Tu bondad me sigue, me sigue a donde voy,\nTu bondad me sigue, me sigue a donde voy.\nMi vida te entrego, rendido a tus pies,\nTu bondad me sigue, me sigue a donde voy.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-bd-std',
        name: 'Estándar',
        sequence: ['sec-bd-v1', 'sec-bd-c', 'sec-bd-v2', 'sec-bd-c', 'sec-bd-b', 'sec-bd-c'],
      },
    ],
    defaultArrangementId: 'arr-bd-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-tu-fidelidad',
    title: 'Tu Fidelidad',
    artist: 'Marcos Witt',
    author: 'Miguel Cassina',
    originalKey: 'D',
    tempo: 68,
    timeSignature: '4/4',
    tags: ['Adoración', 'Fidelidad', 'Clásico'],
    sections: [
      {
        id: 'sec-tf-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Tu fidelidad es grande,\nTu fidelidad incomparable es;\nNadie como tú, bendito Dios,\nGrande es tu fidelidad.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-tf-std',
        name: 'Estándar',
        sequence: ['sec-tf-c', 'sec-tf-c'],
      },
    ],
    defaultArrangementId: 'arr-tf-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-al-que-esta-sentado',
    title: 'Al Que Está Sentado en el Trono',
    artist: 'Marcos Brunet',
    author: 'Marcos Brunet',
    originalKey: 'G',
    tempo: 74,
    timeSignature: '4/4',
    tags: ['Adoración', 'Exaltación'],
    sections: [
      {
        id: 'sec-as-v1',
        type: 'verse',
        label: 'Estrofa',
        slides: [
          'Quiero conocerte cada día más a ti,\nEstar en tu presencia y adorar.\nRevélame tu gloria, te quiero contemplar,\nTu amor sobrepasa todo entendimiento.',
        ],
      },
      {
        id: 'sec-as-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Al que está sentado en el trono,\nAl que vive para siempre y siempre,\nSea la gloria, sea la honra y el poder,\nSea la gloria, sea la honra y el poder.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-as-std',
        name: 'Estándar',
        sequence: ['sec-as-v1', 'sec-as-c', 'sec-as-c'],
      },
    ],
    defaultArrangementId: 'arr-as-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-rey-de-reyes',
    title: 'Rey de Reyes',
    artist: 'Hillsong En Español',
    author: 'Brooke Ligertwood, Jason Ingram, Scott Ligertwood',
    originalKey: 'D',
    tempo: 68,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Evangelio', 'Contemporáneo'],
    sections: [
      {
        id: 'sec-rr-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'En tinieblas esperábamos sin rumbo y sin luz,\nHasta que del cielo vino el Salvador Jesús.\nCumpliendo las promesas que el Padre declaró,\nEn un pesebre humilde la salvación nació.',
        ],
      },
      {
        id: 'sec-rr-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Alabemos al Padre, alabemos al Hijo,\nAlabemos al Santo Consolador.\nMajestad en las alturas, Rey de reyes y Señor,\n¡Alabemos a nuestro Salvador!',
        ],
      },
      {
        id: 'sec-rr-v2',
        type: 'verse',
        label: 'Estrofa 2',
        slides: [
          'Por revelar el reino cargaste con la cruz,\nPor amor a los perdidos moriste Tú, Jesús.\nY aun en tu sufrimiento viste la redención,\nPor medio de tu muerte diste salvación.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-rr-std',
        name: 'Estándar',
        sequence: ['sec-rr-v1', 'sec-rr-c', 'sec-rr-v2', 'sec-rr-c'],
      },
    ],
    defaultArrangementId: 'arr-rr-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-cuan-hermoso-es-el-nombre',
    title: 'Cuán Hermoso es el Nombre',
    artist: 'Hillsong Worship',
    author: 'Ben Fielding, Brooke Ligertwood',
    originalKey: 'D',
    tempo: 68,
    timeSignature: '4/4',
    tags: ['Adoración', 'Cristo', 'Nombre'],
    sections: [
      {
        id: 'sec-ch-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Tú fuiste el Verbo en el principio,\nUnigénito de Dios;\nEl misterio de tu gloria,\nRevelado en tu amor.',
        ],
      },
      {
        id: 'sec-ch-c1',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Cuán hermoso su nombre es,\nCuán hermoso su nombre es,\nEl nombre de Jesús mi Rey.\nCuán hermoso su nombre es,\nNada se iguala a Él;\nCuán hermoso su nombre es,\nEl nombre de Jesús.',
        ],
      },
      {
        id: 'sec-ch-b',
        type: 'bridge',
        label: 'Puente',
        slides: [
          'La muerte venciste, el velo partiste,\nLa tumba no pudo detenerte jamás;\nLos cielos declaran tu gloria eterna,\n¡Porque has resucitado en poder!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-ch-std',
        name: 'Estándar',
        sequence: ['sec-ch-v1', 'sec-ch-c1', 'sec-ch-b', 'sec-ch-c1'],
      },
    ],
    defaultArrangementId: 'arr-ch-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-en-esto-creo',
    title: 'En Esto Creo (El Credo)',
    artist: 'Hillsong Worship',
    author: 'Ben Fielding, Matt Crocker',
    originalKey: 'C',
    tempo: 72,
    timeSignature: '4/4',
    tags: ['Adoración', 'Fe', 'Credo'],
    sections: [
      {
        id: 'sec-ec-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'En Dios Padre creo, Creador de tierra y cielo,\nY en Jesucristo su Hijo, nuestro Salvador.\nConcebido por el Espíritu Santo,\nNació de la virgen María, padeció y resucitó.',
        ],
      },
      {
        id: 'sec-ec-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Creo en Dios el Padre, creo en Jesucristo,\nCreo en el Espíritu Santo, Él es Dios Trino.\nCreo en la resurrección, que la vida triunfará,\nCreo en el nombre de Jesús.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-ec-std',
        name: 'Estándar',
        sequence: ['sec-ec-v1', 'sec-ec-c'],
      },
    ],
    defaultArrangementId: 'arr-ec-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-senor-eres-fiel',
    title: 'Señor Eres Fiel',
    artist: 'Israel Houghton',
    author: 'Israel Houghton',
    originalKey: 'D',
    tempo: 125,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Júbilo', 'Fidelidad'],
    sections: [
      {
        id: 'sec-sef-v1',
        type: 'verse',
        label: 'Estrofa',
        slides: [
          'Señor eres fiel y tu misericordia es eterna,\nSeñor eres fiel y tu misericordia es eterna.\nGente de toda lengua y nación,\nDe generación a generación.',
        ],
      },
      {
        id: 'sec-sef-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          '¡Te alabamos hoy, Aleluya, Aleluya!\nTe alabamos hoy por quien eres Tú.\n¡Te alabamos hoy, Aleluya, Aleluya!\nTe alabamos hoy por quien eres Tú,\n¡Eres bueno!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-sef-std',
        name: 'Estándar',
        sequence: ['sec-sef-v1', 'sec-sef-c'],
      },
    ],
    defaultArrangementId: 'arr-sef-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-tu-estas-aqui',
    title: 'Tú Estás Aquí',
    artist: 'Jesús Adrián Romero / Marcela Gándara',
    author: 'Jesús Adrián Romero',
    originalKey: 'D',
    tempo: 65,
    timeSignature: '4/4',
    tags: ['Adoración', 'Intimidad'],
    sections: [
      {
        id: 'sec-tea-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Aunque mis ojos no te puedan ver,\nTe puedo sentir, sé que estás aquí.\nAunque mis manos no pueden tocar\nTu rostro Señor, sé que estás aquí.',
        ],
      },
      {
        id: 'sec-tea-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Mi corazón puede sentir tu presencia,\nTú estás aquí, tú estás aquí.\nPuedo sentir tu majestad,\nTú estás aquí, tú estás aquí.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-tea-std',
        name: 'Estándar',
        sequence: ['sec-tea-v1', 'sec-tea-c'],
      },
    ],
    defaultArrangementId: 'arr-tea-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-vamos-a-cantar',
    title: 'Vamos a Cantar',
    artist: 'En Espíritu y En Verdad',
    author: 'Todd Fields',
    originalKey: 'G',
    tempo: 130,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Fiesta', 'Gozo'],
    sections: [
      {
        id: 'sec-vac-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Vamos a cantar con la música del cielo,\nVamos a cantar alegres porque escuchas cuando cantamos,\nPara alabarte a Ti Señor.',
        ],
      },
      {
        id: 'sec-vac-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Amamos todo de Ti, cielo y tierra te adoran,\nLos reinos se rinden ante tu majestad.\nJesucristo eres el Señor,\n¡Vamos a cantar!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-vac-std',
        name: 'Estándar',
        sequence: ['sec-vac-v1', 'sec-vac-c'],
      },
    ],
    defaultArrangementId: 'arr-vac-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-ven-y-toma-tu-lugar',
    title: 'Ven y Toma Tu Lugar',
    artist: 'Marcos Brunet',
    author: 'Marcos Brunet',
    originalKey: 'F',
    tempo: 66,
    timeSignature: '4/4',
    tags: ['Adoración', 'Trono'],
    sections: [
      {
        id: 'sec-vtl-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'No hay nadie como tú, no hay nadie como tú Señor,\nNo hay nadie como tú, no hay nadie como tú.\nEres el anhelo de nuestra vida,\nNuestras coronas arrojamos ante ti.',
        ],
      },
      {
        id: 'sec-vtl-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Ven y toma tu lugar, ven y toma tu lugar,\nVen y toma tu lugar, Jesús.\nTe damos el trono de nuestra alabanza,\n¡Ven y reina aquí!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-vtl-std',
        name: 'Estándar',
        sequence: ['sec-vtl-v1', 'sec-vtl-c'],
      },
    ],
    defaultArrangementId: 'arr-vtl-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-padre-nuestro',
    title: 'Padre Nuestro',
    artist: 'Bethel Music',
    author: 'Marcus Meier',
    originalKey: 'G',
    tempo: 72,
    timeSignature: '4/4',
    tags: ['Adoración', 'Oración'],
    sections: [
      {
        id: 'sec-pn-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Padre nuestro celestial, santificado sea tu nombre;\nVenga tu reino hoy, hágase tu voluntad,\nEn la tierra como en el cielo.',
        ],
      },
      {
        id: 'sec-pn-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Tuyo es el reino, tuyo el poder,\nTuya es la gloria por siempre jamás.\n¡Amén!',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-pn-std',
        name: 'Estándar',
        sequence: ['sec-pn-v1', 'sec-pn-c'],
      },
    ],
    defaultArrangementId: 'arr-pn-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-yo-navegare',
    title: 'Yo Navegaré',
    artist: 'Hermoso Canto Espiritual',
    author: 'Azmaveth Carneiro da Silva',
    originalKey: 'Em',
    tempo: 65,
    timeSignature: '4/4',
    tags: ['Adoración', 'Espíritu Santo'],
    sections: [
      {
        id: 'sec-ynav-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          'Yo navegaré en el océano de tu Espíritu,\nY allí adoraré al Dios de mi amor.',
        ],
      },
      {
        id: 'sec-ynav-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'Espíritu, Espíritu,\nDesciende como fuego,\nComo en Pentecostés,\nY lléname de nuevo.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-ynav-std',
        name: 'Estándar',
        sequence: ['sec-ynav-v1', 'sec-ynav-c'],
      },
    ],
    defaultArrangementId: 'arr-ynav-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'song-a-dios-sea-la-gloria',
    title: 'A Dios Sea la Gloria',
    artist: 'Andraé Crouch / Himnario',
    author: 'Andraé Crouch',
    originalKey: 'G',
    tempo: 76,
    timeSignature: '4/4',
    tags: ['Himno', 'Gloria', 'Gratitud'],
    sections: [
      {
        id: 'sec-ag-v1',
        type: 'verse',
        label: 'Estrofa 1',
        slides: [
          '¿Cómo agradecer tantas cosas que hiciste por mí?\nCosas tan maravillosas que no puedo comprender;\nLas voces de millones de ángeles no podrían expresar,\nTodo lo que soy y lo que espero ser, se lo debo todo a Él.',
        ],
      },
      {
        id: 'sec-ag-c',
        type: 'chorus',
        label: 'Coro',
        slides: [
          'A Dios sea la gloria, a Dios sea la gloria,\nA Dios sea la gloria por lo que Él ha hecho.\nCon su sangre me ha lavado, su poder me ha transformado,\nA Dios sea la gloria por lo que Él ha hecho.',
        ],
      },
    ],
    arrangements: [
      {
        id: 'arr-ag-std',
        name: 'Estándar',
        sequence: ['sec-ag-v1', 'sec-ag-c', 'sec-ag-c'],
      },
    ],
    defaultArrangementId: 'arr-ag-std',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialState: SongStoreState = {
  songs: [],
  selectedSongId: null,
  searchQuery: '',
  selectedTag: null,
  isEditorOpen: false,
  isCreatingNew: false,
  editingSong: null,
  isImporterOpen: false,
  isLoading: true,
};

let state: SongStoreState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(updater: Partial<SongStoreState> | ((prev: SongStoreState) => Partial<SongStoreState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  notify();
}

let isInitialized = false;

export const songStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: async () => {
    if (isInitialized) return;
    isInitialized = true;

    setState({ isLoading: true });

    try {
      const diskSongs = await loadSavedSongs();
      if (diskSongs && diskSongs.length > 0) {
        // Enriquecer canciones de disco con fondos de adoración predeterminados si carecen de uno
        const presetBgMap = new Map(PRESET_WORSHIP_SONGS.map((p) => [p.id, p.theme?.backgroundImageUrl]));
        const enrichedDiskSongs = diskSongs.map((s, idx) => {
          if (!s.theme?.backgroundImageUrl) {
            const presetBg = presetBgMap.get(s.id);
            const fallbackBg = presetBg || (idx % 2 === 0 ? '/backgrounds/worship/worship_ambient_blue.jpg' : '/backgrounds/worship/worship_golden_sanctuary.jpg');
            return {
              ...s,
              theme: {
                ...(s.theme || {}),
                backgroundImageUrl: fallbackBg,
              },
            };
          }
          return s;
        });

        // Fusionar canciones preinstaladas para que siempre aparezcan las nuevas del cancionero
        const existingIds = new Set(enrichedDiskSongs.map((s) => s.id));
        const merged = [...enrichedDiskSongs];
        const toSave: ChurchSong[] = [];
        for (const p of PRESET_WORSHIP_SONGS) {
          if (!existingIds.has(p.id)) {
            merged.push(p);
            toSave.push(p);
          }
        }
        setState({ songs: merged, isLoading: false });

        // Guardar las nuevas canciones en disco en segundo plano de forma no bloqueante
        if (toSave.length > 0) {
          setTimeout(() => {
            toSave.forEach((s) => tauriSaveSong(s).catch(() => {}));
          }, 1000);
        }
      } else {
        // Inicializar con el cancionero de fábrica preinstalado
        setState({ songs: PRESET_WORSHIP_SONGS, isLoading: false });
        setTimeout(() => {
          PRESET_WORSHIP_SONGS.forEach((s) => tauriSaveSong(s).catch(() => {}));
        }, 1000);
      }
    } catch (err) {
      console.warn('[NEXA Song Store] Fallback a presets de canciones:', err);
      setState({ songs: PRESET_WORSHIP_SONGS, isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    setState({ searchQuery: query });
  },

  setSelectedTag: (tag: string | null) => {
    setState({ selectedTag: tag });
  },

  setSelectedSongId: (id: string | null) => {
    setState({ selectedSongId: id });
  },

  selectSong: (song: ChurchSong | null, autoPreview: boolean = true) => {
    if (song) {
      const exists = state.songs.some((s) => s.id === song.id);
      const updatedSongs = exists ? state.songs : [...state.songs, song];
      setState({ selectedSongId: song.id, songs: updatedSongs });
    } else {
      setState({ selectedSongId: null });
    }
    if (song && autoPreview) {
      songStore.previewSong(song, undefined, undefined, 0);
    }
  },

  jumpToSelectedSongChorus: (): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const arr = song.arrangements.find((a) => a.id === (song.defaultArrangementId || song.arrangements[0]?.id)) || song.arrangements[0];
    const sequence = arr?.sequence || song.sections.map((s) => s.id);
    const secMap = new Map(song.sections.map((s) => [s.id, s]));

    const chorusIndices: number[] = [];
    let currentIndex = 0;

    for (const secId of sequence) {
      const sec = secMap.get(secId);
      if (sec) {
        const isPreChorus = sec.type === 'pre-chorus' || sec.label.toLowerCase().includes('pre-coro') || sec.label.toLowerCase().includes('precoro');
        const isChorus = !isPreChorus && (sec.type === 'chorus' || sec.label.toLowerCase().includes('coro') || sec.label.toLowerCase().includes('chorus'));
        if (isChorus) {
          for (let i = 0; i < sec.slides.length; i++) {
            chorusIndices.push(currentIndex + i);
          }
        }
        currentIndex += sec.slides.length;
      }
    }

    if (chorusIndices.length === 0) return false;

    // Detectar diapositiva activa en preview o live para ciclar inteligentemente
    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;
    const activeSlide =
      (live?.type === 'song' && live.content?.song?.songId === song.id)
        ? (live.content.song.activeSlideIndex ?? -1)
        : (preview?.type === 'song' && preview.content?.song?.songId === song.id)
        ? (preview.content.song.activeSlideIndex ?? -1)
        : -1;

    let targetIndex = chorusIndices[0];
    const posInChorus = chorusIndices.indexOf(activeSlide);
    if (posInChorus >= 0) {
      targetIndex = chorusIndices[(posInChorus + 1) % chorusIndices.length];
    }

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      presentationStore.jumpToSongSlide(targetIndex);
      if (isThisSongPreview) {
        songStore.previewSong(song, undefined, undefined, targetIndex);
      }
    } else {
      songStore.previewSong(song, undefined, undefined, targetIndex);
    }
    return true;
  },

  jumpToSelectedSongPreChorus: (): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const arr = song.arrangements.find((a) => a.id === (song.defaultArrangementId || song.arrangements[0]?.id)) || song.arrangements[0];
    const sequence = arr?.sequence || song.sections.map((s) => s.id);
    const secMap = new Map(song.sections.map((s) => [s.id, s]));

    const preChorusIndices: number[] = [];
    let currentIndex = 0;

    for (const secId of sequence) {
      const sec = secMap.get(secId);
      if (sec) {
        const isPre = sec.type === 'pre-chorus' || sec.label.toLowerCase().includes('pre-coro') || sec.label.toLowerCase().includes('precoro');
        if (isPre) {
          for (let i = 0; i < sec.slides.length; i++) {
            preChorusIndices.push(currentIndex + i);
          }
        }
        currentIndex += sec.slides.length;
      }
    }

    if (preChorusIndices.length === 0) return false;

    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;
    const activeSlide =
      (live?.type === 'song' && live.content?.song?.songId === song.id)
        ? (live.content.song.activeSlideIndex ?? -1)
        : (preview?.type === 'song' && preview.content?.song?.songId === song.id)
        ? (preview.content.song.activeSlideIndex ?? -1)
        : -1;

    let targetIndex = preChorusIndices[0];
    const posInPre = preChorusIndices.indexOf(activeSlide);
    if (posInPre >= 0) {
      targetIndex = preChorusIndices[(posInPre + 1) % preChorusIndices.length];
    }

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      presentationStore.jumpToSongSlide(targetIndex);
      if (isThisSongPreview) {
        songStore.previewSong(song, undefined, undefined, targetIndex);
      }
    } else {
      songStore.previewSong(song, undefined, undefined, targetIndex);
    }
    return true;
  },

  jumpToSelectedSongVerse: (stanzaNum: number): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const arr = song.arrangements.find((a) => a.id === (song.defaultArrangementId || song.arrangements[0]?.id)) || song.arrangements[0];
    const sequence = arr?.sequence || song.sections.map((s) => s.id);
    const secMap = new Map(song.sections.map((s) => [s.id, s]));

    const verseIndices: number[] = [];
    let currentIndex = 0;

    for (const secId of sequence) {
      const sec = secMap.get(secId);
      if (sec) {
        const numMatch = sec.label.match(/\d+/);
        const matchNum = numMatch ? parseInt(numMatch[0], 10) : undefined;
        const isMatch =
          (sec.type === 'verse' && matchNum === stanzaNum) ||
          sec.label.toLowerCase().includes(`estrofa ${stanzaNum}`) ||
          sec.label.toLowerCase().includes(`verso ${stanzaNum}`);

        if (isMatch) {
          for (let i = 0; i < sec.slides.length; i++) {
            verseIndices.push(currentIndex + i);
          }
        }
        currentIndex += sec.slides.length;
      }
    }

    if (verseIndices.length === 0) return false;

    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;
    const activeSlide =
      (live?.type === 'song' && live.content?.song?.songId === song.id)
        ? (live.content.song.activeSlideIndex ?? -1)
        : (preview?.type === 'song' && preview.content?.song?.songId === song.id)
        ? (preview.content.song.activeSlideIndex ?? -1)
        : -1;

    let targetIndex = verseIndices[0];
    const posInVerse = verseIndices.indexOf(activeSlide);
    if (posInVerse >= 0) {
      targetIndex = verseIndices[(posInVerse + 1) % verseIndices.length];
    }

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      presentationStore.jumpToSongSlide(targetIndex);
      if (isThisSongPreview) {
        songStore.previewSong(song, undefined, undefined, targetIndex);
      }
    } else {
      songStore.previewSong(song, undefined, undefined, targetIndex);
    }
    return true;
  },

  jumpToSelectedSongBridge: (): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const arr = song.arrangements.find((a) => a.id === (song.defaultArrangementId || song.arrangements[0]?.id)) || song.arrangements[0];
    const sequence = arr?.sequence || song.sections.map((s) => s.id);
    const secMap = new Map(song.sections.map((s) => [s.id, s]));

    const bridgeIndices: number[] = [];
    let currentIndex = 0;

    for (const secId of sequence) {
      const sec = secMap.get(secId);
      if (sec) {
        const isBridge = sec.type === 'bridge' || sec.label.toLowerCase().includes('puente');
        if (isBridge) {
          for (let i = 0; i < sec.slides.length; i++) {
            bridgeIndices.push(currentIndex + i);
          }
        }
        currentIndex += sec.slides.length;
      }
    }

    if (bridgeIndices.length === 0) return false;

    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;
    const activeSlide =
      (live?.type === 'song' && live.content?.song?.songId === song.id)
        ? (live.content.song.activeSlideIndex ?? -1)
        : (preview?.type === 'song' && preview.content?.song?.songId === song.id)
        ? (preview.content.song.activeSlideIndex ?? -1)
        : -1;

    let targetIndex = bridgeIndices[0];
    const posInBridge = bridgeIndices.indexOf(activeSlide);
    if (posInBridge >= 0) {
      targetIndex = bridgeIndices[(posInBridge + 1) % bridgeIndices.length];
    }

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      presentationStore.jumpToSongSlide(targetIndex);
      if (isThisSongPreview) {
        songStore.previewSong(song, undefined, undefined, targetIndex);
      }
    } else {
      songStore.previewSong(song, undefined, undefined, targetIndex);
    }
    return true;
  },

  nextSelectedSongSlide: (): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      return presentationStore.nextSongSlide();
    }
    if (isThisSongPreview && preview?.content?.song) {
      const nextIdx = preview.content.song.activeSlideIndex + 1;
      if (nextIdx < preview.content.song.slides.length) {
        songStore.previewSong(song, undefined, undefined, nextIdx);
        return true;
      }
    }
    return false;
  },

  previousSelectedSongSlide: (): boolean => {
    const songId = state.selectedSongId;
    if (!songId) return false;
    const song = state.songs.find((s) => s.id === songId);
    if (!song) return false;

    const live = presentationStore.getSnapshot().liveScene;
    const preview = presentationStore.getSnapshot().previewScene;

    const isThisSongLive = live?.type === 'song' && live.content?.song?.songId === song.id;
    const isThisSongPreview = preview?.type === 'song' && preview.content?.song?.songId === song.id;

    if (isThisSongLive) {
      return presentationStore.previousSongSlide();
    }
    if (isThisSongPreview && preview?.content?.song) {
      const prevIdx = preview.content.song.activeSlideIndex - 1;
      if (prevIdx >= 0) {
        songStore.previewSong(song, undefined, undefined, prevIdx);
        return true;
      }
    }
    return false;
  },

  setSongBackground: (songId: string, backgroundImageUrl: string) => {
    const song = state.songs.find((s) => s.id === songId);
    if (song) {
      const updatedTheme = {
        ...(song.theme || {}),
        backgroundImageUrl,
      };
      const updatedSong: ChurchSong = {
        ...song,
        theme: updatedTheme,
        updatedAt: new Date().toISOString(),
      };
      songStore.saveSong(updatedSong);
    }

    // Regla de aislamiento estricto: Solo actualizar PREVIEW si la escena actual en PREVIEW es ESTA MISMA canción
    const prev = presentationStore.getSnapshot().previewScene;
    if (prev?.type === 'song' && prev.content?.song?.songId === songId) {
      presentationStore.setPreviewScene({
        ...prev,
        style: {
          ...prev.style,
          backgroundImageUrl,
        },
      });
    }

    // REGLA CRÍTICA DE EMISIÓN:
    // Configurar o cambiar un fondo desde la biblioteca/cancionero es una operación de preparación/edición.
    // NUNCA altera LIVE directamente. Lo que está proyectándose al público se mantiene 100% inmutable
    // hasta que el operador decida explícitamente ejecutar 'En Vivo' / 'Take'.
  },

  openEditorForCreate: () => {
    const newSong: ChurchSong = {
      id: `song-${Date.now()}`,
      title: '',
      artist: '',
      author: '',
      originalKey: 'G',
      tempo: 75,
      timeSignature: '4/4',
      tags: ['Alabanza'],
      theme: {
        backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
        fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 46,
        textColor: '#FFFFFF',
        backgroundColor: '#090A0E',
        textAlign: 'center',
      },
      sections: [],
      arrangements: [],
      defaultArrangementId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState({ isEditorOpen: true, isCreatingNew: true, editingSong: newSong });
  },

  openEditorForEdit: (song: ChurchSong) => {
    setState({
      isEditorOpen: true,
      isCreatingNew: false,
      editingSong: JSON.parse(JSON.stringify(song)),
    });
  },

  closeEditor: () => {
    setState({ isEditorOpen: false, isCreatingNew: false, editingSong: null });
  },

  openImporter: () => {
    setState({ isImporterOpen: true });
  },

  closeImporter: () => {
    setState({ isImporterOpen: false });
  },

  saveSong: async (song: ChurchSong): Promise<void> => {
    const now = new Date().toISOString();
    const prepared: ChurchSong = {
      ...song,
      updatedAt: now,
      createdAt: song.createdAt || now,
    };

    const exists = state.songs.some((s) => s.id === prepared.id);
    const updatedSongs = exists
      ? state.songs.map((s) => (s.id === prepared.id ? prepared : s))
      : [prepared, ...state.songs];

    setState({
      songs: updatedSongs,
      isEditorOpen: false,
      editingSong: null,
      selectedSongId: prepared.id,
    });

    await tauriSaveSong(prepared);
  },

  deleteSong: async (id: string): Promise<void> => {
    const updatedSongs = state.songs.filter((s) => s.id !== id);
    setState({
      songs: updatedSongs,
      selectedSongId: state.selectedSongId === id ? null : state.selectedSongId,
    });
    await tauriDeleteSong(id);
  },

  duplicateSong: async (id: string): Promise<ChurchSong | null> => {
    const orig = state.songs.find((s) => s.id === id);
    if (!orig) return null;

    const copy: ChurchSong = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `song-${Date.now()}`,
      title: `${orig.title} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [copy, ...state.songs];
    setState({ songs: updated, selectedSongId: copy.id });
    await tauriSaveSong(copy);
    return copy;
  },

  /**
   * Agrega la canción al culto/proyecto actual como un Cue consolidado de producción (asSingleCue: true por defecto).
   * Contiene todas las diapositivas y permite saltos internos directos (C para Coro, 1-9 para Estrofas).
   */
  addSongToProject: (song: ChurchSong, arrangementId?: string, asSingleCue: boolean = true) => {
    const arr = song.arrangements.find((a) => a.id === (arrangementId || song.defaultArrangementId)) || song.arrangements[0];
    const sequence = arr?.sequence || song.sections.map((s) => s.id);

    // Mapeo rápido de secciones
    const sectionMap = new Map<string, SongSection>();
    song.sections.forEach((s) => sectionMap.set(s.id, s));

    if (asSingleCue) {
      // Un solo cue que contiene todas las diapositivas del arreglo
      const allSlides: string[] = [];
      for (const secId of sequence) {
        const sec = sectionMap.get(secId);
        if (sec) {
          for (const slide of sec.slides) {
            if (slide.trim()) allSlides.push(slide.trim());
          }
        }
      }

      if (allSlides.length === 0) return null;

      const newScene = churchStore.addScene({
        title: `Canción: ${song.title}`,
        type: 'song',
        groupId: 'grp-alabanza',
        style: {
          fontSize: song.theme?.fontSize || 44,
          fontFamily: song.theme?.fontFamily || "'Montserrat', sans-serif",
          textColor: song.theme?.textColor || '#F8FAFC',
          backgroundColor: song.theme?.backgroundColor || '#0B0F19',
          backgroundImageUrl: song.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg',
          textAlign: song.theme?.textAlign || 'center',
          textShadow: true,
          fontWeight: 'medium' as const,
          transition: 'fade' as const,
        },
        content: {
          song: {
            title: song.title,
            author: song.artist || song.author || '',
            slides: allSlides,
            activeSlideIndex: 0,
            songId: song.id,
            arrangementId: arr?.id,
          },
        },
      });

      return [newScene];
    } else {
      // Múltiples cues por sección en el orden del arreglo
      const scenesToAdd = sequence.map((secId, idx) => {
        const sec = sectionMap.get(secId);
        const secLabel = sec?.label || `Parte ${idx + 1}`;
        const secSlides = (sec?.slides || []).filter((s) => s.trim().length > 0);

        return {
          title: `[${secLabel}] ${song.title}`,
          type: 'song' as const,
          groupId: 'grp-alabanza',
          style: {
            fontSize: song.theme?.fontSize || 46,
            fontFamily: song.theme?.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            textColor: song.theme?.textColor || '#FFFFFF',
            backgroundColor: song.theme?.backgroundColor || '#0B0F19',
            backgroundImageUrl: song.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg',
            textAlign: song.theme?.textAlign || 'center',
            textShadow: true,
            fontWeight: 'bold' as const,
            transition: 'fade' as const,
          },
          content: {
            song: {
              title: song.title,
              author: song.artist || song.author || '',
              slides: secSlides.length > 0 ? secSlides : [song.title],
              activeSlideIndex: 0,
              songId: song.id,
              arrangementId: arr?.id,
              sectionId: secId,
              sectionLabel: secLabel,
              sectionType: sec?.type,
            },
          },
        };
      });

      return churchStore.addScenes(scenesToAdd);
    }
  },

  /**
   * Vista previa instantánea de la canción en PREVIEW sin tocar la pantalla LIVE.
   */
  previewSong: (song: ChurchSong, arrangementId?: string, sectionId?: string, slideIndex: number = 0) => {
    let slides: string[] = [];
    let slidesMeta: SongSlideMeta[] = [];
    let sectionLabel: string | undefined;

    if (sectionId) {
      const sec = song.sections.find((s) => s.id === sectionId);
      if (sec) {
        slides = [...sec.slides];
        sectionLabel = sec.label;
        const numMatch = sec.label.match(/\d+/);
        const stanzaNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
        slidesMeta = sec.slides.map((_, idx) => ({
          index: idx,
          sectionId: sec.id,
          sectionType: sec.type,
          sectionLabel: sec.label,
          stanzaNumber,
        }));
      }
    } else {
      const arr = song.arrangements.find((a) => a.id === (arrangementId || song.defaultArrangementId)) || song.arrangements[0];
      const sequence = arr?.sequence || song.sections.map((s) => s.id);
      const secMap = new Map(song.sections.map((s) => [s.id, s]));
      for (const id of sequence) {
        const s = secMap.get(id);
        if (s) {
          const numMatch = s.label.match(/\d+/);
          const stanzaNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
          for (const slide of s.slides) {
            slidesMeta.push({
              index: slides.length,
              sectionId: s.id,
              sectionType: s.type,
              sectionLabel: s.label,
              stanzaNumber,
            });
            slides.push(slide);
          }
        }
      }
    }

    if (slides.length === 0) {
      slides = [song.title];
    }

    const tempScene: Scene = {
      id: `preview-song-${song.id}-${Date.now()}`,
      title: sectionLabel ? `[${sectionLabel}] ${song.title}` : `Canción: ${song.title}`,
      type: 'song',
      order: 0,
      style: {
        fontSize: song.theme?.fontSize || 46,
        fontFamily: song.theme?.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textColor: song.theme?.textColor || '#FFFFFF',
        backgroundColor: song.theme?.backgroundColor || '#0B0F19',
        backgroundImageUrl: song.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg',
        textAlign: song.theme?.textAlign || 'center',
        textShadow: true,
        fontWeight: 'bold' as const,
        transition: 'fade' as const,
      },
      content: {
        song: {
          title: song.title,
          author: song.artist || song.author,
          slides,
          slidesMeta,
          activeSlideIndex: Math.min(slideIndex, Math.max(0, slides.length - 1)),
          songId: song.id,
          sectionLabel,
        },
      },
    };

    presentationStore.setPreviewScene(tempScene);
  },

  /**
   * Emisión directa a LIVE de una canción o sección específica.
   */
  presentSongLive: (song: ChurchSong, arrangementId?: string, sectionId?: string, slideIndex: number = 0) => {
    let slides: string[] = [];
    let slidesMeta: SongSlideMeta[] = [];
    let sectionLabel: string | undefined;

    if (sectionId) {
      const sec = song.sections.find((s) => s.id === sectionId);
      if (sec) {
        slides = [...sec.slides];
        sectionLabel = sec.label;
        const numMatch = sec.label.match(/\d+/);
        const stanzaNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
        slidesMeta = sec.slides.map((_, idx) => ({
          index: idx,
          sectionId: sec.id,
          sectionType: sec.type,
          sectionLabel: sec.label,
          stanzaNumber,
        }));
      }
    } else {
      const arr = song.arrangements.find((a) => a.id === (arrangementId || song.defaultArrangementId)) || song.arrangements[0];
      const sequence = arr?.sequence || song.sections.map((s) => s.id);
      const secMap = new Map(song.sections.map((s) => [s.id, s]));
      for (const id of sequence) {
        const s = secMap.get(id);
        if (s) {
          const numMatch = s.label.match(/\d+/);
          const stanzaNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
          for (const slide of s.slides) {
            slidesMeta.push({
              index: slides.length,
              sectionId: s.id,
              sectionType: s.type,
              sectionLabel: s.label,
              stanzaNumber,
            });
            slides.push(slide);
          }
        }
      }
    }

    if (slides.length === 0) {
      slides = [song.title];
    }

    const tempScene: Scene = {
      id: `live-song-${song.id}-${Date.now()}`,
      title: sectionLabel ? `[${sectionLabel}] ${song.title}` : `Canción: ${song.title}`,
      type: 'song',
      order: 0,
      style: {
        fontSize: song.theme?.fontSize || 46,
        fontFamily: song.theme?.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textColor: song.theme?.textColor || '#FFFFFF',
        backgroundColor: song.theme?.backgroundColor || '#0B0F19',
        backgroundImageUrl: song.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg',
        textAlign: song.theme?.textAlign || 'center',
        textShadow: true,
        fontWeight: 'bold' as const,
        transition: 'fade' as const,
      },
      content: {
        song: {
          title: song.title,
          author: song.artist || song.author,
          slides,
          slidesMeta,
          activeSlideIndex: Math.min(slideIndex, Math.max(0, slides.length - 1)),
          songId: song.id,
          sectionLabel,
        },
      },
    };

    presentationStore.presentSceneDirectly(tempScene);
  },
};

export function useSongStore() {
  return useSyncExternalStore(songStore.subscribe, songStore.getSnapshot);
}
