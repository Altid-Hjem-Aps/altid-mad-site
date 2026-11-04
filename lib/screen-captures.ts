// Every picture of the app on this site, and the scenes built from them.
//
// The pictures come from a capture run of the real app (scripts/build-app-screens.mjs)
// and follow Thor's approved board, row by row (site-captures/boards/board-altidmad*.png
// and MAPPING.md). A picture is invisible to the copy tests, so
// test/screen-captures.test.tsx holds this list to what somebody has looked at.
//
// Every kroner figure in these frames comes from staged shelf prices and is example
// data, not a claim. The caption near the first phone on a page says so. The 11.207 kr.
// on mad.welcome.1 is the app's own documented claim and carries its report footnote.
//
// Two staged households: mad.flow.* is 2 voksne + 2 børn, dinners, 6.650 kr./md.;
// mad.home, .meal_plan, .shopping_list and .trip are 2 + 1, all meals, another budget.
//
// Not on this list, and why:
//   mad.savings              seeded savings figures; never on the site (Thor, on the board)
//   mad.home.scrolled, .full show the seeded "Ugens besparelse 96 kr."
//   mad.flow.11_basics       a list of the app's photo placeholders
//   mad.flow.12_optimise     recommends Bilka alone; the board's row is about splitting
//                            across stores, which is 12b_cheapest in the one-budget run
//   mad.recipe               quantities for 4 while the header says 3; no board row
const FRAME = { width: 720, height: 1561 } as const

const frame = (id: string, source = `v1.0.3 sim/mad/${id}`) => ({ file: `/app-screens/${id}.webp`, source, ...FRAME })

export const SCREENS = {
  'mad.meal_plan': frame('mad.meal_plan'),
  'mad.trip': frame('mad.trip'),
  'mad.trip.in_progress': frame('mad.trip.in_progress'),
  'mad.meal_plan.scrolled': frame('mad.meal_plan.scrolled', 'v1.0.3 sim/mad/mad.meal_plan.scrolled, below the cut-off number, status bar from mad.meal_plan'),
  'mad.flow.1_tastes': frame('mad.flow.1_tastes'),
  'mad.flow.4_household': frame('mad.flow.4_household'),
  'mad.flow.2_avoid': frame('mad.flow.2_avoid'),
  'mad.flow.6_budget': frame('mad.flow.6_budget'),
  'mad.welcome.1': frame('mad.welcome.1'),
  'mad.flow.8_building': frame('mad.flow.8_building'),
  'mad.flow.9_week_plan': frame('mad.flow.9_week_plan'),
  'mad.meal_plan.swap_picker': frame('mad.meal_plan.swap_picker', 'v1.0.3 sim/mad/mad.meal_plan.swap_picker, without the budget figure peeking out above the sheet'),
  'mad.flow.14_done': frame('mad.flow.14_done', 'v1.0.3 sim/mad/mad.flow.14_done, without the figure below the title'),
  'mad.shopping_list': frame('mad.shopping_list'),
  'mad.trip.replace_sheet': frame('mad.trip.replace_sheet'),
  'mad.flow.11b_others': frame('mad.flow.11b_others'),
  'mad.flow.12b_cheapest': frame('mad.flow.12b_cheapest'),
  'mad.flow.13_combinations': frame('mad.flow.13_combinations'),
  'mad.welcome.3': frame('mad.welcome.3'),
  'mad.flow.6_budget.3000': frame('mad.flow.6_budget.3000'),
  'mad.welcome.4': frame('mad.welcome.4'),
  'mad.home': frame('mad.home'),
} as const

export type ScreenId = keyof typeof SCREENS

/** A rectangle in the pixels of the frame's manifest entry. */
export type Region = { x: number; y: number; w: number; h: number }

/** Part of another frame fades in over this one: the same screen a moment later, so
 *  it lines up exactly. A tick landing, a number changing. */
export type Reveal = { from: ScreenId; region: Region; at: number }

/** A button on the frame dips the way a finger would press it. */
export type Press = { region: Region; at: number; tone: 'on-dark' | 'on-light' }

export type Beat = {
  frame: ScreenId
  /** Ms into the scene when this frame takes over. */
  at: number
  alt: string
  reveals?: Reveal[]
  press?: Press
  /** The frame states the report's savings figure, so the footnote stands by the phone. */
  reportNote?: boolean
}

export type FlowScene = {
  key: string
  /** The dot's label for a screen reader. */
  label: string
  ms: number
  beats: Beat[]
  /** No phone: the app icon, not a dot step. */
  opener?: boolean
}

/** Near the first phone on a page. */
export const SAMPLE_DATA_CAPTION = 'Skærmbilleder fra appen med eksempeldata.'

export const HERO_LABEL = 'Altid Mad i appen Altid Hjem: ugens madplan, indkøbsturen og dagens retter'
/** Foreground, back left, back right; the same order on the phone carousel. */
export const HERO_FRAMES: ScreenId[] = ['mad.meal_plan', 'mad.trip.in_progress', 'mad.meal_plan.scrolled']

// The dark button at the foot of a flow step, with no tab bar below it and with one.
const BUTTON_FOOT: Region = { x: 37, y: 1368, w: 646, h: 101 }
const BUTTON_ABOVE_TABS: Region = { x: 37, y: 1282, w: 646, h: 101 }
const DONE_BUTTON: Region = { x: 44, y: 1374, w: 632, h: 95 }

export const APP_ICON_SCENE: FlowScene = { key: 'appikon', label: 'Altid Hjem', ms: 3600, beats: [], opener: true }

// The scene lengths and dots are today's, from the animated stories these frames replace.
export const MADPLAN_SCENES: FlowScene[] = [
  {
    key: 'prefs',
    label: 'Jeres smag',
    ms: 3600,
    beats: [{
      frame: 'mad.flow.1_tastes',
      at: 0,
      alt: 'Spørgsmålet om, hvad der passer til jer, med valgene Børnevenligt og Hurtige retter',
      press: { region: BUTTON_FOOT, at: 3000, tone: 'on-dark' },
    }],
  },
  {
    key: 'family',
    label: 'Hvem spiser med?',
    ms: 3200,
    beats: [{
      frame: 'mad.flow.4_household',
      at: 0,
      alt: 'Spørgsmålet om, hvem der spiser med: to voksne og to børn',
      press: { region: BUTTON_FOOT, at: 2600, tone: 'on-dark' },
    }],
  },
  {
    key: 'hensyn',
    label: 'Særlige hensyn',
    ms: 3000,
    beats: [{ frame: 'mad.flow.2_avoid', at: 0, alt: 'Spørgsmålet om, hvad der ikke passer til jer' }],
  },
  {
    key: 'budget',
    label: 'Budget',
    ms: 11400,
    beats: [
      {
        frame: 'mad.flow.6_budget',
        at: 0,
        alt: 'Jeres budget til dagligvarer pr. måned og pr. uge med tre niveauer at vælge imellem',
        press: { region: BUTTON_FOOT, at: 4400, tone: 'on-dark' },
      },
      {
        frame: 'mad.welcome.1',
        at: 5200,
        alt: 'Velkommen til Altid Mad: spar i gennemsnit 11.207 kr. om året på dagligvarer',
        reportNote: true,
      },
    ],
  },
  {
    key: 'build',
    label: 'Appen bygger madplanen',
    ms: 3600,
    beats: [{ frame: 'mad.flow.8_building', at: 0, alt: 'Appen bygger en plan, der passer til jer: retter, tilbud og portioner' }],
  },
  {
    key: 'overview',
    label: 'Din madplan for ugen',
    ms: 4200,
    beats: [{ frame: 'mad.flow.9_week_plan', at: 0, alt: 'Madplanen for ugen til to voksne og to børn, med retter dag for dag' }],
  },
  {
    key: 'swipe',
    label: 'Tilpas retterne',
    ms: 7200,
    beats: [{ frame: 'mad.meal_plan.swap_picker', at: 0, alt: 'Vælg en ny ret til aften: en liste med retter, der kan byttes ind' }],
  },
  {
    key: 'godkendt',
    label: 'Jeres indkøbsliste er klar',
    ms: 4200,
    beats: [{
      frame: 'mad.flow.14_done',
      at: 0,
      alt: 'Ugens retter på en række og beskeden om, at jeres indkøbsliste er klar',
      press: { region: DONE_BUTTON, at: 3400, tone: 'on-light' },
    }],
  },
  APP_ICON_SCENE,
]
export const MADPLAN_REST = 'godkendt'

// mad.trip to mad.trip.in_progress: the two captures differ only in these places.
const TICK_ONE: Region = { x: 170, y: 849, w: 490, h: 86 }
const TICK_TWO: Region = { x: 170, y: 977, w: 490, h: 86 }
const ITEMS_LEFT: Region = { x: 155, y: 216, w: 70, h: 95 }
const BILKA_COUNT: Region = { x: 90, y: 376, w: 90, h: 24 }
const BILKA_BAR: Region = { x: 40, y: 438, w: 20, h: 28 }

export const INDKOEB_SCENES: FlowScene[] = [
  {
    key: 'indkobsliste',
    label: 'Dine indkøbslister',
    ms: 6300,
    beats: [{ frame: 'mad.shopping_list', at: 0, alt: 'Indkøbslisten med alle ugens varer, samlet butik for butik' }],
  },
  {
    key: 'basishunt',
    label: 'Lignende varer og priser',
    ms: 8000,
    beats: [{ frame: 'mad.trip.replace_sheet', at: 0, alt: 'En vare med lignende varer i samme butik, den billigste først, og prisen i en anden butik' }],
  },
  {
    key: 'basisklar',
    label: 'Øvrige varer',
    ms: 5000,
    beats: [{
      frame: 'mad.flow.11b_others',
      at: 0,
      alt: 'Øvrige varer, der lægges på listen, før den bliver optimeret',
      press: { region: BUTTON_ABOVE_TABS, at: 4400, tone: 'on-dark' },
    }],
  },
  {
    key: 'planlaeg',
    label: 'Planlægger indkøbstur',
    ms: 4400,
    beats: [
      { frame: 'mad.flow.12b_cheapest', at: 0, alt: 'Hvor vil I handle? Indkøbet fordelt på tre butikker med samlet pris' },
      { frame: 'mad.flow.13_combinations', at: 2000, alt: 'Alle kombinationer af én, to og tre butikker med pris for hver' },
    ],
  },
  {
    key: 'kort',
    label: 'Del indkøbet op',
    ms: 6900,
    beats: [{ frame: 'mad.welcome.3', at: 0, alt: 'Del indkøbet op: jo flere butikker, jo mere sparer I, vist med søjler for hver butik' }],
  },
  {
    key: 'bilkaliste',
    label: 'Første stop: Bilka',
    ms: 5600,
    beats: [{
      frame: 'mad.trip',
      at: 0,
      alt: 'Indkøbsturen i Bilka, hvor varerne krydses af en efter en',
      reveals: [
        { from: 'mad.trip.in_progress', region: TICK_ONE, at: 1400 },
        { from: 'mad.trip.in_progress', region: TICK_TWO, at: 2800 },
        { from: 'mad.trip.in_progress', region: ITEMS_LEFT, at: 2800 },
        { from: 'mad.trip.in_progress', region: BILKA_COUNT, at: 2800 },
        { from: 'mad.trip.in_progress', region: BILKA_BAR, at: 2800 },
      ],
    }],
  },
  APP_ICON_SCENE,
]
export const INDKOEB_REST = 'bilkaliste'

/** The guide pages, per their board rows. A crop is in the frame's own pixels. */
export const GUIDE_SCREENS = {
  jul: {
    id: 'mad.meal_plan',
    crop: { x: 0, y: 464, w: 720, h: 382 },
    alt: 'Ugevælgeren i Altid Mad med en ret til hver dag i ugen',
  },
  beregn: {
    id: 'mad.flow.6_budget',
    alt: 'Budgettet i Altid Mad: beløb pr. måned og pr. uge og det, husstande af jeres størrelse typisk bruger',
  },
  madpakker: {
    id: 'mad.meal_plan.scrolled',
    crop: { x: 0, y: 263, w: 720, h: 1298 },
    alt: 'Madplanen i Altid Mad med dagens morgenmad, frokost og aftensmad',
  },
  tilbud: {
    id: 'mad.welcome.4',
    alt: 'Indkøbslisten skriver sig selv: Altid Mad tjekker tilbudsaviser og priser',
  },
  supermarked: {
    id: 'mad.welcome.3',
    alt: 'Del indkøbet op: priser i én, to og tre butikker, vist med søjler',
  },
  spar: {
    id: 'mad.home',
    alt: 'Altid Mad med ugens retter, resten af budgettet og indkøbsturen',
  },
  tretusind: {
    id: 'mad.flow.6_budget.3000',
    alt: 'Budgettet i Altid Mad sat til 3.000 kr. om måneden, omregnet til cirka 690 kr. om ugen',
  },
} satisfies Record<string, { id: ScreenId; alt: string; crop?: Region }>
