// Skins: a hat on his head or something in his right hand. Drawn in the same
// coordinates as the scenes (body x 60..78, y 18..31; right hand x 78..81,
// y 24..27), inside his breathing group so they move with him.

export type SkinKind = 'hat' | 'hand'

export type Skin = {
  id: string
  label: string
  emoji: string
  kind: SkinKind
  svg: string
  css?: string
}

const star = (x: number, y: number, s: number, fill: string, cls = '') =>
  `<path${cls ? ` class="${cls}"` : ''} d="M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3} ${x + s} ${y} ${x + s * 0.3} ${y + s * 0.3} ${x} ${y + s} ${x - s * 0.3} ${y + s * 0.3} ${x - s} ${y} ${x - s * 0.3} ${y - s * 0.3}Z" fill="${fill}"/>`

export const SKINS: Skin[] = [
  {
    id: 'crown',
    label: 'Crown',
    emoji: '👑',
    kind: 'hat',
    svg:
      `<path d="M62 18V12.8L65 15 69 11.4 73 15 76 12.8V18Z" fill="#E8B04B"/>` +
      `<rect x="62" y="16.6" width="14" height="1.4" fill="#C9932E"/>` +
      `<circle cx="69" cy="17.3" r=".65" fill="#E96B5F"/>` +
      `<circle cx="65.2" cy="17.3" r=".5" fill="#7FA7D9"/>` +
      `<circle cx="72.8" cy="17.3" r=".5" fill="#6BBE6E"/>` +
      `<circle cx="69" cy="11.4" r=".55" fill="#F7E3A1"/>` +
      star(74.6, 12.4, 0.9, '#FFF6D6', 'sk-tw'),
    css: `.sk-tw{animation:sk-tw 2.4s ease-in-out infinite;transform-origin:50% 50%}
@keyframes sk-tw{0%,70%,100%{opacity:0;transform:scale(.3)}80%{opacity:1;transform:scale(1)}}`,
  },
  {
    id: 'wizard',
    label: 'Wizard hat',
    emoji: '🧙',
    kind: 'hat',
    svg:
      `<path d="M63 18L68.6 6.4Q69.4 5.6 70 6.6L75 18Z" fill="#5B4B9E"/>` +
      `<ellipse cx="69" cy="18" rx="8.2" ry="1.3" fill="#4A3D82"/>` +
      star(68.6, 12, 0.9, '#F2D06B', 'sk-tw') +
      star(71.4, 15.4, 0.7, '#F2D06B') +
      star(66.4, 15.8, 0.55, '#F7E3A1'),
    css: `.sk-tw{animation:sk-tw 1.8s ease-in-out infinite;transform-origin:50% 50%}
@keyframes sk-tw{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}`,
  },
  {
    id: 'cowboy',
    label: 'Cowboy hat',
    emoji: '🤠',
    kind: 'hat',
    svg:
      `<path d="M64 17.6C64 13 74 13 74 17.6Z" fill="#9C6B3F"/>` +
      `<path d="M67.6 13.9Q69 14.9 70.4 13.9" fill="none" stroke="#7E5430" stroke-width=".5"/>` +
      `<rect x="64.2" y="16" width="9.6" height="1" fill="#5E3F22"/>` +
      `<path d="M58.6 18.4Q69 15.4 79.4 18.4Q69 20 58.6 18.4Z" fill="#8A5C33"/>`,
  },
  {
    id: 'viking',
    label: 'Viking helmet',
    emoji: '⚔️',
    kind: 'hat',
    svg:
      `<path d="M62.6 16C59.4 15.5 58.5 12.4 59.5 10.4C60.3 12.9 61.6 13.7 63.2 13.9Z" fill="#F1EEE6" stroke="#CFCBC1" stroke-width=".3"/>` +
      `<path d="M75.4 16C78.6 15.5 79.5 12.4 78.5 10.4C77.7 12.9 76.4 13.7 74.8 13.9Z" fill="#F1EEE6" stroke="#CFCBC1" stroke-width=".3"/>` +
      `<path d="M62.5 18C62.5 12.2 75.5 12.2 75.5 18Z" fill="#9CA3AB"/>` +
      `<rect x="68.4" y="12.4" width="1.2" height="5.4" fill="#B6BCC3"/>` +
      `<rect x="62" y="16.8" width="14" height="1.4" rx=".5" fill="#7A828B"/>` +
      `<circle cx="64.2" cy="17.5" r=".35" fill="#D8DCE0"/><circle cx="69" cy="17.5" r=".35" fill="#D8DCE0"/><circle cx="73.8" cy="17.5" r=".35" fill="#D8DCE0"/>`,
  },
  {
    id: 'party',
    label: 'Party hat',
    emoji: '🥳',
    kind: 'hat',
    svg:
      `<clipPath id="sk-party"><path d="M65.4 18L69 9.6L72.6 18Z"/></clipPath>` +
      `<path d="M65.4 18L69 9.6L72.6 18Z" fill="#7FA7D9"/>` +
      `<g clip-path="url(#sk-party)"><path d="M64 13.4L74 11.4M64 16.4L74 14.4" stroke="#E8B04B" stroke-width="1.1"/></g>` +
      `<circle cx="69" cy="9.4" r="1.05" fill="#E96B5F"/>`,
  },
  {
    id: 'tophat',
    label: 'Top hat',
    emoji: '🎩',
    kind: 'hat',
    svg:
      `<rect x="64.5" y="10.4" width="9" height="7" fill="#2B2A27"/>` +
      `<rect x="64.5" y="15" width="9" height="1.3" fill="#D97757"/>` +
      `<rect x="65.2" y="11" width=".6" height="3.6" fill="#4A4945"/>` +
      `<rect x="62" y="17" width="14" height="1.3" rx=".6" fill="#2B2A27"/>`,
  },
  {
    id: 'beanie',
    label: 'Beanie',
    emoji: '🧢',
    kind: 'hat',
    svg:
      `<path d="M62 18.2C62 12.8 76 12.8 76 18.2Z" fill="#7FA7D9"/>` +
      `<path d="M66 13.6V16.4M69 13V16.4M72 13.6V16.4" stroke="#6A92C4" stroke-width=".5"/>` +
      `<rect x="61.6" y="16.4" width="14.8" height="2.2" rx=".8" fill="#6A92C4"/>` +
      `<circle cx="69" cy="12.2" r="1.5" fill="#FBF9F4"/>`,
  },
  {
    id: 'headphones',
    label: 'Headphones',
    emoji: '🎧',
    kind: 'hat',
    svg:
      `<path d="M60.6 21.6C60.6 11.6 77.4 11.6 77.4 21.6" fill="none" stroke="#3B3A36" stroke-width="1.4"/>` +
      `<rect x="58.4" y="20" width="2.6" height="4.6" rx=".7" fill="#3B3A36"/>` +
      `<rect x="77" y="20" width="2.6" height="4.6" rx=".7" fill="#3B3A36"/>` +
      `<rect x="58.9" y="21.2" width=".6" height="2.2" fill="#D97757"/>` +
      `<rect x="78.5" y="21.2" width=".6" height="2.2" fill="#D97757"/>`,
  },
  {
    id: 'halo',
    label: 'Halo',
    emoji: '😇',
    kind: 'hat',
    svg: `<g class="sk-halo"><ellipse cx="69" cy="13.6" rx="5" ry="1.25" fill="none" stroke="#F2D06B" stroke-width=".9"/></g>`,
    css: `.sk-halo{animation:sk-halo 2.6s ease-in-out infinite}
@keyframes sk-halo{0%,100%{transform:translateY(0)}50%{transform:translateY(-.7px)}}`,
  },
  {
    id: 'pumpkin',
    label: 'Pumpkin',
    emoji: '🎃',
    kind: 'hat',
    svg:
      `<rect x="68.4" y="9.4" width="1.2" height="2" rx=".3" fill="#5E8C3E"/>` +
      `<ellipse cx="69" cy="14.6" rx="5.8" ry="3.7" fill="#E8892E"/>` +
      `<path d="M66 11.4Q64.6 14.6 66 17.8M72 11.4Q73.4 14.6 72 17.8M69 10.9V18.3" fill="none" stroke="#C96E1F" stroke-width=".45"/>` +
      `<path d="M65.6 13.4L67 13.4 66.3 14.6Z M71 13.4L72.4 13.4 71.7 14.6Z" fill="#3B2A1A"/>` +
      `<path d="M65.8 15.6Q69 17.6 72.2 15.6Q69 16.4 65.8 15.6Z" fill="#3B2A1A"/>`,
  },
  {
    id: 'coffee',
    label: 'Coffee',
    emoji: '☕',
    kind: 'hand',
    svg:
      `<path d="M83.6 22.4h.7a1.1 1.1 0 0 1 0 2.2h-.7" fill="none" stroke="#BDB8AC" stroke-width=".55"/>` +
      `<rect x="80.4" y="21.4" width="3.4" height="3.6" rx=".5" fill="#FBF9F4" stroke="#BDB8AC" stroke-width=".35"/>` +
      `<rect x="80.6" y="21.6" width="3" height=".7" fill="#7A5236"/>` +
      `<rect x="80.4" y="23.1" width="3.4" height=".7" fill="#D97757"/>` +
      `<g class="sk-steam"><path d="M81.6 20.6c-.5-.6.5-1.1 0-1.7s.5-1.1 0-1.7" fill="none" stroke="#B9B6AE" stroke-width=".4" stroke-linecap="round"/></g>`,
    css: `.sk-steam{animation:sk-steam 2.2s ease-out infinite;opacity:0}
@keyframes sk-steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.85}100%{opacity:0;transform:translateY(-1.8px)}}`,
  },
  {
    id: 'sword',
    label: 'Sword',
    emoji: '🗡️',
    kind: 'hand',
    svg:
      `<path d="M81.6 22.8V12.6L82.1 11.4 82.6 12.6V22.8Z" fill="#D8DCE0"/>` +
      `<rect x="82" y="13" width=".25" height="9.4" fill="#F4F6F8"/>` +
      `<rect x="79.9" y="22.6" width="4.4" height=".9" rx=".3" fill="#C9932E"/>` +
      `<rect x="81.6" y="23.5" width="1" height="2.6" fill="#6B4A35"/>` +
      `<circle cx="82.1" cy="26.6" r=".6" fill="#C9932E"/>` +
      `<g class="sk-glint">${star(82.1, 14.2, 0.9, '#FFFFFF')}</g>`,
    css: `.sk-glint{animation:sk-glint 2.6s ease-in-out infinite;opacity:0;transform-origin:50% 50%}
@keyframes sk-glint{0%,75%,100%{opacity:0;transform:translateY(0) scale(.4)}85%{opacity:1;transform:translateY(3px) scale(1)}}`,
  },
  {
    id: 'balloon',
    label: 'Balloon',
    emoji: '🎈',
    kind: 'hand',
    svg:
      `<g class="sk-float">` +
      `<path d="M80.8 25Q83.6 19 83 11.2" fill="none" stroke="#8A877F" stroke-width=".3"/>` +
      `<ellipse cx="83.4" cy="7.8" rx="2.7" ry="3.3" fill="#E96B5F"/>` +
      `<path d="M82.8 11L84 11 83.4 11.8Z" fill="#C9564B"/>` +
      `<ellipse cx="82.4" cy="6.6" rx=".6" ry="1" fill="#F7A49B"/>` +
      `</g>`,
    css: `.sk-float{animation:sk-float 3s ease-in-out infinite;transform-origin:0 100%}
@keyframes sk-float{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}`,
  },
  {
    id: 'wand',
    label: 'Magic wand',
    emoji: '🪄',
    kind: 'hand',
    svg:
      `<path d="M80.8 25.4L84.4 19.8" stroke="#3B3A36" stroke-width=".9" stroke-linecap="round"/>` +
      `<path d="M84 20.4L84.4 19.8" stroke="#FBF9F4" stroke-width=".9" stroke-linecap="round"/>` +
      star(84.9, 19, 1.3, '#F2D06B') +
      `<g class="sk-spark">${star(86.6, 16.8, 0.6, '#F7E3A1')}${star(83.6, 16.4, 0.45, '#F7E3A1')}</g>`,
    css: `.sk-spark{animation:sk-spark 1.4s ease-in-out infinite;transform-origin:50% 100%}
@keyframes sk-spark{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-1px)}}`,
  },
  {
    id: 'flower',
    label: 'Flower',
    emoji: '🌸',
    kind: 'hand',
    svg:
      `<path d="M80.8 25.4Q81.4 21.4 82.8 18.4" fill="none" stroke="#5E8C3E" stroke-width=".55"/>` +
      `<path d="M81.3 22.4Q79.8 21.4 80.2 20.4Q81.4 21 81.3 22.4Z" fill="#6BBE6E"/>` +
      `<g class="sk-sway">` +
      [0, 72, 144, 216, 288]
        .map(a => {
          const rad = (a * Math.PI) / 180
          return `<circle cx="${(82.9 + Math.cos(rad) * 1.05).toFixed(2)}" cy="${(17.6 + Math.sin(rad) * 1.05).toFixed(2)}" r=".85" fill="#F29BB3"/>`
        })
        .join('') +
      `<circle cx="82.9" cy="17.6" r=".6" fill="#E8B04B"/></g>`,
    css: `.sk-sway{animation:sk-sway 2.8s ease-in-out infinite;transform-origin:50% 100%}
@keyframes sk-sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}`,
  },
]

export const SKIN_IDS = SKINS.map(s => s.id)

export function skinById(id: string): Skin | undefined {
  return SKINS.find(s => s.id === id)
}
