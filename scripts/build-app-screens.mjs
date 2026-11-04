#!/usr/bin/env node
// Makes the phone pictures on the site from the app capture folder, so a refresh
// is one command. Writes public/app-screens/*.webp.
//
//   node scripts/build-app-screens.mjs [capture folder]
//
// The folder holds the PNGs of sim/mad from a capture run (see CAPTURES.md there).
// Originals are never committed. The frames allowed on this site, and why the others
// are not, are in lib/screen-captures.ts: a picture is invisible to the copy tests, so
// somebody has to look at every frame added to FRAMES at full size.
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CAPTURES = process.argv[2] ?? join(homedir(), 'altid-worktrees/site-captures/2026-11-04/sim/mad')
const OUT = join(ROOT, 'public/app-screens')

const WIDTH = 720
const QUALITY = 90
// A capture is 1179 x 2556. A stitched .full capture is cut to the top of that.
const CAPTURE = { width: 1179, height: 2556 }

// `from`: mad.recipe is the top of its stitched capture, because the plain one has
// the home indicator running through the ingredient list.
const FRAMES = [
  { id: 'mad.home' },
  { id: 'mad.meal_plan' },
  { id: 'mad.shopping_list' },
  { id: 'mad.recipe', from: 'mad.recipe.full' },
  { id: 'mad.trip' },
  { id: 'mad.trip.in_progress' },
  { id: 'mad.flow.1_tastes' },
  { id: 'mad.flow.4_household' },
  { id: 'mad.flow.6_budget' },
  { id: 'mad.flow.7_stores' },
  { id: 'mad.flow.9_week_plan' },
]

mkdirSync(OUT, { recursive: true })
for (const frame of FRAMES) {
  const path = join(CAPTURES, `${frame.from ?? frame.id}.png`)
  if (!existsSync(path)) throw new Error(`capture missing: ${path}`)
  const out = join(OUT, `${frame.id}.webp`)
  const info = await sharp(path)
    .extract({ left: 0, top: 0, ...CAPTURE })
    .removeAlpha()
    .resize(WIDTH)
    .webp({ quality: QUALITY, smartSubsample: true, effort: 6 })
    .toFile(out)
  console.log(`${frame.id}: ${info.width}x${info.height}, ${(statSync(out).size / 1024).toFixed(0)} KB`)
}
