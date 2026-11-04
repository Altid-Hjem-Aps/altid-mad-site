#!/usr/bin/env node
// Makes the phone pictures on the site from the app capture folder, so a refresh
// is one command. Writes public/app-screens/*.webp and removes pictures no longer listed.
//
//   node scripts/build-app-screens.mjs [capture folder]
//
// The folder holds the PNGs of sim/mad from a capture run (see CAPTURES.md there).
// Originals are never committed. The frames on the site follow Thor's approved board
// (site-captures/boards/board-altidmad*.png): a picture is invisible to the copy tests,
// so somebody has to look at every frame added to FRAMES at full size.
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CAPTURES = process.argv[2] ?? join(homedir(), 'altid-worktrees/site-captures/2026-11-04/sim/mad')
const OUT = join(ROOT, 'public/app-screens')

const WIDTH = 720
const QUALITY = 90
const CAPTURE = { width: 1179, height: 2556 }

async function load(id) {
  const path = join(CAPTURES, `${id}.png`)
  if (!existsSync(path)) throw new Error(`capture missing: ${path}`)
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.width !== CAPTURE.width || info.height !== CAPTURE.height) throw new Error(`unexpected size: ${path}`)
  return data
}

// Paints a rectangle with the screen's own background, row by row from a clean column,
// so a gradient carries on. Pixels are in the capture's own 1179 x 2556.
function erase(data, { x0 = 0, x1 = CAPTURE.width, y0, y1, from }) {
  for (let y = y0; y < y1; y++) {
    const sample = (y * CAPTURE.width + from) * 3
    for (let x = x0; x < x1; x++) {
      const at = (y * CAPTURE.width + x) * 3
      data[at] = data[sample]
      data[at + 1] = data[sample + 1]
      data[at + 2] = data[sample + 2]
    }
  }
}

const STATUS_BAR_H = 170

// Board: "mad.flow.14_done, crop above the 60 kr. figure" (34 kr. in the .oneflow
// run). A phone needs a whole screen, so the figure goes and the rest of the screen,
// the Færdig button included, stays where the app has it.
function doneWithoutFigure(data) {
  erase(data, { y0: 1290, y1: 2240, from: 10 })
}

// Board: "mad.meal_plan.scrolled, crop 0,430 to the foot": the big number is cut by the
// status bar in this capture. The crop stays in place and the band above it gets the
// hero's own background and the status bar of the unscrolled tab, same pixels at the
// edges (checked: the column at x 10 is identical in both captures from 0 to 430).
async function scrolledBelowNumber(data) {
  erase(data, { y0: 0, y1: 430, from: 10 })
  const top = await load('mad.meal_plan')
  top.copy(data, 0, 0, STATUS_BAR_H * CAPTURE.width * 3)
}

// The swap sheet opens over the Madplan tab, and the top of that tab's budget figure
// peeks out above the sheet. It belongs to another staged household than the flow, so
// it goes; the sheet itself is untouched.
function swapPickerWithoutFigure(data) {
  erase(data, { x0: 56, x1: 620, y0: 280, y1: 357, from: 30 })
}

const FRAMES = [
  // Hero
  { id: 'mad.meal_plan' },
  { id: 'mad.trip.in_progress' },
  { id: 'mad.meal_plan.scrolled', edit: scrolledBelowNumber },
  // Madplan story, one household and one budget (6.650 kr./md.)
  { id: 'mad.flow.1_tastes' },
  { id: 'mad.flow.4_household' },
  { id: 'mad.flow.2_avoid' },
  { id: 'mad.flow.6_budget' },
  { id: 'mad.welcome.1' },
  { id: 'mad.flow.8_building' },
  { id: 'mad.flow.9_week_plan' },
  { id: 'mad.meal_plan.swap_picker', edit: swapPickerWithoutFigure },
  { id: 'mad.flow.14_done.oneflow', edit: doneWithoutFigure },
  // Indkøb story, the same household and budget carried on to the list and the trip
  { id: 'mad.shopping_list.oneflow' },
  { id: 'mad.trip.replace_sheet.oneflow' },
  { id: 'mad.flow.12b_cheapest' },
  { id: 'mad.flow.13_combinations' },
  { id: 'mad.welcome.3' },
  { id: 'mad.trip.oneflow' },
  { id: 'mad.trip.in_progress.oneflow' },
  // Guide pages
  { id: 'mad.flow.6_budget.3000' },
  { id: 'mad.welcome.4' },
  { id: 'mad.home' },
]

mkdirSync(OUT, { recursive: true })
for (const frame of FRAMES) {
  const data = await load(frame.id)
  if (frame.edit) await frame.edit(data)
  const out = join(OUT, `${frame.id}.webp`)
  const info = await sharp(data, { raw: { width: CAPTURE.width, height: CAPTURE.height, channels: 3 } })
    .resize(WIDTH)
    .webp({ quality: QUALITY, smartSubsample: true, effort: 6 })
    .toFile(out)
  console.log(`${frame.id}: ${info.width}x${info.height}, ${(statSync(out).size / 1024).toFixed(0)} KB`)
}

const keep = new Set(FRAMES.map((f) => `${f.id}.webp`))
for (const file of readdirSync(OUT)) {
  if (!keep.has(file)) {
    rmSync(join(OUT, file))
    console.log(`removed ${file}`)
  }
}
