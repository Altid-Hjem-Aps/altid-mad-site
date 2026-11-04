// Every picture of the app on this site, and the tours built from them.
//
// The pictures come from a capture run of the real app (scripts/build-app-screens.mjs)
// and are checked by eye: a picture is invisible to the copy tests, so
// test/screen-tour.test.tsx holds the list below to what somebody has looked at.
//
// Every kroner figure in these frames comes from staged shelf prices and is example
// data, not a claim. The caption near the first phone on a page says so.
//
// Not on this list, and why:
//   mad.savings                savings seeded for the capture; savings figures on the
//                              site must be documented (Ombudsman notice of 9 Sep)
//   mad.flow.14_done           "60 kr. om ugen", computed from staged prices
//   mad.home.scrolled, .full   show the seeded "Ugens besparelse 96 kr."
//   mad.flow.12_optimise       "100/100" overflows its ring (the app does this), and
//                              "14 kr. billigere" is a saving from staged prices
//   mad.flow.13_combinations   amounts per store from staged prices, no story of its own
//   mad.welcome.1              "Spar i gennemsnit 11.207 kr." needs the report's footnote
//   mad.welcome.3, .4          art with invented amounts per chain, not a screen
//   mad.recipe.full            below the top, quantities are for 4 while the header says 3
//   mad.flow.11_basics         the app's placeholders instead of product photos
//   mad.flow.10_basics_intro   a sheet over a legend reading "Øvrige 0 kr."
//   mad.meal_plan.scrolled     the big number is cut by the status bar
const FRAME = { width: 720, height: 1561 } as const

const frame = (id: string, source = `v1.0.3 sim/mad/${id}`) => ({ file: `/app-screens/${id}.webp`, source, ...FRAME })

export const SCREENS = {
  'mad.home': frame('mad.home'),
  'mad.meal_plan': frame('mad.meal_plan'),
  'mad.shopping_list': frame('mad.shopping_list'),
  'mad.recipe': frame('mad.recipe', 'v1.0.3 sim/mad/mad.recipe.full, top of it'),
  'mad.trip': frame('mad.trip'),
  'mad.trip.in_progress': frame('mad.trip.in_progress'),
  'mad.flow.1_tastes': frame('mad.flow.1_tastes'),
  'mad.flow.4_household': frame('mad.flow.4_household'),
  'mad.flow.6_budget': frame('mad.flow.6_budget'),
  'mad.flow.7_stores': frame('mad.flow.7_stores'),
  'mad.flow.9_week_plan': frame('mad.flow.9_week_plan'),
} as const

export type ScreenId = keyof typeof SCREENS

/** A rectangle in the pixels of the frame's manifest entry. */
export type Region = { x: number; y: number; w: number; h: number }

export type Lift = Region & {
  /** Corner radius of the crop, in the same pixels. */
  r: number
  /** How much larger the crop gets when it rises. */
  scale: number
  /** A finger taps the crop first, so the rise reads as the answer to the tap. */
  tapped?: boolean
}

export type Scene = {
  id: ScreenId
  /** What this frame shows, for the dots that step through it by hand. */
  alt: string
  holdMs: number
  /** Where someone taps, in order. The last lands 300 ms before the next scene. */
  tap?: Region[]
  lift?: Lift
  /** The frame before is this same screen a moment earlier: it changes in place,
   *  with no push. */
  inPlace?: boolean
}

// The big green button at the foot of the flow's steps.
const FLOW_BUTTON: Region = { x: 44, y: 1369, w: 632, h: 100 }

export const HERO_LABEL = 'Altid Mad i appen Altid Hjem: ugens retter, madplanen og indkøbslisten'
export const HERO_SCENES: Scene[] = [
  {
    id: 'mad.home',
    alt: 'Altid Mad med ugens retter og det, der er tilbage af budgettet',
    holdMs: 2800,
    tap: [{ x: 283, y: 1408, w: 134, h: 104 }],
  },
  {
    id: 'mad.meal_plan',
    alt: 'Madplanen for ugen med dagens ret fremhævet',
    holdMs: 4600,
    lift: { x: 197, y: 562, w: 170, h: 170, r: 85, scale: 1.22, tapped: true },
    tap: [{ x: 409, y: 1408, w: 116, h: 104 }],
  },
  { id: 'mad.shopping_list', alt: 'Indkøbslisten fordelt på butikker', holdMs: 3000 },
]

/** The two stills beside the hero's tour on wide screens. */
export const HERO_STILLS: ScreenId[] = ['mad.recipe', 'mad.trip.in_progress']

export const MADPLAN_LABEL = 'Altid Mad i appen Altid Hjem: fra husstand og budget til ugens madplan'
export const MADPLAN_SCENES: Scene[] = [
  { id: 'mad.flow.4_household', alt: 'Spørgsmålet om, hvem der spiser med', holdMs: 2600, tap: [FLOW_BUTTON] },
  { id: 'mad.flow.6_budget', alt: 'Budgettet til dagligvarer', holdMs: 2800, tap: [FLOW_BUTTON] },
  {
    id: 'mad.flow.9_week_plan',
    alt: 'Den færdige madplan for ugen',
    holdMs: 4200,
    lift: { x: 46, y: 982, w: 629, h: 159, r: 30, scale: 1.22 },
  },
]

export const INDKOEB_LABEL = 'Altid Mad i appen Altid Hjem: fra valg af butikker til indkøbsturen, vare for vare'
export const INDKOEB_SCENES: Scene[] = [
  { id: 'mad.flow.7_stores', alt: 'Valg af butikker', holdMs: 2600, tap: [FLOW_BUTTON] },
  {
    id: 'mad.trip',
    alt: 'Indkøbsturen med varerne og deres priser, butik for butik',
    holdMs: 3200,
    tap: [
      { x: 599, y: 869, w: 48, h: 48 },
      { x: 599, y: 996, w: 48, h: 48 },
    ],
  },
  {
    id: 'mad.trip.in_progress',
    alt: 'Indkøbsturen med de første varer krydset af',
    holdMs: 4000,
    inPlace: true,
    lift: { x: 46, y: 960, w: 629, h: 123, r: 24, scale: 1.22 },
  },
]
