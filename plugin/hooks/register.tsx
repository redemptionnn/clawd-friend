import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Activity, Place, Scene, Stats } from '../types'
import { classify } from './classify'
import { ACTIVITIES, renderScene } from './scenes'

const scene = atom({ plugin: 'clawd-friend', key: 'scene' } as const, {
  activity: 'idle',
  detail: '',
} as Scene)

const isOn = atom({ plugin: 'clawd-friend', key: 'isOn' } as const, true)
const preview = atom({ plugin: 'clawd-friend', key: 'preview' } as const, null as Activity | null)
const place = atom({ plugin: 'clawd-friend', key: 'place' } as const, 'stage' as Place)

const PANE = 'friend'
const PREVIEW_MS = 6_000

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
  await update($, preview, () => activity)
  previewTimer = $.clock.after(PREVIEW_MS, () => void update($, preview, () => null))
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

const HELP = [
  'Usage: /friend [on | off | pane | stage | stats | <scene>]',
  '  /friend          show or hide your friend',
  '  /friend pane     move him into a side pane',
  '  /friend stage    put him back above the prompt',
  '  /friend stats    what he saw today',
  '  /friend <scene>  play a scene for a few seconds',
  `Scenes: ${ACTIVITIES.join(', ')}`,
].join('\n')

// ── Drawing ──────────────────────────────────────────────────────────────

async function currentActivity($: EngineInterface, isWorking: boolean) {
  const shownPreview = await read($, preview)
  if (shownPreview) return { activity: shownPreview, detail: '' }
  const now = await read($, scene)
  if (!isWorking && !RESTING.has(now.activity)) return { activity: 'idle' as Activity, detail: '' }
  if (isWorking && RESTING.has(now.activity)) return { activity: 'thinking' as Activity, detail: '' }
  return now
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'friend',
      description: 'Your friend above the prompt: show, hide, move, stats or play a scene',
      argumentHint: '[on|off|pane|stage|stats|<scene>]',
    })
    const savedOn = await $.store.get('isOn')
    const savedPlace = await $.store.get('place')
    await update($, isOn, () => savedOn !== false)
    await update($, place, () => (savedPlace === 'pane' ? 'pane' : 'stage'))
    await update($, preview, () => null)
    await loadStats($)
    await show($, 'idle')
    if (savedPlace === 'pane' && savedOn !== false) void openPane($)
    return next(e)
  })

  on('command.run', { command: 'friend' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (arg === '' || arg === 'on' || arg === 'off') {
      const value = arg === 'on' ? true : arg === 'off' ? false : !(await read($, isOn))
      await setOn($, value)
      if ((await read($, place)) === 'pane') {
        if (value) await openPane($)
        else await $.ui.close({ id: PANE })
      }
      return { text: value ? 'Your friend is back.' : 'Your friend is hidden. /friend brings him back.' }
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

    return { text: `Unknown option "${arg}".\n${HELP}` }
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

    const { activity, detail } = await currentActivity($, e.props.isWorking)
    // Only the character shows; the label lives on for screen readers.
    const alt = `Claude ${LABELS[activity]}${detail ? `: ${detail}` : ''}`

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" justifyContent="flex-end">
          <Text color="#D97757">{GLYPHS[activity]}</Text>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)
    const art = renderScene(activity)
    return (
      <Box flexDirection="row" justifyContent="flex-end">
        <Svg source={art.source} alt={alt} width={art.width} height={art.height} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    // The pane has no isWorking flag of its own; the scene state already
    // follows the turn, so draw it as it stands.
    const shownPreview = await read($, preview)
    const now = await read($, scene)
    const activity = shownPreview ?? now.activity
    const detail = shownPreview ? '' : now.detail
    const alt = `Claude ${LABELS[activity]}${detail ? `: ${detail}` : ''}`

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="column" alignItems="center">
          <Text color="#D97757">{GLYPHS[activity]}</Text>
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)
    const art = renderScene(activity)
    return (
      <Box flexDirection="column" alignItems="center">
        <Svg source={art.source} alt={alt} width={art.width} height={art.height} />
      </Box>
    )
  })
}
