'use client'

import { useEffect, useRef, useState } from 'react'
import { fluid } from '@/lib/fluid'
import { REVEAL_SPRING } from '@/lib/motion'
import { H2, EYEBROW, BODY } from '@/lib/typography'


// "Fordelene, du har ventet på" — teal section (Mad CVI frame node 44:1060)
// with six white benefit cards: a mint icon circle, a title and a one-liner
// ending on the brand's "Altid." beat.

type Benefit = {
  title: string
  desc: string
  /** Icon exported 1:1 from the Figma frame (node 242:743, outlined strokes):
   *  a 52px mint circle + the glyph, served from public/benefits. */
  icon: string
  /** Inline animated variant, rendered instead of the static file. Same
   *  vectors as `icon`, plus a looping micro-interaction. */
  Anim?: React.FC<{ size: string }>
}

const BENEFITS: Benefit[] = [
  {
    title: 'Spar op til 29,2 %',
    desc: 'Familier der handler systematisk på tilbud, sparer markant mere end de tror er muligt. ',
    icon: '/benefits/spar.svg',
    Anim: PiggyCoinIcon,
  },
  {
    title: 'Automatisk indkøbsliste',
    desc: 'Vælg måltiderne, og listen laver sig selv – med prissammenligning klar til at dele med familien. ',
    icon: '/benefits/liste.svg',
    Anim: ChecklistIcon,
  },
  {
    title: 'Ugens tilbud på et sølvfad',
    desc: 'Vi finder tilbuddene for dig. Appen sammensætter madplanen ud fra, hvad der er billigst den uge. ',
    icon: '/benefits/tilbud.svg',
    Anim: ClocheIcon,
  },
  {
    title: 'Tilpasset din familie',
    desc: 'Angiv præferencer, kostvaner og antal. Altid Mad tilpasser opskrifter, portioner og indkøb. ',
    icon: '/benefits/familie.svg',
    Anim: FamilyIcon,
  },
  {
    title: 'Madplan på 5 minutter',
    desc: 'Ikke mere "hvad skal vi spise?" – en komplet ugeplan på få minutter, uden at nogen skal tænke på det. ',
    icon: '/benefits/madplan.svg',
  },
  {
    title: 'Nemt at komme i gang',
    desc: 'Du skifter ikke til noget svært. Altid Mad er bygget til at blive det bedste system – fra dag ét. ',
    icon: '/benefits/igang.svg',
  },
]


// The piggy-bank icon inlined (same vectors as /benefits/spar.svg) so a coin
// can drop into the slot: the coin falls in, vanishes at the slot line and
// the pig does a tiny gulp-bounce — one beat per 4.5s cycle, killed entirely
// under prefers-reduced-motion (globals.css).
function PiggyCoinIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 52 52" className="shrink-0" style={{ width: size, height: size }} aria-hidden>
      <circle cx="26" cy="26" r="26" fill="#DCD799" />
      <g className="pig-body" style={{ transformOrigin: '26px 30px' }}>
      <path d="M13.0351 16.163C13.5525 15.9699 14.1281 16.2326 14.3212 16.7499C14.7566 17.9167 15.599 18.8343 16.5117 19.5097C16.9554 19.8383 17.0491 20.4643 16.7206 20.9081C16.3921 21.3519 15.7661 21.4454 15.3222 21.1171C14.2051 20.2904 13.0588 19.0855 12.4482 17.4492C12.2551 16.9318 12.5177 16.3561 13.0351 16.163Z" fill="#163223" />
      <path d="M25.4521 20.6787C26.0044 20.6787 26.4521 21.1264 26.4521 21.6787C26.4521 22.231 26.0044 22.6787 25.4521 22.6787H21.6289C21.0766 22.6787 20.6289 22.231 20.6289 21.6787C20.6289 21.1264 21.0766 20.6787 21.6289 20.6787H25.4521Z" fill="#163223" />
      <path d="M31.9102 22.749C32.4146 22.8001 32.8086 23.2262 32.8086 23.7441C32.8086 23.9327 32.7548 24.1083 32.6641 24.2588C32.7551 24.4094 32.8085 24.5856 32.8086 24.7744C32.8086 25.3266 32.3607 25.7742 31.8086 25.7744C31.0239 25.7744 30.3782 25.1783 30.3008 24.4141L30.293 24.2598L30.3008 24.1045C30.3784 23.3404 31.024 22.7441 31.8086 22.7441L31.9102 22.749Z" fill="#163223" />
      <path d="M33.3223 24.2588C33.3221 25.0955 32.6434 25.7734 31.8066 25.7734C31.2544 25.7734 30.8066 25.3257 30.8066 24.7734C30.8067 24.5846 30.8601 24.4085 30.9512 24.2578C30.8604 24.1073 30.8066 23.9318 30.8066 23.7432C30.8066 23.1909 31.2544 22.7432 31.8066 22.7432C32.6435 22.7432 33.3223 23.4219 33.3223 24.2588Z" fill="#163223" />
      <path d="M20.2548 37.4178V35.5496C20.2548 34.9974 20.7027 34.5498 21.2548 34.5496H27.7285C28.2807 34.5496 28.7285 34.9973 28.7285 35.5496V37.5779C28.7285 37.5949 28.7427 37.6092 28.7597 37.6092H32.3662C32.372 37.6092 32.3756 37.6082 32.3779 37.6072C32.3807 37.606 32.3843 37.6037 32.3876 37.6004C32.3911 37.5969 32.3942 37.5926 32.3955 37.5897C32.3964 37.5874 32.3974 37.5837 32.3974 37.5779V35.5496C32.3974 35.1261 32.6642 34.7487 33.0634 34.6072C35.4623 33.7574 37.087 32.7298 38.0009 30.9207V27.0565L36.5624 25.8758C36.3314 25.6859 36.1972 25.4025 36.1972 25.1033C36.1972 23.6498 36.0514 22.5178 35.6074 21.6141C35.1841 20.7527 34.438 19.9971 33.0126 19.4031C32.64 19.2479 32.3974 18.883 32.3974 18.4793V14.3973C31.1392 14.4465 29.0819 15.1518 28.2773 17.2772C28.1228 17.685 27.7216 17.9461 27.2861 17.9217C23.6403 17.7171 21.0767 18.2107 19.289 19.0672C17.5229 19.9135 16.4595 21.1379 15.8349 22.5223C14.2957 25.9336 15.3481 29.6127 16.0771 32.0408C16.1966 32.4389 16.3021 32.7648 16.3818 33.0154C16.4203 33.1367 16.4562 33.2502 16.4824 33.3416C16.4953 33.387 16.5097 33.4392 16.5214 33.491C16.5247 33.5056 16.5325 33.5412 16.54 33.5897L16.5546 33.7664V37.4188C16.5548 37.4341 16.5666 37.448 16.5849 37.4481H20.2246C20.2306 37.4481 20.234 37.4471 20.2363 37.4461C20.2392 37.4449 20.2426 37.4426 20.246 37.4393C20.2493 37.436 20.2516 37.4324 20.2529 37.4295C20.2538 37.4273 20.2548 37.4237 20.2548 37.4178ZM34.3974 17.8377C35.8451 18.5619 36.8108 19.5277 37.4023 20.7313C37.9857 21.9185 38.1611 23.254 38.1913 24.6258L39.6357 25.8123C39.8669 26.0022 40.0009 26.2856 40.0009 26.5848V31.158C40.0009 31.3036 39.9695 31.4479 39.9081 31.5799C38.7809 34.0049 36.7792 35.3125 34.3974 36.243V37.5779C34.3974 38.6997 33.4874 39.6092 32.3662 39.6092H28.7597C27.6383 39.6092 26.7285 38.6996 26.7285 37.5779V36.5496H22.2548V37.4178C22.2546 38.5393 21.3458 39.448 20.2246 39.4481H16.5849C15.465 39.448 14.5548 38.5417 14.5546 37.4188C14.5548 36.2555 14.5549 34.4507 14.5546 33.8748C14.5374 33.816 14.5114 33.7339 14.4755 33.6209C14.399 33.3803 14.2875 33.0338 14.1621 32.616C13.4563 30.2655 12.1266 25.8801 14.0126 21.7C14.8238 19.9023 16.2174 18.3222 18.4247 17.2645C20.4783 16.2805 23.1862 15.7718 26.707 15.8934C28.1582 13.0558 31.1864 12.3276 32.7724 12.3992C33.8906 12.4498 34.3972 13.4427 34.3974 14.2039V17.8377Z" fill="#163223" />
      </g>
      {/* Coin — drops onto the slot (the dash at ≈28,21) and slips in. The
          clip keeps it inside the mint circle while it hovers above the pig. */}
      <g clipPath="url(#pig-coin-clip)">
        <circle
          className="pig-coin"
          cx="23.5"
          cy="18.2"
          r="3"
          fill="#DCD799"
          stroke="#163223"
          strokeWidth="2"
        />
      </g>
      <defs>
        <clipPath id="pig-coin-clip">
          <circle cx="26" cy="26" r="26" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Checklist (same vectors as /benefits/liste.svg): the two ticks and two
// lines pop in top-to-bottom, like the list filling itself in, then reset.
function ChecklistIcon({ size }: { size: string }) {
  const mark = { transformBox: 'fill-box' as const, transformOrigin: 'center' }
  return (
    <svg viewBox="0 0 52 52" className="shrink-0" style={{ width: size, height: size }} aria-hidden>
      <circle cx="26" cy="26" r="26" fill="#DCD799" />
      <path d="M14 37V15C14 14.2043 14.3163 13.4415 14.8789 12.8789C15.4415 12.3163 16.2043 12 17 12H28.1719C28.9674 12.0001 29.7304 12.3164 30.293 12.8789L37.1211 19.707C37.6834 20.2695 37.9999 21.0325 38 21.8281V37C38 37.7957 37.6836 38.5586 37.1211 39.1211C36.5586 39.6833 35.7958 40 35 40H17C16.2042 40 15.4414 39.6835 14.8789 39.1211C14.3162 38.5585 14 37.7955 14 37ZM16 37C16 37.2652 16.1055 37.5196 16.293 37.707L16.3662 37.7734C16.5442 37.9193 16.768 38 17 38H35C35.2649 38 35.5192 37.8947 35.707 37.707L35.7734 37.6338C35.9193 37.4558 36 37.232 36 37V21.8281C35.9999 21.5631 35.8945 21.3086 35.707 21.1211L28.8789 14.293C28.6915 14.1055 28.437 14.0001 28.1719 14H17C16.7348 14 16.4805 14.1054 16.293 14.293C16.1054 14.4805 16 14.7348 16 15V37Z" fill="#163223" />
      <path className="chk" style={{ ...mark, animationDelay: '0s' }} d="M23.038 21.6961C23.359 21.2467 23.9831 21.1427 24.4325 21.4637C24.8819 21.7847 24.986 22.4088 24.665 22.8582L21.872 26.7684C21.7011 27.0076 21.4335 27.1602 21.1405 27.1844C20.8478 27.2085 20.5592 27.1021 20.3515 26.8944L18.6757 25.2186C18.2852 24.8281 18.2852 24.1951 18.6757 23.8045C19.0662 23.414 19.6992 23.414 20.0898 23.8045L20.9306 24.6454L23.038 21.6961Z" fill="#163223" />
      <path className="chk" style={{ ...mark, animationDelay: '0.1s' }} d="M32.1172 23.75C32.6695 23.75 33.1172 24.1977 33.1172 24.75C33.1172 25.3023 32.6695 25.75 32.1172 25.75H27.1172C26.5649 25.75 26.1172 25.3023 26.1172 24.75C26.1172 24.1977 26.5649 23.75 27.1172 23.75H32.1172Z" fill="#163223" />
      <path className="chk" style={{ ...mark, animationDelay: '0.2s' }} d="M23.038 28.7586C23.359 28.3092 23.9831 28.2052 24.4325 28.5262C24.8819 28.8472 24.986 29.4713 24.665 29.9207L21.872 33.8309C21.7011 34.0701 21.4335 34.2227 21.1405 34.2469C20.8478 34.271 20.5592 34.1646 20.3515 33.9569L18.6757 32.2811C18.2852 31.8906 18.2852 31.2576 18.6757 30.867C19.0662 30.4765 19.6992 30.4765 20.0898 30.867L20.9306 31.7079L23.038 28.7586Z" fill="#163223" />
      <path className="chk" style={{ ...mark, animationDelay: '0.3s' }} d="M32.1172 30.6875C32.6695 30.6875 33.1172 31.1352 33.1172 31.6875C33.1172 32.2398 32.6695 32.6875 32.1172 32.6875H27.1172C26.5649 32.6875 26.1172 32.2398 26.1172 31.6875C26.1172 31.1352 26.5649 30.6875 27.1172 30.6875H32.1172Z" fill="#163223" />
    </svg>
  )
}

// Cloche (same vectors as /benefits/tilbud.svg): the lid (dome + knob) lifts
// to reveal, holds, and lowers — the "on a silver platter" beat. 3.8s cycle.
function ClocheIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 52 52" className="shrink-0" style={{ width: size, height: size }} aria-hidden>
      <circle cx="26" cy="26" r="26" fill="#DCD799" />
      <path d="M37 33C37.5523 33 38 33.4477 38 34C38 34.5523 37.5523 35 37 35H15C14.4477 35 14 34.5523 14 34C14 33.4477 14.4477 33 15 33H37Z" fill="#163223" />
      <g className="cloche-lid">
      <path d="M36 28.2666C36 25.5361 34.9406 22.9216 33.0625 20.998C31.1852 19.0754 28.6442 18 26 18C23.3558 18 20.8148 19.0754 18.9375 20.998C17.0594 22.9217 16 25.5361 16 28.2666C16 28.4688 16.0785 28.6583 16.2109 28.7939C16.3428 28.929 16.5167 29 16.6924 29H35.3076C35.4833 29 35.6573 28.9289 35.7891 28.7939C35.9216 28.6582 36 28.4687 36 28.2666ZM38 28.2666C38 28.9839 37.7217 29.6762 37.2197 30.1904C36.7169 30.7055 36.0295 31 35.3076 31H16.6924C15.9705 31 15.2831 30.7062 14.7803 30.1914C14.278 29.6771 14 28.9839 14 28.2666C14 25.0211 15.2584 21.9037 17.5059 19.6016C19.7543 17.2986 22.8096 16 26 16C29.1904 16 32.2456 17.2986 34.4941 19.6016C36.7417 21.9037 38 25.0211 38 28.2666Z" fill="#163223" />
      <path d="M25 17V14C25 13.4477 25.4477 13 26 13C26.5523 13 27 13.4477 27 14V17C27 17.5523 26.5523 18 26 18C25.4477 18 25 17.5523 25 17Z" fill="#163223" />
      </g>
    </svg>
  )
}

// Family (same vectors as /benefits/familie.svg): a soft bob passes across
// the three figures (left → right → child), then rests. 4.2s cycle.
function FamilyIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 52 52" className="shrink-0" style={{ width: size, height: size }} aria-hidden>
      <circle cx="26" cy="26" r="26" fill="#DCD799" />
      <g className="fam" style={{ animationDelay: '0s' }}>
      <path d="M21.1553 16.7441C21.1552 16.0164 20.8652 15.3183 20.3506 14.8037C19.8359 14.2892 19.1379 14 18.4102 14C17.6824 14.0001 16.9843 14.2891 16.4697 14.8037C15.9551 15.3183 15.6661 16.0164 15.666 16.7441C15.666 17.4719 15.9552 18.1699 16.4697 18.6846C16.9843 19.1992 17.6824 19.4892 18.4102 19.4893C19.138 19.4893 19.8359 19.1992 20.3506 18.6846C20.8653 18.1699 21.1553 17.472 21.1553 16.7441ZM23.1553 16.7441C23.1553 18.0024 22.6554 19.2099 21.7656 20.0996C20.8759 20.9894 19.6685 21.4893 18.4102 21.4893C17.1521 21.4892 15.9453 20.9892 15.0557 20.0996C14.1659 19.2099 13.666 18.0024 13.666 16.7441C13.6661 15.4859 14.166 14.2793 15.0557 13.3896C15.9454 12.5 17.152 12.0001 18.4102 12C19.6685 12 20.8759 12.4999 21.7656 13.3896C22.6552 14.2793 23.1552 15.486 23.1553 16.7441Z" fill="#163223" />
      <path d="M11.7949 29.8506V27.9785C11.7949 24.3242 14.7578 21.3613 18.4121 21.3613C20.9051 21.3615 23.0742 22.7411 24.2012 24.7734C24.469 25.2564 24.2945 25.865 23.8115 26.1328C23.3286 26.4003 22.7199 26.226 22.4521 25.7432C21.6634 24.3208 20.1492 23.3615 18.4121 23.3613C15.8624 23.3613 13.7949 25.4288 13.7949 27.9785V29.8506C13.7948 30.4027 13.3471 30.8506 12.7949 30.8506C12.2427 30.8506 11.7951 30.4027 11.7949 29.8506Z" fill="#163223" />
      </g>
      <g className="fam" style={{ animationDelay: '0.12s' }}>
      <path d="M36.1338 16.7441C36.1337 16.0164 35.8437 15.3183 35.3291 14.8037C34.8145 14.2892 34.1164 14 33.3887 14C32.6609 14.0001 31.9629 14.2891 31.4482 14.8037C30.9336 15.3183 30.6446 16.0164 30.6445 16.7441C30.6445 17.4719 30.9337 18.1699 31.4482 18.6846C31.9629 19.1992 32.6609 19.4892 33.3887 19.4893C34.1165 19.4893 34.8144 19.1992 35.3291 18.6846C35.8438 18.1699 36.1338 17.472 36.1338 16.7441ZM38.1338 16.7441C38.1338 18.0024 37.6339 19.2099 36.7441 20.0996C35.8544 20.9894 34.647 21.4893 33.3887 21.4893C32.1306 21.4892 30.9238 20.9892 30.0342 20.0996C29.1444 19.2099 28.6445 18.0024 28.6445 16.7441C28.6446 15.4859 29.1445 14.2793 30.0342 13.3896C30.9239 12.5 32.1305 12.0001 33.3887 12C34.647 12 35.8544 12.4999 36.7441 13.3896C37.6337 14.2793 38.1337 15.486 38.1338 16.7441Z" fill="#163223" />
      <path d="M38.0053 29.8506V27.9785C38.0053 25.4287 35.9378 23.3613 33.3881 23.3613C31.6509 23.3615 30.1368 24.3208 29.3481 25.7432C29.0802 26.2262 28.4707 26.4006 27.9877 26.1328C27.505 25.865 27.3306 25.2563 27.5981 24.7734C28.7251 22.7411 30.895 21.3615 33.3881 21.3613C37.0424 21.3613 40.0053 24.3242 40.0053 27.9785V29.8506C40.0051 30.4027 39.5574 30.8505 39.0053 30.8506C38.4531 30.8506 38.0054 30.4027 38.0053 29.8506Z" fill="#163223" />
      </g>
      <g className="fam" style={{ animationDelay: '0.24s' }}>
      <path d="M28.6475 27.9727C28.6474 27.2449 28.3574 26.5468 27.8428 26.0322C27.3281 25.5177 26.6301 25.2285 25.9023 25.2285C25.1746 25.2286 24.4765 25.5176 23.9619 26.0322C23.4473 26.5468 23.1583 27.2449 23.1582 27.9727C23.1582 28.7004 23.4474 29.3984 23.9619 29.9131C24.4765 30.4277 25.1746 30.7177 25.9023 30.7178C26.6302 30.7178 27.3281 30.4278 27.8428 29.9131C28.3574 29.3984 28.6475 28.7005 28.6475 27.9727ZM30.6475 27.9727C30.6475 29.231 30.1476 30.4384 29.2578 31.3281C28.3681 32.2179 27.1606 32.7178 25.9023 32.7178C24.6442 32.7177 23.4375 32.2177 22.5479 31.3281C21.6581 30.4384 21.1582 29.231 21.1582 27.9727C21.1583 26.7145 21.6582 25.5079 22.5479 24.6182C23.4375 23.7285 24.6441 23.2286 25.9023 23.2285C27.1606 23.2285 28.3681 23.7284 29.2578 24.6182C30.1474 25.5078 30.6474 26.7146 30.6475 27.9727Z" fill="#163223" />
      <path d="M30.5186 39.2061C30.5183 36.6567 28.4518 34.5901 25.9023 34.5898C23.3527 34.5898 21.2854 36.6565 21.2852 39.2061C21.2852 39.7583 20.8374 40.2061 20.2852 40.2061C19.7329 40.2061 19.2852 39.7583 19.2852 39.2061C19.2854 35.5519 22.2482 32.5898 25.9023 32.5898C29.5563 32.5901 32.5183 35.552 32.5186 39.2061C32.5186 39.7583 32.0708 40.2061 31.5186 40.2061C30.9663 40.206 30.5186 39.7583 30.5186 39.2061Z" fill="#163223" />
      </g>
    </svg>
  )
}

export default function Services() {
  const gridRef = useRef<HTMLDivElement>(null)
  const reduceRef = useRef(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    reduceRef.current = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Reveal immediately if motion is reduced or IntersectionObserver is missing.
    if (reduceRef.current || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="tjenester" className="scroll-mt-24" style={{ background: '#3E6924' }}>
      <div
        className="max-w-[1920px] mx-auto"
        style={{ paddingLeft: fluid(48, 24), paddingRight: fluid(48, 24), paddingTop: fluid(120, 64), paddingBottom: fluid(120, 64) }}
      >
        <p
          className={`${EYEBROW} text-center mb-4`}
          style={{ color: '#DCD799' }}
        >
          Tjenesterne
        </p>
        <h2 className={`${H2} text-center text-white`}>
          Fordelene,<br className="sm:hidden" /> du har ventet på
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mx-auto"
          style={{ gap: fluid(24, 16), maxWidth: 'min(1377px, max(76vw, 340px))', marginTop: fluid(56, 40) }}
        >
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className="bg-white flex flex-col"
              style={{
                gap: fluid(14, 12),
                padding: fluid(26, 22),
                borderRadius: fluid(20, 16),
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                // On-scroll reveal: fade + rise, staggered per card.
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'none' : 'translateY(24px)',
                transition: reduceRef.current
                  ? 'none'
                  : `opacity 0.5s ease ${i * 70}ms, transform 0.6s ${REVEAL_SPRING} ${i * 70}ms`,
                willChange: 'opacity, transform',
              }}
            >
              <div className="flex items-center" style={{ gap: fluid(16, 12) }}>
                {b.Anim ? (
                  <b.Anim size={fluid(52, 44)} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.icon}
                    alt=""
                    className="shrink-0"
                    style={{ width: fluid(52, 44), height: fluid(52, 44) }}
                  />
                )}
                <p className="font-normal leading-snug" style={{ fontSize: fluid(20, 17), color: '#163223' }}>
                  {b.title}
                </p>
              </div>
              <p className="leading-[1.55]" style={{ fontSize: fluid(15, 14), color: '#4a5a4e' }}>
                {b.desc}
                <span className="font-medium" style={{ color: '#163223' }}>Altid.</span>
              </p>
            </div>
          ))}
        </div>

        <p
          className={`text-center text-white mx-auto ${BODY}`}
          style={{ maxWidth: fluid(923, 720), marginTop: fluid(48, 36) }}
        >
          Nøje udvalgte fordele til hverdagen, samlet i et enkelt og overskueligt system.
        </p>
      </div>
    </section>
  )
}
