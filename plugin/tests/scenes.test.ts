import { describe, expect, mock, test } from 'claude-code/testing'

// Each case runs a real tool call through the engine with the friend loaded.
// The test's own tool.call hook stands in for the tool beneath the plugin and
// holds the call open; meanwhile the test draws the band above the prompt on
// the desktop surface and reads which scene he shows (the Svg's alt names it).
// Once the call is released, it draws him again.

// What the alt text starts with for each scene (register.tsx's LABELS).
const LABEL: Record<string, string> = {
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
}

const BAND = {
  plugin: 'clawd-friend',
  surface: 'desktop',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

// Draws the band and names the scene he shows, by matching the alt text.
async function shownScene($: { ui: { mount: (t: never) => Promise<unknown> } }): Promise<string> {
  const ui = (await $.ui.mount(BAND as never)) as { find: (q: { type: string }) => Promise<{ props: { alt?: string } } | undefined> }
  const alt = (await ui.find({ type: 'Svg' }))?.props.alt ?? ''
  const match = Object.entries(LABEL)
    .sort((a, b) => b[1].length - a[1].length)
    .find(([, label]) => alt.startsWith(`Claude ${label}`))
  return match ? match[0] : `unknown (${alt})`
}

// A tool call held open by the test's hook until the test lets it finish.
function holdCalls(on: (event: 'tool.call', hook: () => Promise<unknown>) => unknown) {
  let enter = () => {}
  let release = () => {}
  const entered = new Promise<void>(resolve => (enter = resolve))
  const released = new Promise<void>(resolve => (release = resolve))
  on('tool.call', async () => {
    enter()
    await released
    return { result: { ok: true } }
  })
  return { entered, release }
}

type Case = [label: string, call: Record<string, unknown>, expected: string]

const CASES: Case[] = [
  // Testing
  ['npm test', { tool: 'Bash', command: 'npm test' }, 'testing'],
  ['npm run test in a subfolder', { tool: 'Bash', command: 'cd app && npm run test -- --watch=false' }, 'testing'],
  ['pytest', { tool: 'Bash', command: 'pytest -q tests/' }, 'testing'],
  ['vitest', { tool: 'Bash', command: 'npx vitest run' }, 'testing'],
  ['go test', { tool: 'Bash', command: 'go test ./...' }, 'testing'],
  ['claude plugin test', { tool: 'Bash', command: 'claude plugin test ./friend' }, 'testing'],
  ['PowerShell npm test', { tool: 'PowerShell', command: 'npm test' }, 'testing'],
  // Commit
  ['git commit', { tool: 'Bash', command: 'git commit -m "Add scenes"' }, 'commit'],
  ['git -C commit', { tool: 'Bash', command: 'git -C ./friend commit -am wip' }, 'commit'],
  ['git add then commit', { tool: 'Bash', command: 'git add . && git commit -m x' }, 'commit'],
  // Deploy
  ['git push', { tool: 'Bash', command: 'git push origin main' }, 'deploy'],
  ['vercel', { tool: 'Bash', command: 'vercel --prod' }, 'deploy'],
  ['npm publish', { tool: 'Bash', command: 'npm publish --access public' }, 'deploy'],
  ['npm run deploy', { tool: 'Bash', command: 'npm run deploy' }, 'deploy'],
  ['Supabase edge deploy (MCP)', { tool: 'mcp__plugin_supabase_supabase__deploy_edge_function', name: 'hello' }, 'deploy'],
  // Build
  ['npm run build', { tool: 'Bash', command: 'npm run build' }, 'build'],
  ['tsc', { tool: 'Bash', command: 'npx tsc --noEmit' }, 'build'],
  ['cargo build', { tool: 'Bash', command: 'cargo build --release' }, 'build'],
  ['docker build', { tool: 'Bash', command: 'docker build -t app .' }, 'build'],
  // Database
  ['psql', { tool: 'Bash', command: 'psql -c "select 1"' }, 'database'],
  ['prisma migrate', { tool: 'Bash', command: 'npx prisma migrate dev' }, 'database'],
  ['Supabase SQL (MCP)', { tool: 'mcp__plugin_supabase_supabase__execute_sql', query: 'select 1' }, 'database'],
  ['Supabase tables (MCP)', { tool: 'mcp__b1d9e52f__list_tables', schemas: ['public'] }, 'database'],
  ['edit a .sql file', { tool: 'Edit', file_path: 'db/schema.sql', old_string: 'a', new_string: 'b' }, 'database'],
  ['write a migration', { tool: 'Write', file_path: 'supabase/migrations/001_init.ts', content: 'x' }, 'database'],
  // Debugging
  ['node --inspect', { tool: 'Bash', command: 'node --inspect-brk app.js' }, 'debugging'],
  ['python -m pdb', { tool: 'Bash', command: 'python -m pdb main.py' }, 'debugging'],
  ['debugging skill', { tool: 'Skill', skill: 'superpowers:systematic-debugging' }, 'debugging'],
  // Memory
  ['edit CLAUDE.md', { tool: 'Edit', file_path: 'C:/proj/CLAUDE.md', old_string: 'a', new_string: 'b' }, 'memory'],
  ['write a memory file', { tool: 'Write', file_path: 'C:/Users/me/.claude/projects/x/memory/note.md', content: 'x' }, 'memory'],
  // Design
  ['edit a .css file', { tool: 'Edit', file_path: 'src/styles/app.css', old_string: 'a', new_string: 'b' }, 'design'],
  ['write an .svg', { tool: 'Write', file_path: 'assets/logo.svg', content: '<svg/>' }, 'design'],
  ['tailwind config', { tool: 'Edit', file_path: 'tailwind.config.ts', old_string: 'a', new_string: 'b' }, 'design'],
  ['Figma (MCP)', { tool: 'mcp__figma__get_file', key: 'abc' }, 'design'],
  // Everything that was there before still lands where it did
  ['edit code', { tool: 'Edit', file_path: 'src/app.ts', old_string: 'a', new_string: 'b' }, 'coding'],
  ['write a README', { tool: 'Write', file_path: 'README.md', content: 'x' }, 'writing'],
  ['read a file', { tool: 'Read', file_path: 'src/app.ts' }, 'reading'],
  ['grep', { tool: 'Grep', pattern: 'TODO' }, 'reading'],
  ['web search', { tool: 'WebSearch', query: 'tardigrades' }, 'web'],
  ['Supabase docs (MCP)', { tool: 'mcp__plugin_supabase_supabase__search_docs', query: 'rls' }, 'web'],
  ['plain shell command', { tool: 'Bash', command: 'ls -la' }, 'bash'],
  ['git status is not a commit', { tool: 'Bash', command: 'git status' }, 'bash'],
  ['browser', { tool: 'mcp__Claude_Browser__navigate', url: 'https://example.com' }, 'browser'],
  ['subagent', { tool: 'Agent', description: 'look around', prompt: 'x' }, 'agents'],
  ['todo list', { tool: 'TodoWrite', todos: [] }, 'todo'],
  ['question', { tool: 'AskUserQuestion', questions: [] }, 'ask'],
]

describe('the scene matches what Claude is doing', () => {
  for (const [label, call, expected] of CASES) {
    test(label, async ($, on) => {
      mock.store(on)
      mock.clock(on)
      const held = holdCalls(on as never)

      const running = $.tool.call({ ...call, tool_use_id: `t-${label}` } as never)
      await held.entered
      expect(await shownScene($ as never)).toBe(expected)

      // Once the call is over he goes back to thinking about the result,
      // not stuck on the tool's scene.
      held.release()
      await running
      expect(await shownScene($ as never)).toBe('thinking')
    })
  }
})

describe('waiting for your OK', () => {
  test('a call the mode puts to you shows the OK? sign', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    on('tool.check', () => ({ decision: 'ask', reason: 'needs your OK' }) as never)
    const held = holdCalls(on as never)

    const running = $.tool.call({ tool: 'Bash', command: 'rm -rf build', tool_use_id: 't-ask' } as never)
    await held.entered
    await $.tool.check({ tool: 'Bash', input: { command: 'rm -rf build' }, tool_use_id: 't-ask' } as never)
    expect(await shownScene($ as never)).toBe('waiting')

    held.release()
    await running
    expect(await shownScene($ as never)).toBe('thinking')
  })

  test('an allowed call keeps its own scene', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    on('tool.check', () => ({ decision: 'allow' }) as never)
    const held = holdCalls(on as never)

    const running = $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't-allow' } as never)
    await held.entered
    await $.tool.check({ tool: 'Bash', input: { command: 'npm test' }, tool_use_id: 't-allow' } as never)
    expect(await shownScene($ as never)).toBe('testing')

    held.release()
    await running
  })

  test('a check outside any running call shows nothing new', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    on('tool.check', () => ({ decision: 'ask' }) as never)
    await $.tool.check({ tool: 'Bash', input: { command: 'ls' } } as never)
    expect(await shownScene($ as never)).not.toBe('waiting')
  })
})

describe('preview command', () => {
  test('/friend database plays the database scene', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    const ran = (await $.command.run({ command: 'friend', args: 'database' } as never)) as { text?: string }
    expect(ran.text ?? '').toContain('database')
    expect(await shownScene($ as never)).toBe('database')
  })

  test('every new scene can be previewed', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    for (const name of ['testing', 'commit', 'deploy', 'waiting', 'debugging', 'memory', 'database', 'design', 'build']) {
      await $.command.run({ command: 'friend', args: name } as never)
      expect(await shownScene($ as never)).toBe(name)
    }
  })
})

describe('while the model streams its response', () => {
  // The model thinks first, then starts a tool call whose arguments stream in.
  // The scene must follow the tool as soon as its command is known, and not
  // stay on thinking.
  const stream = (command: string) =>
    async function* () {
      yield { kind: 'thinking', index: 0, text: 'Let me check the users table.' }
      yield { kind: 'tool', index: 1, id: 'toolu_1', name: 'Bash' }
      yield { kind: 'input', index: 1, json: '{"command": "' }
      yield { kind: 'input', index: 1, json: command.replace(/"/g, '\\"') + '"}' }
      return { turnId: 'turn-1', index: 0, answer: '', toolUses: [], stopReason: 'tool_use', usage: null }
    }

  const cases: [string, string][] = [
    ['psql -c "select count(*) from users"', 'database'],
    ['npm test', 'testing'],
    ['git commit -m "wip"', 'commit'],
    ['npm run build', 'build'],
  ]

  for (const [command, expected] of cases) {
    test(`thinking, then "${command}" shows ${expected}`, async ($, on) => {
      mock.store(on)
      mock.clock(on)
      on('turn.step', stream(command) as never)

      for await (const _ of $.turn.step({ turnId: 'turn-1', index: 0, model: 'claude', messageCount: 1 } as never)) {
        // Draining the stream runs the friend's hook over every chunk.
      }
      expect(await shownScene($ as never)).toBe(expected)
    })
  }

  test('thinking alone shows thinking', async ($, on) => {
    mock.store(on)
    mock.clock(on)
    on('turn.step', async function* () {
      yield { kind: 'thinking', index: 0, text: 'Hmm.' }
      return { turnId: 'turn-1', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: null }
    } as never)
    for await (const _ of $.turn.step({ turnId: 'turn-1', index: 0, model: 'claude', messageCount: 1 } as never)) {
      // drain
    }
    expect(await shownScene($ as never)).toBe('thinking')
  })
})
