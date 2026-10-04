import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Activity, Place, Scene, Stats } from '../types'
import { classify } from './classify'
import { ACTIVITIES, renderHello, renderScene } from './scenes'
import { SKINS, skinById } from './skins'

const scene = atom({ plugin: 'clawd-friend', key: 'scene' } as const, {
  activity: 'idle',
  detail: '',
} as Scene)

const isOn = atom({ plugin: 'clawd-friend', key: 'isOn' } as const, true)
const preview = atom({ plugin: 'clawd-friend', key: 'preview' } as const, null as Activity | null)
const place = atom({ plugin: 'clawd-friend', key: 'place' } as const, 'stage' as Place)
const skin = atom({ plugin: 'clawd-friend', key: 'skin' } as const, '')
const friendName = atom({ plugin: 'clawd-friend', key: 'name' } as const, 'Clawd')
const isArriving = atom({ plugin: 'clawd-friend', key: 'isArriving' } as const, false)

const PANE = 'friend'
const PREVIEW_MS = 6_000
const ARRIVAL_MS = 4_500
const DEFAULT_NAME = 'Clawd'
const NAME_MAX = 16

const LABELS: Record<Activity, string> = {
  idle: 'is chilling',
  sleep: 'is napping',
  thinking: 'is thinking',
  writing: 'is writing',
  coding: 'is coding',
  web: 'is searching the web',
  reading: 'is reading files',
  bash: 'is running a command',
  agents: 'is sending helpers',
  todo: 'is planning',
  ask: 'has a question',
  browser: 'is browsing',
  testing: 'is running tests',
  commit: 'is committing',
  deploy: 'is deploying',
  waiting: 'is waiting for your OK',
  debugging: 'is debugging',
  memory: 'is noting something down',
  database: 'is working with the database',
  design: 'is designing',
  build: 'is building',
  done: 'is done!',
  oops: 'hit a snag',
}

const GLYPHS: Record<Activity, string> = {
  idle: '(•‿•)',
  sleep: '(-‿-) zZ',
  thinking: '(•‿•) 💭',
  writing: '(•‿•) ⌨',
  coding: '(•‿•) 💻',
  web: '(•‿•) 📰',
  reading: '(•‿•) 🔍',
  bash: '(•‿•) ⚙',
  agents: '(•‿•) ⇠ ••',
  todo: '(•‿•) 📋',
  ask: '(•‿•) ❓',
  browser: '(•‿•) 🌐',
  testing: '(•‿•) 🧪',
  commit: '(•‿•) 📦',
  deploy: '(•‿•) 🚀',
  waiting: '(•‿•) [OK?]',
  debugging: '(•‿•) 🐞',
  memory: '(•‿•) 📔',
  database: '(•‿•) 🗄',
  design: '(•‿•) 🎨',
  build: '(•‿•) 🧱',
  done: '\\(^‿^)/ ✨',
  oops: '(×_×) 💧',
}

// Which tally each tool activity counts toward in /friend stats.
const TALLY: Partial<Record<Activity, keyof Omit<Stats, 'day'>>> = {
  coding: 'edits',
  writing: 'edits',
  design: 'edits',
  memory: 'edits',
  reading: 'reads',
  bash: 'commands',
  testing: 'commands',
  commit: 'commands',
  deploy: 'commands',
  build: 'commands',
  database: 'commands',
  debugging: 'commands',
  web: 'web',
  browser: 'web',
  agents: 'helpers',
  todo: 'plans',
  ask: 'questions',
}

const RESTING: ReadonlySet<Activity> = new Set(['idle', 'sleep', 'done', 'oops'])
const SLEEP_AFTER_MS = 120_000
const CELEBRATE_MS = 3_500

const basename = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? p
const clip = (s: string, n = 34) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function detailOf(tool: string, input: Record<string, unknown>): string {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')
  const path = str('file_path') || str('notebook_path') || str('path')
  if (path) return clip(basename(path))
  if (str('query')) return clip(`"${str('query')}"`)
  if (str('url')) return clip(str('url').replace(/^https?:\/\//, ''))
  if (str('pattern')) return clip(str('pattern'))
  if (str('command')) return clip(str('command').trim().split('\n')[0])
  if (str('description')) return clip(str('description'))
  return tool.startsWith('mcp__') ? clip(tool.split('__').pop() ?? tool) : ''
}

// Pull the fields detailOf reads out of a tool call's partial JSON as it streams.
const FIELD = /"(file_path|notebook_path|path|query|url|pattern|command|description|skill)"\s*:\s*"((?:[^"\\]|\\.)*)"/g

function partialInput(json: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const m of json.matchAll(FIELD)) {
    try {
      out[m[1]] = JSON.parse(`"${m[2]}"`)
    } catch {
      out[m[1]] = m[2]
    }
  }
  return out
}

let shown = ''
let timer: Timer | undefined
let previewTimer: Timer | undefined
let arrivalTimer: Timer | undefined
let stats: Stats | undefined
const running = new Map<string, Scene>()

function later($: EngineInterface, ms: number, fn: () => void) {
  timer?.cancel()
  timer = $.clock.after(ms, fn)
}

async function show($: EngineInterface, activity: Activity, detail = '') {
  const key = `${activity}|${detail}`
  if (key === shown) return
  shown = key
  if (activity === 'idle') later($, SLEEP_AFTER_MS, () => void show($, 'sleep'))
  else if (activity === 'done' || activity === 'oops') later($, CELEBRATE_MS, () => void show($, 'idle'))
  else if (activity !== 'sleep') {
    timer?.cancel()
    timer = undefined
  }
  try {
    await update($, scene, () => ({ activity, detail }))
  } catch {
    // A failed write only costs one frame of the animation.
  }
}

async function setOn($: EngineInterface, value: boolean) {
  await update($, isOn, () => value)
  await $.store.set('isOn', value)
}

async function setPlace($: EngineInterface, value: Place) {
  await update($, place, () => value)
  await $.store.set('place', value)
}

async function openPane($: EngineInterface) {
  return $.ui.open({ id: PANE, title: 'Friend' })
}

async function startPreview($: EngineInterface, activity: Activity) {
  previewTimer?.cancel()
  arrivalTimer?.cancel()
  await update($, isArriving, () => false)
  await update($, preview, () => activity)
  previewTimer = $.clock.after(PREVIEW_MS, () => void update($, preview, () => null))
}

// He waves hello with "<name> has arrived!" for a few seconds.
async function arrive($: EngineInterface) {
  arrivalTimer?.cancel()
  await update($, isArriving, () => true)
  arrivalTimer = $.clock.after(ARRIVAL_MS, () => void update($, isArriving, () => false))
}

async function setSkin($: EngineInterface, id: string) {
  await update($, skin, () => id)
  await $.store.set('skin', id)
}

// Names are drawn in his speech bubble: keep them short and plain.
function cleanName(raw: string) {
  return raw
    .replace(/[<>&"\\\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
}

async function setName($: EngineInterface, value: string) {
  await update($, friendName, () => value)
  await $.store.set('name', value)
}

// Shows him if he is hidden, and greets you either way.
async function callFriend($: EngineInterface) {
  await setOn($, true)
  if ((await read($, place)) === 'pane') await openPane($)
  await arrive($)
}

// ── Stats ────────────────────────────────────────────────────────────────

const emptyStats = (day: string): Stats => ({
  day,
  edits: 0,
  reads: 0,
  commands: 0,
  web: 0,
  helpers: 0,
  plans: 0,
  questions: 0,
  done: 0,
  snags: 0,
})

async function today($: EngineInterface) {
  const d = new Date(await $.clock.now())
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// The tally lives in this module and is written through to $.store, so
// parallel tool calls never race a read of the store.
async function loadStats($: EngineInterface) {
  const day = await today($)
  const saved = (await $.store.get('stats')) as Stats | undefined
  stats = saved && saved.day === day ? { ...emptyStats(day), ...saved } : emptyStats(day)
  return stats
}

async function count($: EngineInterface, key: keyof Omit<Stats, 'day'>) {
  try {
    const day = await today($)
    if (!stats || stats.day !== day) await loadStats($)
    if (!stats) return
    stats[key] += 1
    await $.store.set('stats', stats)
  } catch {
    // Stats are a nicety; never let them get in the way of a tool call.
  }
}

function statsText(s: Stats) {
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
  const total = s.edits + s.reads + s.commands + s.web + s.helpers + s.plans + s.questions
  if (total === 0 && s.done === 0) return 'Your friend has nothing to report yet today. Give Claude something to do!'
  return [
    `Today with your friend (${s.day}):`,
    `  💻 ${plural(s.edits, 'file edit')}`,
    `  🔍 ${plural(s.reads, 'file read or search', 'file reads and searches')}`,
    `  ⚡ ${plural(s.commands, 'command')}`,
    `  📰 ${plural(s.web, 'web lookup')}`,
    `  🐾 ${plural(s.helpers, 'helper sent', 'helpers sent')}`,
    `  📋 ${plural(s.plans, 'plan update')}`,
    `  ❓ ${plural(s.questions, 'question for you', 'questions for you')}`,
    `  🎉 ${plural(s.done, 'turn finished', 'turns finished')}${s.snags ? `, ${plural(s.snags, 'snag')}` : ''}`,
  ].join('\n')
}

// Every command, as the menu lists it.
const COMMANDS: [command: string, what: string][] = [
  ['/friend', 'call your friend, or send him off if he is here'],
  ['/friend menu', 'this menu'],
  ['/friend skins', 'pick a hat or something for his hand'],
  ['/friend <skin>', 'wear a skin, e.g. /friend crown (/friend noskin takes it off)'],
  ['/friend name <name>', 'give him a name, e.g. /friend name Bob'],
  ['/friend scenes', 'every scene he can play'],
  ['/friend <scene>', 'play a scene for a few seconds, e.g. /friend deploy'],
  ['/friend stats', 'what he saw today'],
  ['/friend pane', 'move him into a side pane (/friend stage brings him back)'],
]

// What each scene is called in the scenes list.
const SCENE_NAMES: Record<Activity, string> = {
  idle: '😌 chilling',
  sleep: '💤 napping',
  thinking: '💭 thinking',
  writing: '⌨️ writing',
  coding: '💻 coding',
  web: '📰 web search',
  reading: '🔍 reading',
  bash: '⚡ commands',
  agents: '🐾 subagents',
  todo: '📋 planning',
  ask: '👋 asking',
  browser: '🌐 browsing',
  testing: '🧪 tests',
  commit: '📦 commit',
  deploy: '🚀 deploy',
  waiting: '🪧 needs your OK',
  debugging: '🐞 debugging',
  memory: '📔 memory',
  database: '🗄️ database',
  design: '🎨 design',
  build: '🧱 build',
  done: '🎉 done',
  oops: '💧 oops',
}

function menuText(name: string) {
  return [`**${name}** · Claude Friend`, '', ...COMMANDS.map(([cmd, what]) => `- \`${cmd}\`: ${what}`)].join('\n')
}

function skinsText(current: string) {
  const line = (kind: 'hat' | 'hand') =>
    SKINS.filter(s => s.kind === kind)
      .map(s => `${s.emoji} \`/friend ${s.id}\`${s.id === current ? ' (wearing)' : ''}`)
      .join('  ')
  return ['**Skins**', '', `Hats: ${line('hat')}`, '', `In his hand: ${line('hand')}`, '', 'Take it off with `/friend noskin`.'].join('\n')
}

function scenesText() {
  return ['**Scenes** (play one with `/friend <scene>`)', '', ACTIVITIES.map(a => `\`${a}\` ${SCENE_NAMES[a]}`).join(' · ')].join('\n')
}

// ── Drawing ──────────────────────────────────────────────────────────────

async function currentActivity($: EngineInterface, isWorking: boolean) {
  const shownPreview = await read($, preview)
  if (shownPreview) return { activity: shownPreview, detail: '' }
  const now = await read($, scene)
  if (!isWorking && !RESTING.has(now.activity)) return { activity: 'idle' as Activity, detail: '' }
  if (isWorking && RESTING.has(now.activity)) return { activity: 'thinking' as Activity, detail: '' }
  return now
}

// What to draw right now: the hello wave while he arrives, else a played
// scene, else what Claude is doing. isWorking is null where the surface
// doesn't say (the pane), so the scene is drawn as it stands.
async function friendLook($: EngineInterface, isWorking: boolean | null) {
  const wearingId = await read($, skin)
  const worn = skinById(wearingId)
  if (await read($, isArriving)) {
    const name = await read($, friendName)
    return {
      art: renderHello(name, wearingId),
      alt: `${name} has arrived!`,
      glyph: `👋 ${name} has arrived! (•‿•)/${worn ? ` ${worn.emoji}` : ''}`,
    }
  }
  let now: Scene
  if (isWorking === null) {
    const shownPreview = await read($, preview)
    now = shownPreview ? { activity: shownPreview, detail: '' } : await read($, scene)
  } else {
    now = await currentActivity($, isWorking)
  }
  return {
    art: renderScene(now.activity, wearingId),
    // Only the character shows; the label lives on for screen readers.
    alt: `Claude ${LABELS[now.activity]}${now.detail ? `: ${now.detail}` : ''}`,
    glyph: `${GLYPHS[now.activity]}${worn ? ` ${worn.emoji}` : ''}`,
  }
}

async function moveTo($: EngineInterface, where: Place) {
  await setOn($, true)
  await setPlace($, where)
  if (where === 'pane') await openPane($)
  else await $.ui.close({ id: PANE })
}

async function wearSkin($: EngineInterface, id: string) {
  await setSkin($, id)
  await setOn($, true)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'friend',
      description: 'Call or send off your friend; /friend menu shows everything else',
      argumentHint: '[menu|skins|scenes|name <name>|<skin>|<scene>|stats|pane]',
    })
    const savedOn = await $.store.get('isOn')
    const savedPlace = await $.store.get('place')
    const savedSkin = await $.store.get('skin')
    const savedName = await $.store.get('name')
    await update($, isOn, () => savedOn !== false)
    await update($, place, () => (savedPlace === 'pane' ? 'pane' : 'stage'))
    await update($, preview, () => null)
    await update($, skin, () => (typeof savedSkin === 'string' && skinById(savedSkin) ? savedSkin : ''))
    await update($, friendName, () => (typeof savedName === 'string' && cleanName(savedName)) || DEFAULT_NAME)
    await loadStats($)
    await show($, 'idle')
    if (savedOn !== false) {
      if (savedPlace === 'pane') void openPane($)
      await arrive($)
    }
    return next(e)
  })

  on('command.run', { command: 'friend' }, async ($, e) => {
    const raw = e.args.trim()
    const arg = raw.toLowerCase()
    const name = await read($, friendName)

    // /friend calls him, or sends him off if he is already here.
    if (arg === '' || arg === 'on' || arg === 'off') {
      const value = arg === 'on' ? true : arg === 'off' ? false : !(await read($, isOn))
      if (value) {
        await callFriend($)
        return { text: `👋 ${name} has arrived!` }
      }
      await setOn($, false)
      if ((await read($, place)) === 'pane') await $.ui.close({ id: PANE })
      return { text: `${name} went for a walk. /friend calls them back.` }
    }

    if (arg === 'menu' || arg === 'help') return { text: menuText(name) }
    if (arg === 'skins' || arg === 'skin') return { text: skinsText(await read($, skin)) }
    if (arg === 'scenes') return { text: scenesText() }

    if (arg === 'name' || arg.startsWith('name ')) {
      const wanted = cleanName(raw.slice(4))
      if (!wanted) return { text: `Your friend is called ${name}. Rename them with /friend name <name>, e.g. /friend name Bob.` }
      await setName($, wanted)
      await callFriend($)
      return { text: `Nice to meet you! Your friend is now called ${wanted}.` }
    }

    if (arg === 'noskin' || arg === 'none') {
      await setSkin($, '')
      return { text: `${name} took the skin off.` }
    }

    const chosen = skinById(arg)
    if (chosen) {
      await setSkin($, chosen.id)
      await callFriend($)
      return { text: `${chosen.emoji} ${name} is wearing the ${chosen.label.toLowerCase()}.` }
    }

    if (arg === 'pane') {
      await setOn($, true)
      await setPlace($, 'pane')
      const opened = await openPane($)
      return {
        text: opened.isPlaced
          ? 'Your friend moved into a side pane. /friend stage brings him back above the prompt.'
          : 'Your friend will appear in a side pane once there is room for it.',
      }
    }

    if (arg === 'stage') {
      await setOn($, true)
      await setPlace($, 'stage')
      await $.ui.close({ id: PANE })
      return { text: 'Your friend is back above the prompt.' }
    }

    if (arg === 'stats') {
      const day = await today($)
      const s = stats && stats.day === day ? stats : await loadStats($)
      return { text: statsText(s) }
    }

    if ((ACTIVITIES as string[]).includes(arg)) {
      await setOn($, true)
      await startPreview($, arg as Activity)
      return { text: `Playing "${arg}" for a few seconds.` }
    }

    return { text: `There's no "${raw}" yet.\n\n${menuText(name)}` }
  })

  // The person closed the pane from its own mark: go back to the stage.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await setPlace($, 'stage')
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    running.clear()
    await show($, 'thinking')
    return next(e)
  })

  // The model's response as it streams: thinking, visible text, and the start
  // of each tool call (whose arguments can take a while to write, an Edit's
  // new content above all), so the friend switches props before the tool runs.
  on('turn.step', async function* ($, e, next) {
    const isMain = e.agentId === undefined
    const tools = new Map<number, { name: string; json: string }>()
    for await (const chunk of next(e)) {
      if (isMain) {
        try {
          if (chunk.kind === 'thinking') await show($, 'thinking')
          else if (chunk.kind === 'text' && chunk.text.trim()) await show($, 'writing')
          else if (chunk.kind === 'tool') {
            tools.set(chunk.index, { name: chunk.name, json: '' })
            await show($, classify(chunk.name), detailOf(chunk.name, {}))
          } else if (chunk.kind === 'input') {
            const t = tools.get(chunk.index)
            if (t && t.json.length < 8000) {
              t.json += chunk.json
              const input = partialInput(t.json)
              await show($, classify(t.name, input), detailOf(t.name, input))
            }
          }
        } catch {
          // Never let the friend get in the way of the response.
        }
      }
      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const input = e as unknown as Record<string, unknown>
    const id = e.tool_use_id ?? `${e.tool}:${running.size}`
    const now: Scene = {
      activity: classify(e.tool, input),
      detail: detailOf(e.tool, input),
    }
    running.set(id, now)
    await show($, now.activity, now.detail)
    const tally = TALLY[now.activity]
    if (tally) await count($, tally)
    try {
      return await next(e)
    } finally {
      running.delete(id)
      const still = [...running.values()].pop()
      if (still) await show($, still.activity, still.detail)
      else await show($, 'thinking')
    }
  })

  // The engine settles whether a call may run inside tool.call's next(). When
  // the answer is to ask the person, he holds up an OK? sign; the app reports
  // no moment of approval, so the sign stays until the call finishes.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    // Only calls tool.call is tracking: the main conversation's, not a
    // subagent's and not another plugin's query.
    const id = e.tool_use_id
    if (id && running.has(id) && verdict.decision === 'ask') {
      try {
        const input = (e.input ?? {}) as Record<string, unknown>
        const waitingScene: Scene = { activity: 'waiting', detail: detailOf(e.tool, input) }
        running.set(id, waitingScene)
        await show($, waitingScene.activity, waitingScene.detail)
      } catch {
        // The sign is a nicety; the verdict stands either way.
      }
    }
    return verdict
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      running.clear()
      if (e.reason === 'answer') {
        await show($, 'done')
        await count($, 'done')
      } else if (e.reason === 'aborted') {
        await show($, 'idle')
      } else {
        await show($, 'oops')
        await count($, 'snags')
      }
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOn)) || (await read($, place)) === 'pane') return next(e)

    const look = await friendLook($, e.props.isWorking)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" justifyContent="flex-end">
          <Text color="#D97757">{look.glyph}</Text>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" justifyContent="flex-end">
        <Svg source={look.art.source} alt={look.alt} width={look.art.width} height={look.art.height} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    // The pane has no isWorking flag of its own; the scene state already
    // follows the turn, so draw it as it stands.
    const look = await friendLook($, null)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="column" alignItems="center">
          <Text color="#D97757">{look.glyph}</Text>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" alignItems="center">
        <Svg source={look.art.source} alt={look.alt} width={look.art.width} height={look.art.height} />
      </Box>
    )
  })

  // /friend menu, skins and scenes print text the model reads; on surfaces that
  // draw pictures, the row is drawn as a card with buttons instead.
  on('ui.render', { component: 'CommandOutput', props: { command: 'friend' } }, async ($, e, next) => {
    const arg = e.props.args.trim().toLowerCase()
    const isCard = ['menu', 'help', 'skins', 'skin', 'scenes'].includes(arg)
    if (!isCard || e.props.isErrored || e.surface === 'terminal') return next(e)

    const { Box, Text, Button, Svg } = $.ui.resolve(e)
    const name = await read($, friendName)
    const isHere = await read($, isOn)
    const wearing = await read($, skin)

    if (arg === 'menu' || arg === 'help') {
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold>
            {name} <Text color="#D97757">· Claude Friend</Text>
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            <Button
              key="toggle"
              label={isHere ? 'Send off' : 'Call'}
              variant="primary"
              onPress={() => void (isHere ? setOn($, false) : callFriend($))}
            />
            <Button key="hello" label="Say hello" onPress={() => void callFriend($)} />
            <Button key="pane" label="Side pane" onPress={() => void moveTo($, 'pane')} />
            <Button key="stage" label="Above the prompt" onPress={() => void moveTo($, 'stage')} />
          </Box>
          <Box flexDirection="column">
            {COMMANDS.map(([cmd, what]) => (
              <Text key={cmd}>
                <Text color="#D97757">{cmd}</Text>
                <Text dimColor> {what}</Text>
              </Text>
            ))}
          </Box>
        </Box>
      )
    }

    if (arg === 'skins' || arg === 'skin') {
      const cell = (id: string, label: string) => {
        const art = renderScene('idle', id)
        const isWorn = wearing === id
        return (
          <Box key={`skin-${id || 'none'}`} flexDirection="column" alignItems="center" width={16}>
            <Svg source={art.source} alt={label} width={Math.round(art.width * 0.7)} height={Math.round(art.height * 0.7)} />
            <Button
              key={`wear-${id || 'none'}`}
              label={isWorn ? `✓ ${label}` : label}
              variant={isWorn ? 'primary' : 'secondary'}
              onPress={() => void wearSkin($, id)}
            />
          </Box>
        )
      }
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold>
            Skins for {name} <Text dimColor>· click one to wear it, or type /friend crown</Text>
          </Text>
          <Text dimColor>Hats</Text>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {SKINS.filter(s => s.kind === 'hat').map(s => cell(s.id, `${s.emoji} ${s.label}`))}
          </Box>
          <Text dimColor>In his hand</Text>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {SKINS.filter(s => s.kind === 'hand').map(s => cell(s.id, `${s.emoji} ${s.label}`))}
            {cell('', 'No skin')}
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>
          Scenes <Text dimColor>· click one to play it, or type /friend deploy</Text>
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {ACTIVITIES.map(a => (
            <Button key={`play-${a}`} label={SCENE_NAMES[a]} onPress={() => void startPreview($, a)} />
          ))}
        </Box>
      </Box>
    )
  })
}
