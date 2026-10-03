import type { Activity } from '../types'

// Every scene shares one coordinate system: 40 units tall, Clawd standing at
// x 60..78 on the right, props to his left. A scene crops its viewBox from the
// left only, so its right edge (and Clawd) never moves between scenes.
const RIGHT = 84
const HEIGHT = 40
export const SCALE = 2

const P = {
  body: '#D97757',
  light: '#E5906F',
  shade: '#BF5F3E',
  eye: '#1F1E1D',
  ink: '#3B3A36',
  steel: '#8F8C84',
  steelDark: '#5F5D58',
  steelLight: '#BDBAB2',
  paper: '#FBF9F4',
  paperEdge: '#D3CFC4',
  line: '#A8A49A',
  outline: '#B9B6AE',
  green: '#4E9A62',
  yellow: '#E8B04B',
  red: '#E96B5F',
  mint: '#6BBE6E',
}

const r = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? ' ' + extra : ''}/>`

const c = (cx: number, cy: number, rad: number, fill: string, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"${extra ? ' ' + extra : ''}/>`

const BASE_CSS = `
:root{background:transparent;overflow:hidden}
*{transform-box:fill-box}
.br{animation:br 3.2s ease-in-out infinite;transform-origin:50% 100%}
@keyframes br{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.035)}}
.bl{animation:bl 4.6s infinite;transform-origin:50% 50%}
@keyframes bl{0%,91%,97%,100%{transform:scaleY(1)}94%{transform:scaleY(.12)}}
.tap{animation:tap .34s steps(1,end) infinite}
.tap2{animation:tap .34s steps(1,end) -.17s infinite}
@keyframes tap{0%{transform:translateY(0)}50%{transform:translateY(.9px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

// ---------------------------------------------------------------- Clawd

type Pose = {
  eyes?: string
  armL?: string
  armR?: string
  upper?: string
  whole?: string
  // Drawn inside the breathing group, so it moves with his head.
  hat?: string
  legs?: string
}

const SHADOW = `<ellipse cx="69" cy="35.4" rx="10" ry="1.1" fill="#000" opacity=".13"/>`
const LEGS = [61, 65, 71, 75].map(x => r(x, 31, 2, 4, P.shade)).join('')
const ARM_L = r(57, 24, 3, 3, P.body)
const ARM_R = r(78, 24, 3, 3, P.body)

function eyes(dx = -1, dy = 0, look = '') {
  return (
    `<g transform="translate(${dx} ${dy})"><g class="${look}">` +
    r(64, 21, 2, 4, P.eye, 'class="bl"') +
    r(72, 21, 2, 4, P.eye, 'class="bl"') +
    `</g></g>`
  )
}

function clawd(p: Pose = {}, shadow = SHADOW) {
  return (
    shadow +
    `<g class="${p.whole ?? ''}">` +
    (p.legs ?? LEGS) +
    `<g class="${p.upper ?? 'br'}">` +
    (p.armL ?? ARM_L) +
    (p.armR ?? ARM_R) +
    r(60, 18, 18, 13, P.body) +
    r(60, 18, 18, 1, P.light) +
    r(60, 29, 18, 2, P.shade) +
    (p.eyes ?? eyes()) +
    (p.hat ?? '') +
    `</g></g>`
  )
}

// ---------------------------------------------------------------- scenes

type Built = { x: number; body: string; css?: string }

function idle(): Built {
  return {
    x: 50,
    css: `.look{animation:look 9s ease-in-out infinite}
@keyframes look{0%,38%{transform:translateX(0)}44%,58%{transform:translateX(-1.2px)}64%,78%{transform:translateX(0)}84%,94%{transform:translateX(1px)}100%{transform:translateX(0)}}`,
    body: clawd({ eyes: eyes(0, 0, 'look') }),
  }
}

function sleep(): Built {
  const z = (delay: number) =>
    `<g transform="translate(58 15)"><g class="zz" style="animation-delay:${delay}s">` +
    `<path d="M0 0h2.6l-2.6 2.6h2.6" fill="none" stroke="${P.steel}" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g></g>`
  return {
    x: 44,
    css: `.br{animation-duration:4.8s}
.zz{opacity:0;animation:zz 3.6s ease-out infinite}
@keyframes zz{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(-9px,-12px) scale(1.4)}}`,
    body:
      clawd({
        eyes: r(63.5, 23.5, 3, 0.9, P.eye) + r(71.5, 23.5, 3, 0.9, P.eye),
      }) +
      z(0) +
      z(-1.2) +
      z(-2.4),
  }
}

function thinking(): Built {
  const blobs: [number, number, number][] = [
    [30, 11.5, 4.2],
    [35, 8, 5],
    [41, 8.6, 4.6],
    [45.5, 11.6, 3.6],
    [40, 13.4, 4],
    [33.5, 13.6, 3.8],
  ]
  const cloud =
    blobs.map(([x, y, rad]) => c(x, y, rad + 0.6, P.outline)).join('') +
    blobs.map(([x, y, rad]) => c(x, y, rad, '#FFFFFF')).join('')
  return {
    x: 22,
    css: `.sway{animation:sway 4s ease-in-out infinite;transform-origin:50% 100%}
@keyframes sway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
.cloud{animation:cloud 3s ease-in-out infinite;transform-origin:80% 80%}
@keyframes cloud{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
.t1{animation:tr 3s ease-in-out infinite}.t2{animation:tr 3s ease-in-out -.4s infinite}
@keyframes tr{0%,100%{opacity:1}50%{opacity:.55}}
.look{animation:look 6s ease-in-out infinite}
@keyframes look{0%,45%{transform:translate(0,0)}55%,90%{transform:translate(.6px,-.3px)}100%{transform:translate(0,0)}}`,
    body:
      `<g class="t1">${c(55.5, 17, 1, '#FFFFFF', `stroke="${P.outline}" stroke-width=".6"`)}</g>` +
      `<g class="t2">${c(51.6, 13.6, 1.6, '#FFFFFF', `stroke="${P.outline}" stroke-width=".6"`)}</g>` +
      `<g class="cloud">${cloud}</g>` +
      clawd({
        whole: 'sway',
        eyes: eyes(-1.2, -1.2, 'look'),
        armL: r(57, 22, 3, 3, P.body),
      }),
  }
}

// Clawd sitting behind a prop that faces him, seen from the far side: lifted
// three units so his eyes clear it, his arms reduced to hands at its sides.
function behind(p: Pose) {
  return `<g transform="translate(0 -3)">${clawd({ armL: '', armR: '', ...p }, '')}</g>`
}

const DESK_SHADOW = `<ellipse cx="69" cy="36" rx="16" ry="1" fill="#000" opacity=".13"/>`

// Eyes cast down at the prop in front of him.
const DOWN = -0.6

function writing(): Built {
  // The sheet faces Clawd: from here its typed lines show through backwards,
  // growing right to left, and the carriage travels to our right.
  const lines: [number, number][] = [
    [22.4, 8],
    [23.8, 6.5],
    [25.2, 7.5],
  ]
  const period = 100 / lines.length
  const lineCss = lines
    .map((_, i) => {
      const s = +(i * period).toFixed(2)
      const e = +(s + period * 0.8).toFixed(2)
      return `.l${i}{transform-origin:100% 50%;animation:l${i} 3.6s infinite}
@keyframes l${i}{0%${s ? `,${s}%` : ''}{transform:scaleX(0);opacity:1;animation-timing-function:steps(7,end)}${e}%,94%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}`
    })
    .join('\n')
  const slats = [30.2, 31.4, 32.6].map(y => r(61.5, y, 15, 0.5, '#4A7068', 'rx=".25"')).join('')
  const typewriter =
    `<g class="car">` +
    r(63, 21.2, 12, 6.2, '#F3F0E8', `stroke="${P.paperEdge}" stroke-width=".45"`) +
    lines.map(([y, w], i) => r(73.5 - w, y, w, 0.6, '#8A877F', `opacity=".38" class="l${i}"`)).join('') +
    r(58, 26.6, 22, 2, P.ink, 'rx=".8"') +
    c(57.6, 27.6, 1.3, '#6B6A65') +
    c(80.4, 27.6, 1.3, '#6B6A65') +
    r(80.2, 26.3, 3.2, 0.8, P.steel, 'rx=".4"') +
    `</g>` +
    `<path d="M56.5 28.6H81.5L83.4 34.6H54.6Z" fill="#5E8C82"/>` +
    r(56.5, 28.6, 25, 1, '#72A396') +
    slats +
    r(67.4, 33.4, 3.2, 0.6, '#C9A85C', 'rx=".3"') +
    r(54, 34.6, 30, 1.3, '#46695F', 'rx=".6"') +
    `<g transform="translate(55.4 24.2)"><g class="ding"><path d="M0-1.5L.4-.4 1.5 0 .4.4 0 1.5-.4.4-1.5 0-.4-.4Z" fill="${P.yellow}"/></g></g>`
  return {
    x: 50,
    css: `${lineCss}
.car{animation:car 1.2s infinite}
@keyframes car{0%{transform:translateX(0);animation-timing-function:steps(7,end)}80%{transform:translateX(3px);animation-timing-function:linear}88%{transform:translateX(3px);animation-timing-function:ease-out}100%{transform:translateX(0)}}
.ding{opacity:0;animation:ding 1.2s infinite;transform-origin:50% 50%}
@keyframes ding{0%,82%{opacity:0;transform:scale(.4)}90%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(.8)}}
.look{animation:look 1.2s infinite}
@keyframes look{0%{transform:translateX(-.6px);animation-timing-function:steps(7,end)}80%,88%{transform:translateX(.6px)}100%{transform:translateX(-.6px)}}`,
    body:
      DESK_SHADOW +
      behind({ eyes: eyes(0, DOWN, 'look') }) +
      typewriter +
      r(54.6, 29.8, 2.3, 2.2, P.body, 'class="tap"') +
      r(81.1, 29.8, 2.3, 2.2, P.body, 'class="tap2"'),
  }
}

function coding(): Built {
  // The lid faces Clawd: we see its back with the logo, and the screen's
  // light flickers on his face as the code scrolls by on his side.
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const [x1, y1] = [69 + Math.cos(a) * 0.55, 27.2 + Math.sin(a) * 0.55]
    const [x2, y2] = [69 + Math.cos(a) * 1.9, 27.2 + Math.sin(a) * 1.9]
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
  }).join('')
  const laptop =
    r(56, 21.6, 26, 11.4, '#B9B6AE', 'rx="1.3"') +
    r(56.7, 22.3, 24.6, 10, '#C6C3BB', 'rx="1"') +
    r(57.4, 22.6, 23.2, 0.5, '#D6D3CC', 'rx=".25"') +
    `<path class="logo" d="${rays}" stroke="${P.body}" stroke-width=".75" stroke-linecap="round"/>` +
    r(58, 33, 22, 0.9, '#6B6A65', 'rx=".4"') +
    `<path d="M55.4 33.9H82.6L83.6 35.6H54.4Z" fill="#A6A39A"/>` +
    r(54.4, 35.5, 29.2, 0.6, '#8C8A83', 'rx=".3"')
  return {
    x: 50,
    css: `.glow{animation:glow 1.8s steps(6,end) infinite}
@keyframes glow{0%{opacity:.5}16%{opacity:.75}33%{opacity:.55}50%{opacity:.85}66%{opacity:.6}83%{opacity:.7}100%{opacity:.5}}
.logo{animation:logo 3s ease-in-out infinite}
@keyframes logo{0%,100%{opacity:.85}50%{opacity:1}}
.read{animation:read 2.4s ease-in-out infinite}
@keyframes read{0%,100%{transform:translateX(-.7px)}50%{transform:translateX(.7px)}}`,
    body:
      `<defs><linearGradient id="screen" x1="0" y1="1" x2="0" y2="0">` +
      `<stop offset="0" stop-color="#BFD9FF" stop-opacity=".4"/><stop offset="1" stop-color="#BFD9FF" stop-opacity="0"/>` +
      `</linearGradient></defs>` +
      DESK_SHADOW +
      behind({ eyes: eyes(0, DOWN, 'read') }) +
      r(60, 15.5, 18, 6.3, 'url(#screen)', 'class="glow"') +
      laptop +
      r(54.4, 31.3, 2.4, 2.1, P.body, 'class="tap"') +
      r(81.2, 31.3, 2.4, 2.1, P.body, 'class="tap2"'),
  }
}

function web(): Built {
  const steam = (x: number, d: number) =>
    `<g transform="translate(${x} 27)"><g class="st" style="animation-delay:${d}s">` +
    `<path d="M0 0c-.9-1.2.9-2 0-3.2s.9-2 0-3.2" fill="none" stroke="${P.outline}" stroke-width=".7" stroke-linecap="round"/>` +
    `</g></g>`
  const mug =
    `<ellipse cx="43.5" cy="35.4" rx="4.6" ry=".8" fill="#000" opacity=".12"/>` +
    `<path d="M40 30h-1.3a1.8 1.8 0 0 0 0 3.6H40" fill="none" stroke="#BDB8AC" stroke-width="1"/>` +
    r(40, 28.5, 7, 6.6, '#EFEBE1', `rx="1" stroke="#BDB8AC" stroke-width=".5"`) +
    `<ellipse cx="43.5" cy="28.9" rx="3.1" ry=".7" fill="#7A5236"/>` +
    r(40.25, 31.2, 6.5, 1.1, P.body) +
    steam(42.2, 0) +
    steam(44.6, -1.2)
  const paper =
    r(55, 23.8, 28, 9.4, '#F4F1E8', `stroke="#C9C5BA" stroke-width=".5"`) +
    r(68.8, 23.8, 0.45, 9.4, '#D8D4CA') +
    r(57, 25, 10, 1.6, P.ink) +
    [27.6, 29, 30.4, 31.8].map((y, i) => r(57, y, [10, 9, 10, 6.5][i], 0.6, P.line)).join('') +
    r(70.8, 25, 4.6, 3.6, '#CFC9BB') +
    `<path d="M71.2 28.2l1.5-1.6 1 1 .9-.8 1 1.4Z" fill="#A79F8C"/>` +
    r(76.4, 25.2, 4.8, 0.9, '#6B6A65') +
    r(76.4, 26.8, 4, 0.6, P.line) +
    [29.6, 31, 32.2].map((y, i) => r(70.8, y, [10.2, 9.6, 8][i], 0.6, P.line)).join('')
  return {
    x: 36,
    css: `.st{opacity:0;animation:st 2.4s ease-out infinite}
@keyframes st{0%{opacity:0;transform:translateY(0)}30%{opacity:.85}100%{opacity:0;transform:translateY(-3px)}}
.rustle{animation:rustle 3.4s ease-in-out infinite;transform-origin:50% 50%}
@keyframes rustle{0%,100%{transform:rotate(-.7deg)}50%{transform:rotate(.7deg)}}
.read{animation:read 3s linear infinite}
@keyframes read{0%{transform:translateX(-1.3px)}40%{transform:translateX(1.3px)}50%{transform:translateX(-1.3px)}90%{transform:translateX(1.3px)}100%{transform:translateX(-1.3px)}}`,
    body:
      mug +
      clawd({ eyes: eyes(0, -1.4, 'read'), armL: '', armR: '' }) +
      `<g class="rustle">${paper}${r(53.8, 26.6, 2.2, 3, P.body)}${r(82, 26.6, 2, 3, P.body)}</g>`,
  }
}

function reading(): Built {
  const docLines = [17, 19, 21, 23, 25, 27, 29, 31]
  const widths = [11, 9.5, 11.5, 8, 10.5, 11, 7.5, 9]
  const docs =
    r(26, 9, 16, 22.5, '#E6E2D8', `stroke="#CFCBC1" stroke-width=".4"`) +
    `<path d="M22 11H34L38 15V34H22Z" fill="${P.paper}" stroke="#CFCBC1" stroke-width=".5" stroke-linejoin="round"/>` +
    `<path d="M34 11V15H38Z" fill="#E6E2D8" stroke="#CFCBC1" stroke-width=".4" stroke-linejoin="round"/>` +
    r(24.5, 13.3, 6, 1, '#6B6A65') +
    `<g class="hl">${r(23.6, 16.45, 13.2, 1.7, '#F2C94C', 'opacity=".45" rx=".4"')}</g>` +
    docLines.map((y, i) => r(24.5, y + 0.05, widths[i], 0.7, P.line)).join('')
  const lens =
    `<path d="M61 26.4L57.6 29.8" stroke="#8A6A4F" stroke-width="1.7" stroke-linecap="round"/>` +
    c(64, 23, 4.2, 'rgba(190,220,245,.35)', `stroke="${P.steelDark}" stroke-width="1.3"`) +
    `<g class="scan">${r(62.6, 20.2, 2.8, 5.6, P.eye, 'class="bl"')}</g>` +
    `<path d="M61.6 21.4a3 3 0 0 1 2-1.7" fill="none" stroke="#FFFFFF" stroke-width=".6" stroke-linecap="round" opacity=".9"/>`
  return {
    x: 30,
    css: `.hl{animation:hl 5.6s steps(7,end) infinite}
@keyframes hl{0%{transform:translateY(0)}100%{transform:translateY(14px)}}
.lean{animation:lean 2.8s ease-in-out infinite alternate}
@keyframes lean{0%{transform:translateX(0)}100%{transform:translateX(-1.2px)}}
.scan{animation:scan 2.8s ease-in-out infinite alternate}
@keyframes scan{0%{transform:translate(-.3px,-.5px)}100%{transform:translate(-.6px,.6px)}}`,
    body:
      `<g transform="translate(12 0)">${docs}</g>` +
      `<g class="lean">` +
      clawd({
        eyes: r(71.4, 21, 2, 4, P.eye, 'class="bl"'),
        armL: r(56, 28.4, 3, 3, P.body),
      }) +
      lens +
      `</g>`,
  }
}

function bash(): Built {
  // Seeded glyphs keep the markup identical on every redraw, so the running
  // animation never restarts.
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const GLYPHS = '01アイウエカキクコサシスセソタチツテナニハヒフホマミムメモヤユラリルレロワ$#<>{}=+*/'
  const glyph = () => {
    const g = GLYPHS[Math.floor(rand() * GLYPHS.length)]
    return g === '<' ? '&lt;' : g === '>' ? '&gt;' : g
  }
  const columns = Array.from({ length: 9 }, (_, i) => {
    const x = 55 + i * 3.2
    const duration = (1.7 + rand() * 1.6).toFixed(2)
    const delay = (-rand() * 3).toFixed(2)
    const trail = 5 + Math.floor(rand() * 3)
    const chars = Array.from({ length: trail }, (_, j) => {
      const isHead = j === trail - 1
      const opacity = isHead ? 1 : ((j + 1) / trail) * 0.75
      const fill = isHead ? '#C9FFD6' : '#3DDC84'
      return `<text x="${x.toFixed(1)}" y="${(j * 3.2).toFixed(1)}" fill="${fill}" opacity="${opacity.toFixed(2)}">${glyph()}</text>`
    }).join('')
    return `<g class="rain" style="animation-duration:${duration}s;animation-delay:${delay}s">${chars}</g>`
  }).join('')
  const glint = (x: number) => r(x, 21.4, 0.7, 0.7, '#7BD389')
  return {
    x: 50,
    css: `.rain{animation:rain 2.4s linear infinite}
@keyframes rain{0%{transform:translateY(-22px)}100%{transform:translateY(20px)}}
text{font-family:ui-monospace,Consolas,'Cascadia Mono',monospace;font-size:3px;text-anchor:middle}
.glow{animation:glow 2.4s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.16}50%{opacity:.3}}`,
    body:
      `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#000"/><stop offset=".22" stop-color="#fff"/><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#000"/>` +
      `</linearGradient><mask id="m"><rect x="52" y="0" width="32" height="18" fill="url(#fade)"/></mask>` +
      `<radialGradient id="halo"><stop offset="0" stop-color="#3DDC84"/><stop offset="1" stop-color="#3DDC84" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse class="glow" cx="69" cy="11" rx="15" ry="9" fill="url(#halo)"/>` +
      `<g mask="url(#m)">${columns}</g>` +
      clawd({
        eyes: eyes(0, -1.2) + `<g transform="translate(0 -1.2)">${glint(64.2)}${glint(72.2)}</g>`,
        armL: r(57, 24, 3, 3, P.body, 'class="tap"'),
        armR: r(78, 24, 3, 3, P.body, 'class="tap2"'),
      }),
  }
}

function agents(): Built {
  const mini = (delay: number) =>
    `<g class="walk" style="animation-delay:${delay}s"><g class="hop" style="animation-delay:${delay}s">` +
    r(1, 33, 0.9, 2, P.shade, 'class="la"') +
    r(3.1, 33, 0.9, 2, P.shade, 'class="lb"') +
    r(4.6, 33, 0.9, 2, P.shade, 'class="la"') +
    r(6.7, 33, 0.9, 2, P.shade, 'class="lb"') +
    r(-0.9, 30.3, 1, 1.2, '#E08A6D') +
    r(7.9, 30.3, 1, 1.2, '#E08A6D') +
    r(0, 28, 7.9, 5.2, '#E08A6D') +
    r(0, 28, 7.9, 0.5, '#EDA085') +
    r(1.5, 29.4, 0.9, 1.6, P.eye) +
    r(4.6, 29.4, 0.9, 1.6, P.eye) +
    r(-1.2, 26.6, 2.2, 2.8, P.paper, `stroke="${P.paperEdge}" stroke-width=".3"`) +
    `</g></g>`
  return {
    x: 0,
    css: `.walk{opacity:0;animation:walk 4.2s linear infinite}
@keyframes walk{0%{opacity:0;transform:translateX(52px)}10%{opacity:1}82%{opacity:1}100%{opacity:0;transform:translateX(4px)}}
.hop{animation:hop .35s steps(1,end) infinite}
@keyframes hop{0%{transform:translateY(0)}50%{transform:translateY(-.5px)}}
.la{animation:lift .35s steps(1,end) infinite}
.lb{animation:lift .35s steps(1,end) -.175s infinite}
@keyframes lift{0%{transform:translateY(0)}50%{transform:translateY(-.45px)}}
.point{animation:point 1.4s ease-in-out infinite;transform-origin:100% 50%}
@keyframes point{0%,100%{transform:rotate(28deg)}50%{transform:rotate(18deg)}}`,
    body:
      `<ellipse cx="30" cy="35.3" rx="26" ry=".7" fill="#000" opacity=".06"/>` +
      mini(0) +
      mini(-1.4) +
      mini(-2.8) +
      clawd({
        eyes: eyes(-1.4, -0.4),
        armL: `<g class="point">${r(53.5, 24, 6.5, 2.4, P.body)}</g>`,
      }),
  }
}

function todo(): Built {
  const rows = [16.5, 22, 27.5]
  const checkCss = rows
    .map((_, i) => {
      const s = i * 25
      const e = s + 7
      return `.ck${i}{stroke-dasharray:4.6;stroke-dashoffset:4.6;animation:ck${i} 4.8s infinite}
@keyframes ck${i}{0%${s ? `,${s}%` : ''}{stroke-dashoffset:4.6}${e}%,92%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}`
    })
    .join('\n')
  const board =
    r(34, 11, 16, 24, '#B98B5E', 'rx="1.2"') +
    r(34, 11, 16, 0.8, '#CC9F72', 'rx=".4"') +
    r(35.5, 13.5, 13, 20, P.paper) +
    r(38.5, 9.5, 7, 3, P.steel, 'rx=".8"') +
    r(40.8, 10.3, 2.4, 0.9, '#6B6A65', 'rx=".45"') +
    rows
      .map(
        (y, i) =>
          r(37, y, 3, 3, 'none', `stroke="#8A877F" stroke-width=".6" rx=".4"`) +
          r(41.5, y + 0.6, 5.5, 0.8, P.line) +
          r(41.5, y + 2, 3.5, 0.6, '#C6C2B8') +
          `<polyline points="${37.6},${y + 1.6} ${38.6},${y + 2.6} ${40.4},${y + 0.4}" fill="none" stroke="${P.green}" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round" class="ck${i}"/>`,
      )
      .join('')
  const pencil =
    `<g class="pen"><g transform="rotate(-38 44 19)" style="transform-box:view-box">` +
    r(43.3, 12.6, 1.5, 6.2, P.yellow) +
    r(43.3, 11.4, 1.5, 1.2, '#E38C8C') +
    r(43.3, 12.3, 1.5, 0.4, P.steelLight) +
    `<path d="M43.3 18.8h1.5l-.75 1.6Z" fill="#E9D3B0"/>` +
    `<path d="M43.8 19.85h.5l-.25.55Z" fill="${P.ink}"/>` +
    `</g></g>`
  return {
    x: 34,
    css: `${checkCss}
.pen{animation:pen 4.8s ease-in-out infinite}
@keyframes pen{0%,2%{transform:translate(0,0)}6%{transform:translate(-.8px,.6px)}10%,25%{transform:translate(0,0)}27%,29%{transform:translate(0,5.5px)}31%{transform:translate(-.8px,6.1px)}35%,50%{transform:translate(0,5.5px)}52%,54%{transform:translate(0,11px)}56%{transform:translate(-.8px,11.6px)}60%,88%{transform:translate(0,11px)}100%{transform:translate(0,0)}}`,
    body:
      `<g transform="translate(6 0)">${board}${pencil}</g>` +
      clawd({
        eyes: eyes(-1.5, 0),
        armL: r(57, 24, 3, 3, P.body, 'class="tap"'),
      }),
  }
}

function ask(): Built {
  // Just a wave at you, looking your way, with a little hop to catch your eye.
  return {
    x: 48,
    css: `.wave{animation:wave .9s ease-in-out infinite;transform-origin:100% 50%}
@keyframes wave{0%,100%{transform:rotate(38deg)}50%{transform:rotate(66deg)}}
.hop{animation:hop 1.8s ease-in-out infinite}
@keyframes hop{0%,60%,100%{transform:translateY(0)}70%{transform:translateY(-1px)}80%{transform:translateY(0)}}`,
    body: clawd({
      whole: 'hop',
      eyes: eyes(0, -0.4),
      armL: `<g class="wave">${r(53.5, 21, 6.5, 2.6, P.body)}</g>`,
    }),
  }
}

function browser(): Built {
  const win =
    r(22, 7, 30, 26, P.paper, `rx="1.5" stroke="${P.outline}" stroke-width=".6"`) +
    `<path d="M23.5 7.3h27a1.2 1.2 0 0 1 1.2 1.2V11H22.3V8.5a1.2 1.2 0 0 1 1.2-1.2Z" fill="#E6E2D8"/>` +
    c(24.4, 9.1, 0.65, P.red) +
    c(26.3, 9.1, 0.65, P.yellow) +
    c(28.2, 9.1, 0.65, P.mint) +
    r(30.5, 8.1, 19, 2, P.paper, 'rx="1"') +
    r(31.4, 8.8, 7, 0.6, '#C6C2B8') +
    r(24.5, 13, 25, 6.5, '#F4DCD1', 'rx=".6"') +
    r(26.3, 14.8, 11, 1.2, '#FFFFFF', 'rx=".3"') +
    r(26.3, 16.8, 7, 0.8, '#FFFFFF', 'opacity=".75" rx=".3"') +
    r(24.5, 21, 12, 5.5, '#ECE9E1', 'rx=".5"') +
    r(37.5, 21, 12, 5.5, '#ECE9E1', 'rx=".5"') +
    r(25.8, 22.3, 7, 0.7, P.line) +
    r(25.8, 23.8, 5, 0.6, '#C6C2B8') +
    r(38.8, 22.3, 7.5, 0.7, P.line) +
    r(38.8, 23.8, 4.5, 0.6, '#C6C2B8') +
    `<g class="btn">${r(24.5, 28.2, 8.5, 2.8, P.body, 'rx="1.4"')}</g>` +
    r(26.4, 29.25, 4.7, 0.7, '#FFFFFF', 'rx=".3" opacity=".9"') +
    `<g transform="translate(28.75 29.6)"><g class="rip">${c(0, 0, 3, 'none', `stroke="${P.body}" stroke-width=".6"`)}</g></g>` +
    `<g class="cursor"><g class="press"><path d="M0 0V5.2L1.35 4 2.35 6.2 3.25 5.8 2.25 3.7H4.05Z" fill="#FFFFFF" stroke="${P.eye}" stroke-width=".45" stroke-linejoin="round"/></g></g>`
  return {
    x: 22,
    css: `.cursor{animation:cur 4.4s ease-in-out infinite}
@keyframes cur{0%,8%{transform:translate(44px,15px)}30%,38%{transform:translate(41px,23.5px)}58%,78%{transform:translate(28.5px,29.2px)}100%{transform:translate(44px,15px)}}
.press{transform-origin:0 0;animation:press 4.4s infinite}
@keyframes press{0%,62%,68%,100%{transform:scale(1)}65%{transform:scale(.82)}}
.rip{opacity:0;transform-origin:50% 50%;animation:rip 4.4s infinite}
@keyframes rip{0%,63%{opacity:0;transform:scale(.2)}66%{opacity:.8}80%,100%{opacity:0;transform:scale(1.4)}}
.btn{animation:btn 4.4s infinite}
@keyframes btn{0%,62%,72%,100%{filter:none}65%{filter:brightness(.82)}}`,
    body:
      `<g transform="translate(4 0)">${win}</g>` +
      clawd({ eyes: eyes(-1.5, -0.4) }),
  }
}

// ---------------------------------------------------------------- work scenes

const GLASS = 'rgba(220,235,245,.4)'
const GLASS_EDGE = '#9FB3C2'

// A rotate() written as an attribute turns about the user-space point it
// names only when the element's transform box is the view box.
const ATTR = 'style="transform-box:view-box"'

function testing(): Built {
  const flask = 'M46.6 25L42 34.2Q41.6 35.2 42.7 35.2H53.3Q54.4 35.2 54 34.2L49.4 25Z'
  const bubble = (x: number, rad: number, delay: number, dur: number) =>
    `<g transform="translate(${x} 34)"><g class="bub" style="animation-delay:${delay}s;animation-duration:${dur}s">${c(0, 0, rad, '#D6F5DD')}</g></g>`
  const tube = (x: number, color: string, level: number, delay: number) =>
    r(x, 24, 1.6, 9, GLASS, `rx=".8" stroke="${GLASS_EDGE}" stroke-width=".35"`) +
    `<g class="lvl" style="animation-delay:${delay}s">${r(x + 0.25, 33 - level, 1.1, level - 0.25, color, 'rx=".5"')}</g>`
  const rack =
    r(32, 32.2, 0.7, 3.2, '#8A6A4F') +
    r(39.9, 32.2, 0.7, 3.2, '#8A6A4F') +
    tube(32.7, P.yellow, 5, 0) +
    tube(35.5, '#7FA7D9', 3.5, -0.9) +
    tube(38.3, '#C9A7E0', 6, -1.7) +
    r(31.6, 31.2, 9.4, 1, '#B98B5E', 'rx=".3"')
  const flaskArt =
    `<clipPath id="fl"><path d="${flask}"/></clipPath>` +
    `<g clip-path="url(#fl)"><g class="liq">${r(40, 29.4, 16, 7, '#7BD389', 'opacity=".9"')}${r(40, 29.4, 16, 0.6, '#A8E6B8')}</g></g>` +
    bubble(46.8, 0.55, 0, 2.2) +
    bubble(48.6, 0.75, -0.8, 2.6) +
    bubble(47.6, 0.45, -1.5, 2) +
    bubble(49.4, 0.6, -0.4, 2.4) +
    `<path d="${flask}" fill="${GLASS}" stroke="${GLASS_EDGE}" stroke-width=".5" stroke-linejoin="round"/>` +
    r(46.6, 21.4, 2.8, 3.8, GLASS, `stroke="${GLASS_EDGE}" stroke-width=".5"`) +
    r(46.1, 20.8, 3.8, 0.8, GLASS_EDGE, 'rx=".3"') +
    r(43.6, 31, 0.5, 2.6, '#FFFFFF', 'opacity=".55" rx=".25"') +
    `<g transform="translate(51.6 18.6)"><g class="tw"><path d="M0-1.4L.35-.35 1.4 0 .35.35 0 1.4-.35.35-1.4 0-.35-.35Z" fill="${P.yellow}"/></g></g>`
  return {
    x: 30,
    css: `.bub{opacity:0;animation:bub 2.2s ease-in infinite;transform-origin:50% 50%}
@keyframes bub{0%{opacity:0;transform:translateY(0) scale(.6)}10%{opacity:1}80%{opacity:.85}100%{opacity:0;transform:translateY(-16px) scale(1.15)}}
.lvl{animation:lvl 2.8s ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes lvl{0%{transform:scaleY(.72)}100%{transform:scaleY(1)}}
.liq{animation:liq 1.6s ease-in-out infinite alternate}
@keyframes liq{0%{transform:translateX(-.5px)}100%{transform:translateX(.5px)}}
.tw{opacity:0;animation:tw 2.2s infinite;transform-origin:50% 50%}
@keyframes tw{0%,70%{opacity:0;transform:scale(.4)}80%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(.7)}}`,
    body:
      rack +
      `<g transform="translate(3 0)">${flaskArt}</g>` +
      clawd({
        eyes: eyes(-1.5, 0.4),
        armL: r(53.6, 26.2, 6.4, 2.2, P.body),
      }),
  }
}

function commit(): Built {
  const box =
    `<path d="M42 25.6L43.2 24.4H54.8L56 25.6Z" fill="#DDAE7A"/>` +
    r(42, 25.6, 14, 9.8, '#C9965F', 'rx=".4"') +
    r(42, 34.6, 14, 0.8, '#B07E4C') +
    r(48.2, 24.4, 1.6, 11, '#E9D8B4') +
    r(43.4, 27.2, 3.6, 2.4, '#F4ECDD', 'rx=".2"') +
    r(43.9, 27.8, 2.6, 0.35, '#B8A78A') +
    r(43.9, 28.6, 1.8, 0.35, '#B8A78A')
  const mark =
    `<g transform="translate(51.2 31) rotate(-8)" ${ATTR}><g class="mark">` +
    r(-3.4, -2, 6.8, 4, 'none', `rx=".6" stroke="${P.green}" stroke-width=".7"`) +
    `<polyline points="-1.5,0 -0.4,1.1 1.7,-1.1" fill="none" stroke="${P.green}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g></g>`
  // The arm runs from the stamp's stem down to his shoulder and rides with it.
  const stamp =
    `<g class="stamp">` +
    `<g transform="rotate(19 50 17.5)" ${ATTR}>${r(50, 16.4, 10.6, 2.2, P.body)}</g>` +
    c(49, 14.4, 1.3, '#A33B2B') +
    r(48.5, 15.4, 1, 3.6, '#6B4A35') +
    r(45.5, 19, 7, 1.5, P.ink, 'rx=".3"') +
    r(46, 20.5, 6, 0.5, P.green) +
    `</g>`
  return {
    x: 34,
    css: `.stamp{animation:stamp 1.4s infinite}
@keyframes stamp{0%{transform:translateY(0)}25%{transform:translateY(-1.5px);animation-timing-function:ease-in}38%,50%{transform:translateY(3.4px)}70%,100%{transform:translateY(0)}}
.box{animation:squash 1.4s infinite;transform-origin:50% 100%}
@keyframes squash{0%,36%,48%,100%{transform:scaleY(1)}40%{transform:scaleY(.95)}}
.mark{opacity:0;animation:mark 1.4s infinite;transform-origin:50% 50%}
@keyframes mark{0%,37%{opacity:0;transform:scale(1.4)}42%{opacity:1;transform:scale(1)}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}`,
    body:
      `<ellipse cx="49" cy="35.6" rx="8" ry=".7" fill="#000" opacity=".1"/>` +
      `<g class="box">${box}${mark}</g>` +
      clawd({ eyes: eyes(-1.5, 0.2), armL: '' }) +
      stamp,
  }
}

function deploy(): Built {
  const rocket =
    `<path d="M43 25.5L40.4 30.4L43 29.6Z" fill="${P.body}"/>` +
    `<path d="M49 25.5L51.6 30.4L49 29.6Z" fill="${P.body}"/>` +
    `<path d="M46 14.2C48.4 16 49 19 49 22V29.8H43V22C43 19 43.6 16 46 14.2Z" fill="#F3F0E8" stroke="#BDBAB2" stroke-width=".4"/>` +
    `<path d="M46 14.2C47.4 15.3 48.1 16.6 48.5 18H43.5C43.9 16.6 44.6 15.3 46 14.2Z" fill="${P.body}"/>` +
    c(46, 21.8, 1.25, '#7FA7D9', 'stroke="#8C8A83" stroke-width=".45"') +
    `<path d="M45.3 21.3a.9.9 0 0 1 .8-.6" fill="none" stroke="#FFFFFF" stroke-width=".35" stroke-linecap="round"/>` +
    r(44.2, 29.8, 3.6, 1, '#6B6A65', 'rx=".2"') +
    `<g class="flame"><path d="M44.4 30.8Q46 36.6 47.6 30.8Z" fill="${P.yellow}"/><path d="M45.2 30.8Q46 34 46.8 30.8Z" fill="#F7E3A1"/></g>`
  const puff = (x: number) => `<g transform="translate(${x} 33)"><g class="smoke">${c(0, 0, 1.6, '#D5D1C7')}</g></g>`
  return {
    x: 30,
    css: `.launch{animation:launch 3.4s infinite}
@keyframes launch{0%{transform:translateY(0);opacity:0}6%{opacity:1}38%{transform:translateY(0);animation-timing-function:cubic-bezier(.5,0,.9,.5)}72%{transform:translateY(-34px);opacity:1}73%,100%{transform:translateY(-34px);opacity:0}}
.shake{animation:shake .12s steps(2,end) infinite}
@keyframes shake{0%{transform:translateX(-.2px)}100%{transform:translateX(.2px)}}
.flame{animation:flame .16s steps(2,end) infinite;transform-origin:50% 0}
@keyframes flame{0%{transform:scaleY(.65)}100%{transform:scaleY(1.05)}}
.smoke{opacity:0;animation:smoke 3.4s infinite;transform-origin:50% 50%}
@keyframes smoke{0%,36%{opacity:0;transform:scale(.3)}45%{opacity:.85}75%,100%{opacity:0;transform:scale(1.9)}}
.watch{animation:watch 3.4s ease-in-out infinite}
@keyframes watch{0%,38%{transform:translateY(0)}72%{transform:translateY(-1.2px)}100%{transform:translateY(0)}}
.led{animation:led .8s steps(1,end) infinite}
@keyframes led{0%{opacity:1}50%{opacity:.25}}`,
    body:
      r(39, 33.6, 14, 1.8, '#8F8C84', 'rx=".4"') +
      r(40, 32.4, 1, 1.2, '#6B6A65') +
      r(51, 32.4, 1, 1.2, '#6B6A65') +
      c(41.6, 34.5, 0.4, P.red, 'class="led"') +
      c(50.4, 34.5, 0.4, P.mint, 'class="led" style="animation-delay:.4s"') +
      puff(40.6) +
      puff(51.4) +
      `<g class="launch"><g class="shake">${rocket}</g></g>` +
      clawd({
        eyes: eyes(-1.3, -1.2, 'watch'),
        armL: r(57, 19.6, 3, 4.6, P.body),
      }),
  }
}

function waiting(): Built {
  const sign =
    r(55.4, 9.5, 0.9, 15, '#8A6A4F') +
    r(48, 3.2, 15.6, 8.2, '#FFFFFF', `rx="1.2" stroke="${P.body}" stroke-width=".8"`) +
    `<text x="55.8" y="9.3" font-family="system-ui,'Segoe UI',sans-serif" font-size="5" font-weight="800" fill="${P.ink}" text-anchor="middle">OK?</text>`
  const legs =
    r(61, 31, 2, 4, P.shade) + r(65, 31, 2, 4, P.shade) + r(71, 31, 2, 4, P.shade) + r(75, 31, 2, 4, P.shade, 'class="tapfoot"')
  return {
    x: 46,
    css: `.sway{animation:sway 2.4s ease-in-out infinite;transform-origin:50% 100%}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.tapfoot{animation:tapfoot .5s steps(1,end) infinite}
@keyframes tapfoot{0%{transform:translateY(0)}50%{transform:translateY(-.9px)}}`,
    body:
      `<g class="sway">${sign}</g>` +
      clawd({
        eyes: eyes(0, 0),
        armL: r(55, 21.6, 5, 2.2, P.body),
        legs,
      }),
  }
}

function debugging(): Built {
  const bug =
    `<g class="legs">` +
    `<path d="M-1.2 34.5l-.5.9M0 34.8v.9M1.2 34.5l.5.9M-1.2 32.3l-.5-.7M1.2 32.3l.5-.7" stroke="#2B2A27" stroke-width=".3" stroke-linecap="round"/>` +
    `</g>` +
    `<ellipse cx="0" cy="33.4" rx="2.1" ry="1.5" fill="#E05A47"/>` +
    `<path d="M0 31.9V34.9" stroke="#2B2A27" stroke-width=".3"/>` +
    c(-0.9, 32.9, 0.35, '#2B2A27') +
    c(0.9, 33.8, 0.35, '#2B2A27') +
    c(-0.7, 34.1, 0.3, '#2B2A27') +
    c(1, 32.8, 0.3, '#2B2A27') +
    c(-2.3, 33.4, 0.8, '#2B2A27') +
    `<path d="M-2.8 32.8l-.7-.9M-2.4 32.7l-.2-1.1" stroke="#2B2A27" stroke-width=".25" stroke-linecap="round"/>`
  const net =
    `<path d="M57.2 25.2L46.5 17.4" stroke="#8A6A4F" stroke-width="1" stroke-linecap="round"/>` +
    `<path d="M41.7 16.6Q43.4 21.6 45.3 20.9Q47.4 20.1 47.5 16.6" fill="rgba(255,255,255,.12)" stroke="#CFCBC1" stroke-width=".4"/>` +
    `<path d="M43 17.6l1.4 2.4M44.6 17.8l.6 2.6M46.2 17.6l-.4 2.6" stroke="#CFCBC1" stroke-width=".25"/>` +
    `<ellipse cx="44.6" cy="16.6" rx="3" ry="1.9" fill="none" stroke="#BDBAB2" stroke-width=".6"/>`
  return {
    x: 26,
    css: `.crawl{animation:crawl 4s linear infinite}
@keyframes crawl{0%{transform:translateX(50px)}45%,50%{transform:translateX(31px)}95%,100%{transform:translateX(50px)}}
.flip{animation:flip 4s steps(1,end) infinite;transform-origin:50% 50%}
@keyframes flip{0%{transform:scaleX(1)}47.5%{transform:scaleX(-1)}97.5%{transform:scaleX(1)}}
.legs{animation:legs .2s steps(2,end) infinite}
@keyframes legs{0%{transform:translateX(-.15px)}100%{transform:translateX(.15px)}}
.swing{animation:swing 4s ease-in-out infinite;transform-origin:100% 100%}
@keyframes swing{0%,18%{transform:rotate(0)}27%,32%{transform:rotate(-58deg)}42%,64%{transform:rotate(0)}73%,78%{transform:rotate(-46deg)}88%,100%{transform:rotate(0)}}
.track{animation:track 4s ease-in-out infinite}
@keyframes track{0%{transform:translateX(-.3px)}45%,50%{transform:translateX(-1.6px)}95%,100%{transform:translateX(-.3px)}}`,
    body:
      `<ellipse cx="41" cy="35.6" rx="13" ry=".6" fill="#000" opacity=".06"/>` +
      `<g class="crawl"><g class="flip">${bug}</g></g>` +
      `<g class="swing">${net}</g>` +
      clawd({
        eyes: eyes(0, 0.4, 'track'),
        armL: r(56, 24, 4, 2.2, P.body),
      }),
  }
}

function memory(): Built {
  const lines: [number, number][] = [
    [25, 8.5],
    [26.6, 9],
    [28.2, 7.5],
    [29.8, 9],
    [31.4, 5],
  ]
  const period = 100 / lines.length
  const lineCss = lines
    .map((_, i) => {
      const s = +(i * period).toFixed(2)
      const e = +(s + period * 0.8).toFixed(2)
      return `.m${i}{transform-origin:0 50%;animation:m${i} 6s infinite}
@keyframes m${i}{0%${s ? `,${s}%` : ''}{transform:scaleX(0);opacity:1;animation-timing-function:steps(8,end)}${e}%,94%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}`
    })
    .join('\n')
  const heart = (delay: number, dx: number) =>
    `<g transform="translate(${69 + dx} 21.5)"><g class="heart" style="animation-delay:${delay}s">` +
    `<path d="M0 1C-2-.3-1.2-2 0-.8C1.2-2 2-.3 0 1Z" fill="#E38C9A"/></g></g>`
  const book =
    r(55.8, 22.6, 26.4, 10.9, '#D9707F', 'rx=".9"') +
    r(56.8, 23.3, 11.8, 9.6, P.paper) +
    r(69.4, 23.3, 11.8, 9.6, P.paper) +
    r(68.6, 22.6, 0.8, 10.9, '#B85A68') +
    [25, 26.6, 28.2, 29.8].map((y, i) => r(58, y, [9, 8, 9.4, 6][i], 0.55, '#C2BDB2')).join('') +
    `<path d="M65 31.6C64 30.8 64.6 29.9 65.4 30.6C66.2 29.9 66.8 30.8 65.8 31.6L65.4 31.9Z" fill="#E38C9A" opacity=".8"/>` +
    lines.map(([y, w], i) => r(70.6, y, w, 0.55, '#6B6A65', `class="m${i}"`)).join('')
  const pencil =
    `<g class="scrib"><g transform="rotate(35 80 29)" ${ATTR}>` +
    r(79.4, 24.6, 1.2, 5.4, P.yellow) +
    r(79.4, 23.7, 1.2, 0.9, '#E38C9A') +
    `<path d="M79.4 30h1.2l-.6 1.3Z" fill="#E9D3B0"/>` +
    `</g></g>`
  return {
    x: 50,
    css: `${lineCss}
.heart{opacity:0;animation:heart 3.9s ease-out infinite;transform-origin:50% 50%}
@keyframes heart{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:1}50%{transform:translate(-1.2px,-6px) scale(1)}100%{opacity:0;transform:translate(1px,-12px) scale(1.15)}}
.scrib{animation:scrib .5s ease-in-out infinite}
@keyframes scrib{0%,100%{transform:translate(0,0)}25%{transform:translate(-.6px,.3px)}50%{transform:translate(-.2px,-.3px)}75%{transform:translate(-.8px,0)}}
.look{animation:look 1.2s ease-in-out infinite alternate}
@keyframes look{0%{transform:translateX(-.4px)}100%{transform:translateX(.6px)}}`,
    body:
      DESK_SHADOW +
      behind({ eyes: eyes(0, DOWN, 'look') }) +
      heart(0, -1) +
      heart(-1.3, 1.5) +
      heart(-2.6, 0) +
      book +
      r(53.8, 26, 2.2, 3, P.body) +
      pencil +
      r(82, 26, 2, 3, P.body),
  }
}

function database(): Built {
  const disc = (top: number, i: number) =>
    r(38, top, 14, 3.6, '#5E7FA8') +
    `<ellipse cx="45" cy="${top + 3.6}" rx="7" ry="1.6" fill="#4C6B91"/>` +
    `<ellipse cx="45" cy="${top}" rx="7" ry="1.6" fill="#86A6CC"/>` +
    c(49.6, top + 2.4, 0.55, '#7BD389', `class="led" style="animation-delay:${i * 0.25}s"`)
  const packet = (color: string, delay: number, isBack: boolean) =>
    `<g transform="translate(${isBack ? 58 : 52.6} ${isBack ? 28.4 : 25.4})"><g class="${isBack ? 'pktb' : 'pkt'}" style="animation-delay:${delay}s">` +
    r(-0.6, -0.6, 1.2, 1.2, color, 'rx=".2"') +
    `</g></g>`
  return {
    x: 30,
    css: `.led{animation:led 1s steps(1,end) infinite}
@keyframes led{0%{opacity:1}25%{opacity:.2}}
.pkt{opacity:0;animation:pkt 1.5s linear infinite}
@keyframes pkt{0%{opacity:0;transform:translateX(0)}15%,85%{opacity:1}100%{opacity:0;transform:translateX(5px)}}
.pktb{opacity:0;animation:pktb 1.5s linear infinite}
@keyframes pktb{0%{opacity:0;transform:translateX(0)}15%,85%{opacity:1}100%{opacity:0;transform:translateX(-5px)}}
.gloss{animation:gloss 2.4s ease-in-out infinite}
@keyframes gloss{0%,100%{opacity:.25}50%{opacity:.6}}`,
    body:
      `<ellipse cx="45" cy="35.5" rx="8.5" ry=".8" fill="#000" opacity=".12"/>` +
      disc(29, 2) +
      disc(24.6, 1) +
      disc(20.2, 0) +
      `<ellipse class="gloss" cx="43" cy="19.8" rx="3.4" ry=".6" fill="#FFFFFF"/>` +
      packet(P.body, 0, false) +
      packet('#7BD389', -0.75, false) +
      packet('#7FA7D9', -0.4, true) +
      packet(P.yellow, -1.15, true) +
      clawd({
        eyes: eyes(-1.4, 0.2),
        armL: r(57, 24, 3, 3, P.body, 'class="tap"'),
      }),
  }
}

function design(): Built {
  const strokes = [
    `<circle cx="43.6" cy="17.6" r="1.8" pathLength="1" fill="none" stroke="${P.yellow}" stroke-width="1.2" class="s0"/>`,
    `<path d="M34.4 17Q36.4 15.4 38.6 17.2" pathLength="1" fill="none" stroke="#7FA7D9" stroke-width="1" stroke-linecap="round" class="s1"/>`,
    `<path d="M33.8 25.4Q37 20.6 40.2 24Q42.6 21.4 46.2 25.4" pathLength="1" fill="none" stroke="${P.mint}" stroke-width="1.1" stroke-linecap="round" class="s2"/>`,
  ].join('')
  const spans: [number, number][] = [
    [0, 20],
    [20, 42],
    [42, 66],
  ]
  const strokeCss = spans
    .map(
      ([s, e], i) => `.s${i}{stroke-dasharray:1;stroke-dashoffset:1;animation:s${i} 6s infinite}
@keyframes s${i}{0%${s ? `,${s}%` : ''}{stroke-dashoffset:1;opacity:1}${e}%,92%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}`,
    )
    .join('\n')
  const easel =
    `<path d="M40 12.5V35" stroke="#6B4A35" stroke-width=".8"/>` +
    `<path d="M40 12.5L34.5 35.4M40 12.5L45.5 35.4" stroke="#8A6A4F" stroke-width="1" stroke-linecap="round"/>` +
    r(32.6, 13.6, 14.8, 13.6, P.paper, `stroke="#CFCBC1" stroke-width=".5"`) +
    strokes +
    r(31.6, 27.2, 16.8, 1.1, '#8A6A4F', 'rx=".3"')
  const brush =
    `<g class="brush">` +
    r(56, 24, 4, 2.2, P.body) +
    `<path d="M57 24.8L49.6 19.4" stroke="#B98B5E" stroke-width=".9" stroke-linecap="round"/>` +
    `<path d="M49.9 19.6L49.2 19.1" stroke="#BDBAB2" stroke-width="1.1"/>` +
    c(48.8, 18.8, 0.7, P.red) +
    `</g>`
  const palette =
    `<ellipse cx="81.6" cy="27.8" rx="2.3" ry="1.5" fill="#E9D3B0" stroke="#C9AE86" stroke-width=".3"/>` +
    c(80.8, 27.4, 0.45, P.red) +
    c(82.2, 27.2, 0.45, '#7FA7D9') +
    c(81.9, 28.4, 0.45, P.mint)
  const beret =
    `<ellipse cx="66.5" cy="17.7" rx="6.2" ry="1.5" fill="${P.ink}"/>` + c(66.5, 16.1, 0.55, P.ink)
  return {
    x: 26,
    css: `${strokeCss}
.brush{animation:brush 1.2s ease-in-out infinite}
@keyframes brush{0%,100%{transform:translate(0,0)}30%{transform:translate(-1.4px,.6px)}55%{transform:translate(-.8px,-.7px)}80%{transform:translate(-1.6px,.2px)}}`,
    body:
      easel +
      brush +
      clawd({
        eyes: eyes(-1.4, -0.2),
        armL: '',
        armR: r(78, 25.6, 3, 2.4, P.body),
        hat: beret,
      }) +
      palette,
  }
}

function build(): Built {
  const block = (x: number, y: number, w: number, color: string, light: string) =>
    r(x + 1.2, y - 0.7, 1.6, 0.7, color, 'rx=".2"') +
    r(x + w - 2.8, y - 0.7, 1.6, 0.7, color, 'rx=".2"') +
    r(x, y, w, 4, color, 'rx=".4"') +
    r(x, y, w, 0.6, light, 'rx=".3"')
  const blocks: [number, number, number, string, string][] = [
    [42, 31.4, 9, '#7FA7D9', '#A6C2E6'],
    [42.6, 26.7, 7.8, P.yellow, '#F3CB6E'],
    [43.2, 22, 6.6, P.red, '#F29489'],
  ]
  const blockCss = blocks
    .map((_, i) => {
      const s = i * 22
      return `.b${i}{animation:b${i} 4s infinite}
@keyframes b${i}{0%${s ? `,${s}%` : ''}{opacity:0;transform:translateY(-14px);animation-timing-function:ease-in}${s + 1}%{opacity:1}${s + 9}%{transform:translateY(0);animation-timing-function:ease-out}${s + 12}%{transform:translateY(-1.2px);animation-timing-function:ease-in}${s + 15}%,90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(0)}}`
    })
    .join('\n')
  const hardHat =
    `<path d="M61.2 18.3C61.2 13.6 76.8 13.6 76.8 18.3Z" fill="${P.yellow}"/>` +
    r(68.4, 14, 1.2, 4.3, '#F3CB6E', 'rx=".4"') +
    r(59.6, 17.7, 18.8, 1.1, '#CC9433', 'rx=".5"')
  const hammer =
    `<g class="hammer">` +
    r(54.6, 24.6, 5.4, 2.2, P.body) +
    r(52.6, 22.4, 0.8, 4.4, '#8A6A4F') +
    r(51.4, 21.4, 3.2, 1.6, '#6B6A65', 'rx=".3"') +
    `</g>`
  return {
    x: 32,
    css: `${blockCss}
.hammer{animation:hammer .6s ease-in-out infinite}
@keyframes hammer{0%,100%{transform:translate(0,0)}35%{transform:translate(-.4px,1px)}}`,
    body:
      `<ellipse cx="46.5" cy="35.6" rx="6.5" ry=".7" fill="#000" opacity=".12"/>` +
      blocks.map(([x, y, w, color, light], i) => `<g class="b${i}">${block(x, y, w, color, light)}</g>`).join('') +
      hammer +
      clawd({
        eyes: eyes(-1.5, -0.4),
        armL: '',
        hat: hardHat,
      }),
  }
}

function done(): Built {
  const colors = [P.body, P.yellow, P.mint, '#7FA7D9', '#C9A7E0', P.red]
  const bits = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + (i % 2) * 0.2
    const dist = 9 + (i % 3) * 3
    const tx = Math.cos(a) * dist
    const ty = Math.sin(a) * dist * 0.7 - 4
    return { i, tx, ty, color: colors[i % colors.length], rot: (i * 47) % 360, delay: (i % 4) * 0.08 }
  })
  const confettiCss = bits
    .map(
      b => `.cf${b.i}{animation:cf${b.i} 1.9s cubic-bezier(.2,.7,.3,1) ${b.delay}s infinite}
@keyframes cf${b.i}{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:1}70%{opacity:1;transform:translate(${b.tx.toFixed(1)}px,${b.ty.toFixed(1)}px) rotate(${b.rot}deg)}100%{opacity:0;transform:translate(${b.tx.toFixed(1)}px,${(b.ty + 5).toFixed(1)}px) rotate(${b.rot + 90}deg)}}`,
    )
    .join('\n')
  const confetti = bits
    .map(b => `<g transform="translate(69 15)"><g class="cf${b.i}">${r(-0.6, -0.35, 1.2, 0.7, b.color)}</g></g>`)
    .join('')
  const happy =
    `<polyline points="63,23.8 64.6,22 66.2,23.8" fill="none" stroke="${P.eye}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<polyline points="71.8,23.8 73.4,22 75,23.8" fill="none" stroke="${P.eye}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`
  return {
    x: 46,
    css: `${confettiCss}
.jump{animation:jump .95s cubic-bezier(.3,0,.4,1) infinite}
@keyframes jump{0%,100%{transform:translateY(0) scaleY(.96)}45%{transform:translateY(-3.2px) scaleY(1.03)}}
.jump{transform-origin:50% 100%}
.sh{animation:sh .95s cubic-bezier(.3,0,.4,1) infinite;transform-origin:50% 50%}
@keyframes sh{0%,100%{transform:scaleX(1);opacity:.13}45%{transform:scaleX(.7);opacity:.07}}
.arms{animation:arms .95s ease-in-out infinite}
@keyframes arms{0%,100%{transform:translateY(.6px)}45%{transform:translateY(-.4px)}}`,
    body:
      confetti +
      clawd(
        {
          whole: 'jump',
          upper: '',
          eyes: happy,
          armL: `<g class="arms">${r(57, 15.5, 3, 4.5, P.body)}</g>`,
          armR: `<g class="arms">${r(78, 15.5, 3, 4.5, P.body)}</g>`,
        },
        `<g class="sh">${SHADOW}</g>`,
      ),
  }
}

function oops(): Built {
  const x = (cx: number) =>
    `<path d="M${cx - 1.1} 21.9l2.2 2.2M${cx + 1.1} 21.9l-2.2 2.2" stroke="${P.eye}" stroke-width="1" stroke-linecap="round"/>`
  return {
    x: 50,
    css: `.shake{animation:shake 2.4s ease-in-out infinite}
@keyframes shake{0%,30%,100%{transform:translateX(0)}4%,12%,20%{transform:translateX(-.5px)}8%,16%,24%{transform:translateX(.5px)}}
.drop{animation:drop 1.6s ease-in infinite;opacity:0}
@keyframes drop{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(4px)}}`,
    body:
      clawd({ whole: 'shake', eyes: x(65) + x(73) }) +
      `<g transform="translate(79.5 15.5)"><g class="drop"><path d="M0 0C.9 1.3 1.5 2.2 1.5 2.9A1.5 1.5 0 0 1-1.5 2.9C-1.5 2.2-.9 1.3 0 0Z" fill="#7FB2E5"/></g></g>`,
  }
}

const BUILDERS: Record<Activity, () => Built> = {
  idle,
  sleep,
  thinking,
  writing,
  coding,
  web,
  reading,
  bash,
  agents,
  todo,
  ask,
  browser,
  testing,
  commit,
  deploy,
  waiting,
  debugging,
  memory,
  database,
  design,
  build,
  done,
  oops,
}

const cache = new Map<Activity, { source: string; width: number; height: number }>()

export function renderScene(activity: Activity) {
  const hit = cache.get(activity)
  if (hit) return hit
  const built = BUILDERS[activity]()
  const w = RIGHT - built.x
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${built.x} 0 ${w} ${HEIGHT}" width="${w * SCALE}" height="${HEIGHT * SCALE}">` +
    `<style>${BASE_CSS}${built.css ?? ''}</style>` +
    built.body +
    `</svg>`
  const out = { source, width: w * SCALE, height: HEIGHT * SCALE }
  cache.set(activity, out)
  return out
}

export const ACTIVITIES = Object.keys(BUILDERS) as Activity[]
