import { describe, expect, mock, test } from 'claude-code/testing'

// Skins, names, calling him and the /friend menu, skins and scenes cards,
// checked by drawing the band (and the command's card) the way the desktop app
// does and reading what is in it.

const BAND = {
  plugin: 'clawd-friend',
  surface: 'desktop',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

type Found = { props: Record<string, unknown> } | undefined
type Drawing = {
  find: (q: Record<string, unknown>) => Promise<Found>
  findAll: (q: Record<string, unknown>) => Promise<Found[]>
  press: (t: { key: string }) => Promise<unknown>
}
type Engine = {
  ui: { mount: (t: never) => Promise<unknown> }
  command: { run: (e: never) => Promise<unknown> }
}

// The band as drawn now: the Svg's alt and markup, or nothing if he's away.
async function band($: Engine) {
  const ui = (await $.ui.mount(BAND as never)) as Drawing
  const svg = await ui.find({ type: 'Svg' })
  return svg ? { alt: String(svg.props.alt ?? ''), source: String(svg.props.source ?? '') } : undefined
}

async function friend($: Engine, args: string) {
  const ran = (await $.command.run({ command: 'friend', args } as never)) as { text?: string }
  return ran.text ?? ''
}

async function card($: Engine, args: string) {
  return (await $.ui.mount({
    plugin: 'clawd-friend',
    surface: 'desktop',
    component: 'CommandOutput',
    props: { command: 'friend', args, text: '', isErrored: false },
  } as never)) as Drawing
}

// Marks that tell the skins apart in the markup.
const CROWN = 'M62 18V12.8L65 15'
const SWORD = 'M81.6 22.8V12.6'
const HARD_HAT = 'M61.2 18.3C61.2 13.6'

describe('skins', () => {
  test('/friend crown puts the crown on', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    expect(await friend($ as never, 'crown')).toContain('crown')
    const drawn = await band($ as never)
    expect(drawn?.source).toContain(CROWN)
  })

  test('the crown stays on through the scenes', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    await friend($ as never, 'crown')
    await friend($ as never, 'coding')
    const drawn = await band($ as never)
    expect(drawn?.alt).toContain('is coding')
    expect(drawn?.source).toContain(CROWN)
  })

  test("a scene's own hat wins over the skin", async ($, on) => {
    mock.store(on)
    mock.clock(on)
    await friend($ as never, 'crown')
    await friend($ as never, 'build')
    const drawn = await band($ as never)
    expect(drawn?.source).toContain(HARD_HAT)
    expect(drawn?.source).not.toContain(CROWN)
  })

  test('he holds the sword while his hand is free, not while it is busy', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    await friend($ as never, 'sword')
    await friend($ as never, 'deploy')
    expect((await band($ as never))?.source).toContain(SWORD)
    await friend($ as never, 'writing')
    expect((await band($ as never))?.source).not.toContain(SWORD)
  })

  test('/friend noskin takes it off', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    await friend($ as never, 'crown')
    expect(await friend($ as never, 'noskin')).toContain('took the skin off')
    await friend($ as never, 'thinking')
    expect((await band($ as never))?.source).not.toContain(CROWN)
  })

  test('every skin draws', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    for (const id of ['crown', 'wizard', 'cowboy', 'viking', 'party', 'tophat', 'beanie', 'headphones', 'halo', 'pumpkin', 'coffee', 'sword', 'balloon', 'wand', 'flower']) {
      expect(await friend($ as never, id)).toContain('is wearing')
      expect((await band($ as never))?.source).toContain('<svg')
    }
  })
})

describe('names and arriving', () => {
  test('/friend name Bob greets you as Bob', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    expect(await friend($ as never, 'name Bob')).toContain('Bob')
    const drawn = await band($ as never)
    expect(drawn?.alt).toBe('Bob has arrived!')
    expect(drawn?.source).toContain('Bob has arrived!')
  })

  test('the hello wave ends after a few seconds', async ($, on) => {
    mock.store(on)
    const clock = mock.clock(on)
    await friend($ as never, 'name Bob')
    await clock.advance(5000)
    expect((await band($ as never))?.alt).toBe('Claude is chilling')
  })

  test('names are kept plain and short', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    await friend($ as never, 'name <b>Sir Reginald the Magnificent</b>')
    const drawn = await band($ as never)
    expect(drawn?.source).not.toContain('<b>')
    expect(drawn?.alt).toBe('bSir Reginald th has arrived!')
  })

  test('/friend sends him off, and /friend calls him back with a hello', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    // While he's away the friend leaves the band to what's beneath: here, an
    // empty band standing in for the app's own.
    on('ui.render', () => ({ type: 'Box', props: {} }) as never)
    expect(await friend($ as never, '')).toContain('went for a walk')
    expect(await band($ as never)).toBeUndefined()
    expect(await friend($ as never, '')).toContain('Clawd has arrived!')
    expect((await band($ as never))?.alt).toBe('Clawd has arrived!')
  })
})

describe('menu, skins and scenes cards', () => {
  test('/friend menu lists every command with buttons', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    expect(await friend($ as never, 'menu')).toContain('/friend skins')
    const ui = await card($ as never, 'menu')
    expect(await ui.find({ type: 'Button', key: 'toggle' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '/friend name <name>' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '/friend scenes' })).toBeDefined()
  })

  test('/friend skins shows every skin, and a click wears it', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    const ui = await card($ as never, 'skins')
    expect(await ui.findAll({ type: 'Svg' })).toHaveLength(16)
    expect(await ui.findAll({ type: 'Button' })).toHaveLength(16)
    await ui.press({ key: 'wear-crown' })
    expect((await band($ as never))?.source).toContain(CROWN)
  })

  test('/friend scenes shows every scene, and a click plays it', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    const ui = await card($ as never, 'scenes')
    expect(await ui.findAll({ type: 'Button' })).toHaveLength(23)
    await ui.press({ key: 'play-deploy' })
    expect((await band($ as never))?.alt).toContain('is deploying')
  })

  test('an unknown option shows the menu', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    const text = await friend($ as never, 'experiment')
    expect(text).toContain('There\'s no "experiment" yet')
    expect(text).toContain('/friend menu')
  })
})
