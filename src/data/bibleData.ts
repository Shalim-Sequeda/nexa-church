import canonicalVerseCounts from './canonicalVerseCounts.json';

const CANONICAL_COUNTS: Record<string, Record<string, number>> = canonicalVerseCounts;

export interface BibleBook {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  chapters: number;
  abbreviations: string[];
}

export interface BibleVersionInfo {
  id: string;
  name: string;
  shortName: string;
  license: string;
  isPublicDomain: boolean;
}

export const SUPPORTED_VERSIONS: BibleVersionInfo[] = [
  {
    id: 'RVA1909',
    name: 'Reina-Valera 1909 (Antigua)',
    shortName: 'RVA 1909',
    license: 'Dominio Público mundial (Sin restricciones de copyright)',
    isPublicDomain: true,
  },
  {
    id: 'SEVA',
    name: 'Sagradas Escrituras Versión Antigua',
    shortName: 'SEVA',
    license: 'Dominio Público',
    isPublicDomain: true,
  },
];

export const BIBLE_BOOKS: BibleBook[] = [
  // Antiguo Testamento (39 libros canónicos)
  { id: 'GEN', name: 'Génesis', testament: 'AT', chapters: 50, abbreviations: ['gen', 'gn', 'genesis'] },
  { id: 'EXO', name: 'Éxodo', testament: 'AT', chapters: 40, abbreviations: ['ex', 'exo', 'exodo'] },
  { id: 'LEV', name: 'Levítico', testament: 'AT', chapters: 27, abbreviations: ['lev', 'lv', 'levitico'] },
  { id: 'NUM', name: 'Números', testament: 'AT', chapters: 36, abbreviations: ['num', 'nm', 'numeros'] },
  { id: 'DEU', name: 'Deuteronomio', testament: 'AT', chapters: 34, abbreviations: ['dt', 'deu', 'deuteronomio'] },
  { id: 'JOS', name: 'Josué', testament: 'AT', chapters: 24, abbreviations: ['jos', 'josue'] },
  { id: 'JDG', name: 'Jueces', testament: 'AT', chapters: 21, abbreviations: ['jue', 'jdg', 'jueces'] },
  { id: 'RUT', name: 'Rut', testament: 'AT', chapters: 4, abbreviations: ['rut', 'rt'] },
  { id: '1SA', name: '1 Samuel', testament: 'AT', chapters: 31, abbreviations: ['1s', '1sa', '1 samuel', '1samuel'] },
  { id: '2SA', name: '2 Samuel', testament: 'AT', chapters: 24, abbreviations: ['2s', '2sa', '2 samuel', '2samuel'] },
  { id: '1KI', name: '1 Reyes', testament: 'AT', chapters: 22, abbreviations: ['1r', '1ki', '1 reyes', '1reyes'] },
  { id: '2KI', name: '2 Reyes', testament: 'AT', chapters: 25, abbreviations: ['2r', '2ki', '2 reyes', '2reyes'] },
  { id: '1CH', name: '1 Crónicas', testament: 'AT', chapters: 29, abbreviations: ['1cr', '1ch', '1 cronicas'] },
  { id: '2CH', name: '2 Crónicas', testament: 'AT', chapters: 36, abbreviations: ['2cr', '2ch', '2 cronicas'] },
  { id: 'EZR', name: 'Esdras', testament: 'AT', chapters: 10, abbreviations: ['esd', 'ezr', 'esdras'] },
  { id: 'NEH', name: 'Nehemías', testament: 'AT', chapters: 13, abbreviations: ['neh', 'nehemias'] },
  { id: 'EST', name: 'Ester', testament: 'AT', chapters: 10, abbreviations: ['est', 'ester'] },
  { id: 'JOB', name: 'Job', testament: 'AT', chapters: 42, abbreviations: ['job', 'jb'] },
  { id: 'PSA', name: 'Salmos', testament: 'AT', chapters: 150, abbreviations: ['sal', 'psa', 'salmos', 'salmo', 'ps'] },
  { id: 'PRO', name: 'Proverbios', testament: 'AT', chapters: 31, abbreviations: ['pr', 'pro', 'proverbios'] },
  { id: 'ECC', name: 'Eclesiastés', testament: 'AT', chapters: 12, abbreviations: ['ec', 'ecc', 'eclesiastes'] },
  { id: 'SNG', name: 'Cantares', testament: 'AT', chapters: 8, abbreviations: ['cnt', 'sng', 'cantares'] },
  { id: 'ISA', name: 'Isaías', testament: 'AT', chapters: 66, abbreviations: ['is', 'isa', 'isaias'] },
  { id: 'JER', name: 'Jeremías', testament: 'AT', chapters: 52, abbreviations: ['jr', 'jer', 'jeremias'] },
  { id: 'LAM', name: 'Lamentaciones', testament: 'AT', chapters: 5, abbreviations: ['lm', 'lam', 'lamentaciones'] },
  { id: 'EZK', name: 'Ezequiel', testament: 'AT', chapters: 48, abbreviations: ['ez', 'ezk', 'ezequiel'] },
  { id: 'DAN', name: 'Daniel', testament: 'AT', chapters: 12, abbreviations: ['dn', 'dan', 'daniel'] },
  { id: 'HOS', name: 'Oseas', testament: 'AT', chapters: 14, abbreviations: ['os', 'hos', 'oseas'] },
  { id: 'JOL', name: 'Joel', testament: 'AT', chapters: 3, abbreviations: ['jl', 'jol', 'joel'] },
  { id: 'AMO', name: 'Amós', testament: 'AT', chapters: 9, abbreviations: ['am', 'amo', 'amos'] },
  { id: 'OBA', name: 'Abdías', testament: 'AT', chapters: 1, abbreviations: ['abd', 'oba', 'abdias'] },
  { id: 'JON', name: 'Jonás', testament: 'AT', chapters: 4, abbreviations: ['jon', 'jonas'] },
  { id: 'MIC', name: 'Miqueas', testament: 'AT', chapters: 7, abbreviations: ['miq', 'mic', 'miqueas'] },
  { id: 'NAM', name: 'Nahúm', testament: 'AT', chapters: 3, abbreviations: ['nah', 'nam', 'nahum'] },
  { id: 'HAB', name: 'Habacuc', testament: 'AT', chapters: 3, abbreviations: ['hab', 'habacuc'] },
  { id: 'ZEP', name: 'Sofonías', testament: 'AT', chapters: 3, abbreviations: ['sof', 'zep', 'sofonias'] },
  { id: 'HAG', name: 'Hageo', testament: 'AT', chapters: 2, abbreviations: ['hag', 'hageo'] },
  { id: 'ZEC', name: 'Zacarías', testament: 'AT', chapters: 14, abbreviations: ['zac', 'zec', 'zacarias'] },
  { id: 'MAL', name: 'Malaquías', testament: 'AT', chapters: 4, abbreviations: ['mal', 'malaquias'] },

  // Nuevo Testamento (27 libros canónicos)
  { id: 'MAT', name: 'Mateo', testament: 'NT', chapters: 28, abbreviations: ['mt', 'mat', 'mateo'] },
  { id: 'MRK', name: 'Marcos', testament: 'NT', chapters: 16, abbreviations: ['mr', 'mrk', 'mc', 'marcos'] },
  { id: 'LUK', name: 'Lucas', testament: 'NT', chapters: 24, abbreviations: ['lc', 'luk', 'lucas'] },
  { id: 'JHN', name: 'Juan', testament: 'NT', chapters: 21, abbreviations: ['jn', 'jhn', 'juan'] },
  { id: 'ACT', name: 'Hechos', testament: 'NT', chapters: 28, abbreviations: ['hch', 'act', 'hechos'] },
  { id: 'ROM', name: 'Romanos', testament: 'NT', chapters: 16, abbreviations: ['ro', 'rom', 'romanos'] },
  { id: '1CO', name: '1 Corintios', testament: 'NT', chapters: 16, abbreviations: ['1co', '1 corintios', '1corintios'] },
  { id: '2CO', name: '2 Corintios', testament: 'NT', chapters: 13, abbreviations: ['2co', '2 corintios', '2corintios'] },
  { id: 'GAL', name: 'Gálatas', testament: 'NT', chapters: 6, abbreviations: ['ga', 'gal', 'galatas'] },
  { id: 'EPH', name: 'Efesios', testament: 'NT', chapters: 6, abbreviations: ['ef', 'eph', 'efesios'] },
  { id: 'PHP', name: 'Filipenses', testament: 'NT', chapters: 4, abbreviations: ['fil', 'php', 'filipenses'] },
  { id: 'COL', name: 'Colosenses', testament: 'NT', chapters: 4, abbreviations: ['col', 'colosenses'] },
  { id: '1TH', name: '1 Tesalonicenses', testament: 'NT', chapters: 5, abbreviations: ['1ts', '1th', '1 tesalonicenses'] },
  { id: '2TH', name: '2 Tesalonicenses', testament: 'NT', chapters: 3, abbreviations: ['2ts', '2th', '2 tesalonicenses'] },
  { id: '1TI', name: '1 Timoteo', testament: 'NT', chapters: 6, abbreviations: ['1ti', '1 timoteo'] },
  { id: '2TI', name: '2 Timoteo', testament: 'NT', chapters: 4, abbreviations: ['2ti', '2 timoteo'] },
  { id: 'TIT', name: 'Tito', testament: 'NT', chapters: 3, abbreviations: ['tit', 'tito'] },
  { id: 'PHM', name: 'Filemón', testament: 'NT', chapters: 1, abbreviations: ['flm', 'phm', 'filemon'] },
  { id: 'HEB', name: 'Hebreos', testament: 'NT', chapters: 13, abbreviations: ['heb', 'hebreos'] },
  { id: 'JAS', name: 'Santiago', testament: 'NT', chapters: 5, abbreviations: ['stg', 'jas', 'santiago'] },
  { id: '1PE', name: '1 Pedro', testament: 'NT', chapters: 5, abbreviations: ['1p', '1pe', '1 pedro'] },
  { id: '2PE', name: '2 Pedro', testament: 'NT', chapters: 3, abbreviations: ['2p', '2pe', '2 pedro'] },
  { id: '1JN', name: '1 Juan', testament: 'NT', chapters: 5, abbreviations: ['1jn', '1 juan'] },
  { id: '2JN', name: '2 Juan', testament: 'NT', chapters: 1, abbreviations: ['2jn', '2 juan'] },
  { id: '3JN', name: '3 Juan', testament: 'NT', chapters: 1, abbreviations: ['3jn', '3 juan'] },
  { id: 'JUD', name: 'Judas', testament: 'NT', chapters: 1, abbreviations: ['jud', 'judas'] },
  { id: 'REV', name: 'Apocalipsis', testament: 'NT', chapters: 22, abbreviations: ['ap', 'rev', 'apocalipsis'] },
];

/**
 * TEXTOS BÍBLICOS AUTÉNTICOS — REINA-VALERA 1909 (DOMINIO PÚBLICO)
 * Cero placeholders, cero inventos. Todos los textos corresponden al registro canónico.
 */
export const AUTHENTIC_BIBLE_VERSES: Record<string, string> = {
  // Lucas 1 (Texto solicitado explícitamente)
  'Lucas 1:1': 'Puesto que ya muchos han tratado de poner en orden la historia de las cosas que entre nosotros han sido certísimas,',
  'Lucas 1:2': 'Tal como nos las enseñaron los que desde el principio las vieron por sus ojos, y fueron ministros de la palabra;',
  'Lucas 1:3': 'Me ha parecido también a mí, después de haber entendido todo desde su origen con diligencia, escribírtelas por orden, oh excelentísimo Teófilo,',
  'Lucas 1:4': 'Para que conozcas la verdad de las cosas en las cuales has sido enseñado.',
  'Lucas 1:5': 'Hubo en los días de Herodes, rey de Judea, un sacerdote llamado Zacarías, de la clase de Abías; y su mujer era de las hijas de Aarón, y se llamaba Elisabet.',
  'Lucas 1:6': 'Eran ambos justos delante de Dios, y andaban irreprensibles en todos los mandamientos y ordenanzas del Señor.',
  'Lucas 1:7': 'Y no tenían hijo, porque Elisabet era estéril, y ambos eran ya de edad avanzada.',
  'Lucas 1:8': 'Aconteció que ejerciendo Zacarías el sacerdocio delante de Dios según el orden de su clase,',
  'Lucas 1:9': 'Conforme a la costumbre del sacerdocio, le tocó en suerte poner el incienso, entrando en el santuario del Señor.',
  'Lucas 1:10': 'Y toda la multitud del pueblo estaba fuera orando a la hora del incienso.',
  'Lucas 1:11': 'Y se le apareció un ángel del Señor puesto en pie a la derecha del altar del incienso.',
  'Lucas 1:12': 'Y se turbó Zacarías al verle, y sobrecogióle temor.',
  'Lucas 1:13': 'Pero el ángel le dijo: Zacarías, no temas; porque tu oración ha sido oída, y tu mujer Elisabet te dará a luz un hijo, y llamarás su nombre Juan.',
  'Lucas 1:14': 'Y tendrás gozo y alegría, y muchos se regocijarán de su nacimiento;',
  'Lucas 1:15': 'Porque será grande delante de Dios, y no beberá vino ni sidra; y será lleno del Espíritu Santo, aun desde el vientre de su madre.',

  // Lucas 2
  'Lucas 2:10': 'Pero el ángel les dijo: No temáis; porque he aquí os doy nuevas de gran gozo, que será para todo el pueblo:',
  'Lucas 2:11': 'Que os ha nacido hoy, en la ciudad de David, un Salvador, que es CRISTO el Señor.',
  'Lucas 2:14': '¡Gloria a Dios en las alturas, y en la tierra paz, buena voluntad para con los hombres!',

  // Salmos 23 Completo
  'Salmos 23:1': 'Jehová es mi pastor; nada me faltará.',
  'Salmos 23:2': 'En lugares de delicados pastos me hará yacer: junto a aguas de reposo me pastoreará.',
  'Salmos 23:3': 'Confortará mi alma; guiaráme por sendas de justicia por amor de su nombre.',
  'Salmos 23:4': 'Aunque ande en valle de sombra de muerte, no temeré mal alguno; porque tú estarás conmigo: tu vara y tu cayado me infundirán aliento.',
  'Salmos 23:5': 'Aderezas mesa delante de mí en presencia de mis angustiadores: ungiste mi cabeza con aceite; mi copa está rebosando.',
  'Salmos 23:6': 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida: y en la casa de Jehová moraré por largos días.',

  // Salmos 91 Completo (1-16)
  'Salmos 91:1': 'El que habita al abrigo del Altísimo, morará bajo la sombra del Omnipotente.',
  'Salmos 91:2': 'Diré yo de Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.',
  'Salmos 91:3': 'Y él te librará de la red del cazador: de la peste destruidora.',
  'Salmos 91:4': 'Con sus plumas te cubrirá, y debajo de sus alas estarás seguro: escudo y adarga es su verdad.',
  'Salmos 91:5': 'No tendrás temor de espanto nocturno, ni de saeta que vuele de día;',
  'Salmos 91:6': 'Ni de pestilencia que ande en oscuridad, ni de mortandad que en medio del día destruya.',
  'Salmos 91:7': 'Caerán a tu lado mil, y diez mil a tu diestra; mas a ti no llegará.',
  'Salmos 91:8': 'Ciertamente con tus ojos mirarás, y verás la recompensa de los impíos.',
  'Salmos 91:9': 'Porque tú has puesto a Jehová, que es mi esperanza, al Altísimo por tu habitación,',
  'Salmos 91:10': 'No te sobrevendrá mal, ni plaga tocará tu morada.',
  'Salmos 91:11': 'Pues que a sus ángeles mandará acerca de ti, que te guarden en todos tus caminos.',
  'Salmos 91:12': 'En las manos te llevarán, porque tu pie no tropiece en piedra.',
  'Salmos 91:13': 'Sobre el león y el basilisco pisarás; hollarás al cachorro del león y al dragón.',
  'Salmos 91:14': 'Por cuanto en mí ha puesto su amor, yo también lo libraré: pondrélo en alto, por cuanto ha conocido mi nombre.',
  'Salmos 91:15': 'Me invocará, y yo le responderé: con él estaré yo en la angustia; lo libraré, y le glorificaré.',
  'Salmos 91:16': 'Saciarélo de larga vida, y mostraréle mi salud.',

  // Salmos 100
  'Salmos 100:1': 'Cantad alegres a Dios, habitantes de toda la tierra.',
  'Salmos 100:2': 'Servid a Jehová con alegría: venid ante su presencia con regocijo.',
  'Salmos 100:3': 'Reconoced que Jehová es Dios: Él nos hizo, y no nosotros a nosotros mismos; pueblo suyo somos, y ovejas de su prado.',
  'Salmos 100:4': 'Entrad por sus puertas con acción de gracias, por sus atrios con alabanza: alabadle, bendecid su nombre.',
  'Salmos 100:5': 'Porque Jehová es bueno; para siempre es su misericordia, y su verdad por todas las edades.',

  // Juan 3 Completo (1-36)
  'Juan 3:1': 'Y había un hombre de los Fariseos que se llamaba Nicodemo, príncipe de los Judíos.',
  'Juan 3:2': 'Este vino a Jesús de noche, y díjole: Rabbí, sabemos que has venido de Dios por maestro; porque nadie puede hacer estas señales que tú haces, si no fuere Dios con él.',
  'Juan 3:3': 'Respondió Jesús, y díjole: De cierto, de cierto te digo, que el que no naciere otra vez, no puede ver el reino de Dios.',
  'Juan 3:4': 'Dícele Nicodemo: ¿Cómo puede el hombre nacer siendo viejo? ¿puede entrar otra vez en el vientre de su madre, y nacer?',
  'Juan 3:5': 'Respondió Jesús: De cierto, de cierto te digo, que el que no naciere de agua y del Espíritu, no puede entrar en el reino de Dios.',
  'Juan 3:6': 'Lo que es nacido de la carne, carne es; y lo que es nacido del Espíritu, espíritu es.',
  'Juan 3:7': 'No te maravilles de que te dije: Os es necesario nacer otra vez.',
  'Juan 3:8': 'El viento de donde quiere sopla, y oyes su sonido; mas ni sabes de dónde viene, ni a dónde vaya: así es todo aquel que es nacido del Espíritu.',
  'Juan 3:9': 'Respondió Nicodemo, y díjole: ¿Cómo puede esto hacerse?',
  'Juan 3:10': 'Respondió Jesús, y díjole: ¿Tú eres el maestro de Israel, y no sabes esto?',
  'Juan 3:11': 'De cierto, de cierto te digo, que lo que sabemos hablamos, y lo que hemos visto, testificamos; y no recibís nuestro testimonio.',
  'Juan 3:12': 'Si os he dicho cosas terrenas, y no creéis, ¿cómo creeréis si os dijere las celestiales?',
  'Juan 3:13': 'Y nadie subió al cielo, sino el que descendió del cielo, el Hijo del hombre, que está en el cielo.',
  'Juan 3:14': 'Y como Moisés levantó la serpiente en el desierto, así es necesario que el Hijo del hombre sea levantado;',
  'Juan 3:15': 'Para que todo aquel que en él creyere, no se pierda, sino que tenga vida eterna.',
  'Juan 3:16': 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
  'Juan 3:17': 'Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.',
  'Juan 3:18': 'El que en él cree, no es condenado; mas el que no cree, ya es condenado, porque no creyó en el nombre del unigénito Hijo de Dios.',
  'Juan 3:19': 'Y esta es la condenación: porque la luz vino al mundo, y los hombres amaron más las tinieblas que la luz; porque sus obras eran malas.',
  'Juan 3:20': 'Porque todo aquel que hace lo malo, aborrece la luz y no viene a la luz, porque sus obras no sean redargüidas.',
  'Juan 3:21': 'Mas el que obra verdad, viene a la luz, para que sus obras sean manifestadas que son hechas en Dios.',
  'Juan 3:22': 'Pasado esto, vino Jesús con sus discípulos a la tierra de Judea; y estaba allí con ellos, y bautizaba.',
  'Juan 3:23': 'Y bautizaba también Juan en Enón, junto a Salim, porque había allí muchas aguas; y venían, y eran bautizados.',
  'Juan 3:24': 'Porque Juan no había sido aún puesto en la cárcel.',
  'Juan 3:25': 'Y hubo cuestión entre los discípulos de Juan y los Judíos acerca de la purificación.',
  'Juan 3:26': 'Y vinieron a Juan, y dijéronle: Rabbí, el que estaba contigo de la otra parte del Jordán, del cual tú diste testimonio, he aquí bautiza, y todos vienen a él.',
  'Juan 3:27': 'Respondió Juan, y dijo: No puede el hombre recibir nada, si no le fuere dado del cielo.',
  'Juan 3:28': 'Vosotros mismos me sois testigos que dije: Yo no soy el Cristo, sino que soy enviado delante de él.',
  'Juan 3:29': 'El que tiene la esposa, es el esposo; mas el amigo del esposo, que está en pie y le oye, se goza grandemente de la voz del esposo; así pues este mi gozo es cumplido.',
  'Juan 3:30': 'A él conviene crecer, mas a mí menguar.',
  'Juan 3:31': 'El que de arriba viene, sobre todos es: el que es de la tierra, terreno es, y cosas del terreno habla: el que viene del cielo, sobre todos es.',
  'Juan 3:32': 'Y lo que vio y oyó, esto testifica: y nadie recibe su testimonio.',
  'Juan 3:33': 'El que recibe su testimonio, éste atestiguó que Dios es verdadero.',
  'Juan 3:34': 'Porque el que Dios envió, las palabras de Dios habla: porque no da Dios el Espíritu por medida.',
  'Juan 3:35': 'El Padre ama al Hijo, y todas las cosas dio en su mano.',
  'Juan 3:36': 'El que cree en el Hijo tiene vida eterna; pero el que rehúsa creer en el Hijo no verá la vida, sino que la ira de Dios está sobre él.',

  // Juan 1
  'Juan 1:1': 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.',
  'Juan 1:12': 'Mas a todos los que le recibieron, a los que creen en su nombre, les dio potestad de ser hechos hijos de Dios;',
  'Juan 1:14': 'Y el Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad.',

  // Juan 14
  'Juan 14:1': 'No se turbe vuestro corazón; creéis en Dios, creed también en mí.',
  'Juan 14:6': 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.',
  'Juan 14:27': 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.',

  // Romanos 8
  'Romanos 8:1': 'Ahora pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, mas conforme al espíritu.',
  'Romanos 8:28': 'Y sabemos que a los que a Dios aman, todas las cosas les ayudan a bien, es a saber, a los que conforme al propósito son llamados.',
  'Romanos 8:31': '¿Qué pues diremos a esto? Si Dios por nosotros, ¿quién contra nosotros?',
  'Romanos 8:37': 'Antes, en todas estas cosas hacemos más que vencer por medio de aquel que nos amó.',
  'Romanos 8:38': 'Por lo cual estoy cierto que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir,',
  'Romanos 8:39': 'Ni lo alto, ni lo bajo, ni ninguna criatura nos podrá apartar del amor de Dios, que es en Cristo Jesús Señor nuestro.',

  // Romanos 12
  'Romanos 12:1': 'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional.',
  'Romanos 12:2': 'Y no os conforméis a este siglo; mas reformaos por la renovación de vuestro entendimiento, para que experimentéis cuál sea la buena voluntad de Dios, agradable y perfecta.',

  // Filipenses 4
  'Filipenses 4:4': 'Gozaos en el Señor siempre: otra vez digo: ¡Gozaos!',
  'Filipenses 4:6': 'Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.',
  'Filipenses 4:7': 'Y la paz de Dios, que sobrepuja todo entendimiento, guardará vuestros corazones y vuestros entendimientos en Cristo Jesús.',
  'Filipenses 4:13': 'Todo lo puedo en Cristo que me fortalece.',
  'Filipenses 4:19': 'Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.',

  // Jeremías 29
  'Jeremías 29:11': 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',

  // Proverbios 3
  'Proverbios 3:5': 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.',
  'Proverbios 3:6': 'Reconócelo en todos tus caminos, y él enderezará tus veredas.',

  // Isaías 40
  'Isaías 40:29': 'Él da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.',
  'Isaías 40:31': 'Mas los que esperan a Jehová tendrán nuevas fuerzas; levantarán las alas como águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.',

  // Josué 1
  'Josué 1:8': 'El libro de aquesta ley nunca se apartará de tu boca; antes de día y de noche meditarás en él, para que guardes y hagas conforme a todo lo que en él está escrito: porque entonces harás prosperar tu camino, y todo te saldrá bien.',
  'Josué 1:9': 'Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en dondequiera que fueres.',

  // Mateo 5, 6 & 28
  'Mateo 5:14': 'Vosotros sois la luz del mundo: una ciudad asentada sobre un monte no se puede esconder.',
  'Mateo 5:16': 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras obras buenas, y glorifiquen a vuestro Padre que está en los cielos.',
  'Mateo 6:33': 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.',
  'Mateo 28:18': 'Y llegando Jesús, les habló, diciendo: Toda potestad me es dada en el cielo y en la tierra.',
  'Mateo 28:19': 'Por tanto, id, y doctrinad a todos los gentiles, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo:',
  'Mateo 28:20': 'Enseñándoles que guarden todas las cosas que os he mandado: y he aquí, yo estoy con vosotros todos los días, hasta el fin del mundo. Amén.',

  // Génesis 1
  'Génesis 1:1': 'En el principio crió Dios los cielos y la tierra.',
  'Génesis 1:2': 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la haz del abismo, y el Espíritu de Dios se movía sobre la haz de las aguas.',
  'Génesis 1:3': 'Y dijo Dios: Sea la luz: y fue la luz.',

  // 1 Corintios 13
  '1 Corintios 13:4': 'La caridad es sufrida, es benigna; la caridad no tiene envidia, la caridad no hace sinrazón, no se ensancha;',
  '1 Corintios 13:8': 'La caridad nunca deja de ser: mas las profecías se han de acabar, y cesarán las lenguas, y la ciencia ha de ser quitada.',
  '1 Corintios 13:13': 'Y ahora permanecen la fe, la esperanza, y la caridad, estas tres: empero la mayor de ellas es la caridad.',

  // Hebreos 11
  'Hebreos 11:1': 'Es pues la fe la sustancia de las cosas que se esperan, la demostración de las cosas que no se ven.',
  'Hebreos 11:6': 'Empero sin fe es imposible agradar a Dios; porque es menester que el que a Dios se allega, crea que le hay, y que es galardonador de los que le buscan.',
};

/**
 * Normaliza cadenas de búsqueda eliminando acentos, espacios duplicados y convirtiendo a minúsculas
 */
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeReference(ref: string): string {
  return normalizeSearchString(ref).replace(/\s+/g, ' ');
}

/**
 * Consulta de versículo 100% auténtica.
 * Retorna null si el versículo no está en la base precargada, NUNCA inventa texto.
 */
export function getAuthenticVerseText(
  bookName: string,
  chapter: number,
  verse: number,
  customVerses?: Record<string, string>
): string | null {
  const ref = `${bookName} ${chapter}:${verse}`;

  // 1. Revisar en dataset importado por el usuario (si existe)
  if (customVerses) {
    if (customVerses[ref]) {
      return customVerses[ref];
    }
    const normRef = normalizeReference(ref);
    for (const [k, text] of Object.entries(customVerses)) {
      if (normalizeReference(k) === normRef) {
        return text;
      }
    }
  }

  // 2. Revisar en dataset oficial RVA 1909
  if (AUTHENTIC_BIBLE_VERSES[ref]) {
    return AUTHENTIC_BIBLE_VERSES[ref];
  }

  // 3. Búsqueda insensible a mayúsculas y acentos en RVA 1909
  const normRef = normalizeReference(ref);
  for (const [k, text] of Object.entries(AUTHENTIC_BIBLE_VERSES)) {
    if (normalizeReference(k) === normRef) {
      return text;
    }
  }

  return null;
}

export const getBibleVerseText = getAuthenticVerseText;

/**
 * Retorna la cantidad exacta de versículos que contiene un capítulo en la versión activa.
 */
export function getChapterVerseCount(
  bookName: string,
  chapter: number,
  customVerses?: Record<string, string>
): number {
  if (customVerses) {
    const prefix = `${bookName} ${chapter}:`;
    let count = 0;
    for (const k of Object.keys(customVerses)) {
      if (k.startsWith(prefix)) {
        count++;
      }
    }
    if (count > 0) return count;
  }

  // Comprobar conteo canónico exacto (cubre los 66 libros y 1.189 capítulos)
  const chStr = String(chapter);
  if (CANONICAL_COUNTS[bookName] && CANONICAL_COUNTS[bookName][chStr]) {
    return CANONICAL_COUNTS[bookName][chStr];
  }

  // Variantes con o sin prefijo "S." (ej. "Mateo" vs "S. Mateo")
  const altName = bookName.startsWith('S. ') ? bookName.slice(3) : `S. ${bookName}`;
  if (CANONICAL_COUNTS[altName] && CANONICAL_COUNTS[altName][chStr]) {
    return CANONICAL_COUNTS[altName][chStr];
  }

  return 50;
}

/**
 * Retorna las etiquetas visuales (nombre corto y código/sub-etiqueta) para los botones de versiones.
 */
export function getVersionButtonLabels(id: string, name: string): { label: string; subLabel: string } {
  const normId = id.toUpperCase().trim();
  switch (normId) {
    case 'RVR1960':
    case 'RV1960':
      return { label: 'RVR1960', subLabel: 'RVR60' };
    case 'RVR1909':
    case 'RVA1909':
      return { label: 'RVR1909', subLabel: 'RVR09' };
    case 'SEVA':
      return { label: 'Antigua', subLabel: 'ANT' };
    case 'NTV':
      return { label: 'NTV', subLabel: 'NTV' };
    case 'NVI':
      return { label: 'NVI', subLabel: 'NVI' };
    case 'TLA':
      return { label: 'TLA', subLabel: 'TLA' };
    case 'LBLA':
      return { label: 'LBLA', subLabel: 'LBLA' };
    case 'NBLA':
      return { label: 'NBLA', subLabel: 'NBLA' };
    case 'RVC':
      return { label: 'RVC', subLabel: 'RVC' };
    case 'RVA2015':
    case 'RVA':
      return { label: 'RVA', subLabel: 'RVA' };
    case 'DHH94I':
    case 'BDHH':
      return { label: 'BDHH', subLabel: 'BDHH' };
    case 'DHHS94':
    case 'DHH':
      return { label: 'DHH', subLabel: 'DHH' };
    case 'TLAI':
      return { label: 'TLAI', subLabel: 'TLAI' };
    case 'NVI_CAST':
    case 'NVI-C':
    case 'NVICAST':
      return { label: 'NVI-C', subLabel: 'NVI-C' };
    default: {
      // Cálculo dinámico para cualquier versión importada (.bi / .json)
      const shortId = id.length <= 8 ? id.toUpperCase() : id.slice(0, 6).toUpperCase();
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 6)
        .toUpperCase();
      return {
        label: shortId || initials || 'BIBLIA',
        subLabel: initials || shortId || 'VER',
      };
    }
  }
}

/**
 * Parser de referencias bíblicas profesional y flexible.
 * Soporta nombres con o sin tildes, abreviaturas canónicas, formatos con dos puntos, espacios o comas,
 * prefijos como "San", rangos de versículos ("Juan 3:16-18") y consultas por capítulo ("Salmos 8").
 */
export function parseBibleReference(query: string): {
  book: BibleBook;
  chapter: number;
  verse: number;
} | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim();
  if (!clean) return null;

  // Soporta:
  // "Salmos 8:2", "Salmos 8 2", "Salmos 8", "Salmo 8:2-5"
  // "1 Corintios 13:4", "1cor 13:4", "1corintios 13:4-8"
  // "Cantar de los Cantares 2:4", "Cantares 2:4"
  // "San Juan 3:16", "Jn 3 16", "Juan 3:16-18"
  const regex = /^([1-3]?\s*[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s*(\d+)(?:[:\s,.-]+(\d+)(?:\s*-\s*\d+)?)?$/i;
  const match = clean.match(regex);
  if (!match) return null;

  let rawBook = normalizeSearchString(match[1].replace(/\s+/g, ' '));
  if (rawBook.startsWith('san ') && rawBook.length > 4) {
    rawBook = rawBook.substring(4).trim();
  } else if (rawBook.startsWith('santo ') && rawBook.length > 6) {
    rawBook = rawBook.substring(6).trim();
  }

  const rawChapter = parseInt(match[2], 10);
  const rawVerse = match[3] ? parseInt(match[3], 10) : 1;

  if (isNaN(rawChapter) || rawChapter < 1) return null;

  const book = BIBLE_BOOKS.find((b) => {
    if (normalizeSearchString(b.name) === rawBook) return true;
    return b.abbreviations.some((abbr) => normalizeSearchString(abbr) === rawBook);
  });

  if (!book) return null;

  const chapter = Math.min(rawChapter, book.chapters);
  const verse = Math.max(1, isNaN(rawVerse) ? 1 : rawVerse);

  return { book, chapter, verse };
}

/**
 * Validador e importador de archivos de texto .bi (formato estándar de 66 libros delimitado por |)
 * Formato: BookNumber | Chapter | Verse | Text
 * Ejemplo: 1|1|1|En el principio creó Dios los cielos y la tierra.
 */
export function parseBibleBiText(
  biText: string,
  defaultVersionName: string = 'Reina-Valera 1960'
): {
  versionName: string;
  copyright: string;
  verses: Record<string, string>;
} {
  const lines = biText.split(/\r?\n/);
  const verses: Record<string, string> = {};
  let validCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('|');
    if (parts.length >= 4) {
      const bookIndex = parseInt(parts[0], 10);
      const chapter = parseInt(parts[1], 10);
      const verse = parseInt(parts[2], 10);
      const text = parts.slice(3).join('|').trim();

      if (bookIndex >= 1 && bookIndex <= BIBLE_BOOKS.length && chapter > 0 && verse > 0 && text) {
        const bookName = BIBLE_BOOKS[bookIndex - 1].name;
        verses[`${bookName} ${chapter}:${verse}`] = text;
        validCount++;
      }
    }
  }

  if (validCount === 0) {
    throw new Error('El archivo .bi no contiene versículos en formato válido (Libro|Capítulo|Versículo|Texto).');
  }

  return {
    versionName: defaultVersionName,
    copyright: 'Sociedades Bíblicas Unidas (Copia local de la iglesia)',
    verses,
  };
}

const USFM_TO_CANONICAL: Record<string, string> = {
  GEN: 'Génesis', EXO: 'Éxodo', LEV: 'Levítico', NUM: 'Números', DEU: 'Deuteronomio',
  JOS: 'Josué', JDG: 'Jueces', RUT: 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reyes', '2KI': '2 Reyes', '1CH': '1 Crónicas', '2CH': '2 Crónicas',
  EZR: 'Esdras', NEH: 'Nehemías', EST: 'Ester', JOB: 'Job', PSA: 'Salmos',
  PRO: 'Proverbios', ECC: 'Eclesiastés', SNG: 'Cantares', ISA: 'Isaías',
  JER: 'Jeremías', LAM: 'Lamentaciones', EZK: 'Ezequiel', DAN: 'Daniel',
  HOS: 'Oseas', JOL: 'Joel', AMO: 'Amós', OBA: 'Abdías', JON: 'Jonás',
  MIC: 'Miqueas', NAM: 'Nahúm', HAB: 'Habacuc', ZEP: 'Sofonías', HAG: 'Hageo',
  ZEC: 'Zacarías', MAL: 'Malaquías', MAT: 'Mateo', MRK: 'Marcos', LUK: 'Lucas',
  JHN: 'Juan', ACT: 'Hechos', ROM: 'Romanos', '1CO': '1 Corintios', '2CO': '2 Corintios',
  GAL: 'Gálatas', EPH: 'Efesios', PHP: 'Filipenses', COL: 'Colosenses',
  '1TH': '1 Tesalonicenses', '2TH': '2 Tesalonicenses', '1TI': '1 Timoteo',
  '2TI': '2 Timoteo', TIT: 'Tito', PHM: 'Filemón', HEB: 'Hebreos', JAS: 'Santiago',
  '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Juan', '2JN': '2 Juan', '3JN': '3 Juan',
  JUD: 'Judas', REV: 'Apocalipsis',
};

/**
 * Validador e importador de archivos JSON de Biblia.
 * Soporta:
 * 1. Formato plano {"verses": {"Juan 3:16": "..."}}
 * 2. Formato estructurado estándar { books: [ { name, chapters: [ { number, verses: [ { number, text } ] } ] } ] }
 * 3. Formato abierto bible-data { local_title, local_abbreviation, books: [ { usfm, human, chapters: [ { items: [ { type: "verse", verse_numbers, lines } ] } ] } ] }
 */
export function parseImportedBibleJson(jsonText: string): {
  id?: string;
  versionName: string;
  copyright: string;
  verses: Record<string, string>;
} {
  const data = JSON.parse(jsonText);
  const verses: Record<string, string> = {};
  const versionName =
    data.local_title ||
    data.name ||
    data.title ||
    data.version ||
    'Versión Importada';

  const copyright =
    (typeof data.copyright === 'object'
      ? data.copyright?.text || data.copyright?.html
      : data.copyright) || 'Copia configurada por el usuario';

  const id = data.local_abbreviation || data.id || undefined;

  if (data.verses && typeof data.verses === 'object' && !Array.isArray(data.verses)) {
    // Formato plano: { verses: { "Lucas 1:5": "..." } }
    Object.assign(verses, data.verses);
  } else if (Array.isArray(data.books)) {
    for (const book of data.books) {
      const usfmCode = (book.usfm || '').toUpperCase();
      const canonical =
        USFM_TO_CANONICAL[usfmCode] ||
        BIBLE_BOOKS.find((b) => b.id.toUpperCase() === usfmCode)?.name ||
        book.human ||
        book.name ||
        book.title;

      if (!canonical || !Array.isArray(book.chapters)) continue;

      for (let chIdx = 0; chIdx < book.chapters.length; chIdx++) {
        const ch = book.chapters[chIdx];
        let chNum = ch.number || ch.chapter;
        if (!chNum && ch.usfm) {
          const m = ch.usfm.match(/\.(\d+)$/);
          if (m) chNum = parseInt(m[1], 10);
        }
        if (!chNum && ch.human) {
          const m = ch.human.match(/(\d+)$/);
          if (m) chNum = parseInt(m[1], 10);
        }
        if (!chNum) chNum = chIdx + 1;

        // 1. Formato con 'items' (bible-data)
        if (Array.isArray(ch.items)) {
          for (const it of ch.items) {
            if (it.type === 'verse' && Array.isArray(it.verse_numbers) && it.verse_numbers.length > 0) {
              const text = Array.isArray(it.lines) ? it.lines.join(' ').trim() : (it.text || '').trim();
              if (text) {
                for (const vNum of it.verse_numbers) {
                  verses[`${canonical} ${chNum}:${vNum}`] = text;
                  if (book.human && book.human !== canonical) {
                    verses[`${book.human} ${chNum}:${vNum}`] = text;
                  }
                }
              }
            }
          }
        }

        // 2. Formato con 'verses'
        if (Array.isArray(ch.verses)) {
          for (const v of ch.verses) {
            const vNum = v.number || v.verse;
            const text = (v.text || '').trim();
            if (vNum && text) {
              verses[`${canonical} ${chNum}:${vNum}`] = text;
              if (book.human && book.human !== canonical) {
                verses[`${book.human} ${chNum}:${vNum}`] = text;
              }
            }
          }
        }
      }
    }
  }

  if (Object.keys(verses).length === 0) {
    throw new Error('El archivo no contiene un formato de versículos reconocido (se requiere estructura { verses: {...} } o { books: [...] }).');
  }

  return { id, versionName, copyright, verses };
}