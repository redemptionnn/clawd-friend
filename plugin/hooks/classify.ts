import type { Activity } from '../types'

// Which scene a tool call gets. Pure: no $, so it is easy to reason about and
// test. The streaming path calls it with partial input as the arguments arrive,
// so a Bash call can start as 'bash' and become 'testing' once its command is in.

// Shell commands, checked in this order; the first that matches wins.
const TEST =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\b(vitest|jest|pytest|mocha|phpunit|rspec|karma)\b|\bcypress\s+run\b|\bplaywright\s+test\b|\bgo\s+test\b|\bcargo\s+(test|nextest)\b|\bdotnet\s+test\b|\bgradlew?\s+test\b|\bmvn\b.*\btest\b|\bpython\d*\s+-m\s+(pytest|unittest)\b|\bclaude\s+plugin\s+test\b/i
const COMMIT = /\bgit(\s+-[cC]\s+\S+)*\s+commit\b/
const DEPLOY =
  /\bgit(\s+-[cC]\s+\S+)*\s+push\b|\b(npm|pnpm|yarn)\s+publish\b|\bdocker\s+push\b|\bkubectl\s+(apply|rollout)\b|\bhelm\s+(install|upgrade)\b|\bgh\s+release\s+create\b|\bvercel\b|\bnetlify\s+deploy\b|\b(fly|flyctl)\s+deploy\b|\bfirebase\s+deploy\b|\bwrangler\s+(deploy|publish)\b|\bdeploy\b/i
const BUILD =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?build\b|\btsc\b|\bvite\s+build\b|\bnext\s+build\b|\b(webpack|rollup|esbuild|msbuild)\b|\bturbo\s+(run\s+)?build\b|\b(cargo|go|dotnet|swift)\s+build\b|\b(make|cmake)\b|\bdocker\s+(compose\s+)?build\b|\bgradlew?\s+(build|assemble)\b|\bmvn\b.*\b(package|install|compile)\b/i
const DATABASE =
  /\b(psql|mysql|sqlite3|mongosh?|redis-cli|pg_dump|pg_restore|mysqldump)\b|\bprisma\s+(migrate|db|studio|generate)\b|\bdrizzle-kit\b|\bknex\s+migrate\b|\bsupabase\s+(db|migration)\b|\balembic\b|\brails\s+db:|\bmanage\.py\s+(migrate|makemigrations|dbshell)\b/i
const DEBUG = /--inspect(-brk)?\b|\b(gdb|lldb|pdb|ipdb|dlv|ndb|valgrind|strace)\b|\bnode\s+inspect\b|\bpython\d*\s+-m\s+(pdb|debugpy)\b/i

// Files written or edited.
const MEMORY_FILE = /(^|[\\/])(CLAUDE|MEMORY|AGENTS|GEMINI)\.md$|[\\/]memory[\\/]/i
const DESIGN_FILE = /\.(css|scss|sass|less|styl|svg)$|(^|[\\/])tailwind\.config\.\w+$/i
const DATABASE_FILE = /\.(sql|prisma|dbml)$|[\\/]migrations?[\\/]/i
const DOC_FILE = /\.(md|mdx|txt|rst|adoc|org|tex)$/i

export function commandActivity(command: string): Activity {
  if (TEST.test(command)) return 'testing'
  if (COMMIT.test(command)) return 'commit'
  if (DEPLOY.test(command)) return 'deploy'
  if (BUILD.test(command)) return 'build'
  if (DATABASE.test(command)) return 'database'
  if (DEBUG.test(command)) return 'debugging'
  return 'bash'
}

export function fileActivity(path: string): Activity {
  if (MEMORY_FILE.test(path)) return 'memory'
  if (DESIGN_FILE.test(path)) return 'design'
  if (DATABASE_FILE.test(path)) return 'database'
  if (DOC_FILE.test(path)) return 'writing'
  return 'coding'
}

export function classify(tool: string, input: Record<string, unknown> = {}): Activity {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')

  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) return fileActivity(str('file_path') || str('notebook_path'))
  if (/^(Bash|PowerShell)$/.test(tool)) return commandActivity(str('command'))
  if (/^(Read|Grep|Glob|LS|NotebookRead)$/.test(tool)) return 'reading'
  if (/^(WebSearch|WebFetch)$/.test(tool)) return 'web'
  if (/^(Agent|Task|SendMessage)$/.test(tool)) return 'agents'
  if (/^(TodoWrite|TaskCreate|TaskUpdate|TaskList)$/.test(tool)) return 'todo'
  if (/^(AskUserQuestion|ExitPlanMode)$/.test(tool)) return 'ask'
  if (tool === 'Skill') return /debug/i.test(str('skill')) ? 'debugging' : 'reading'

  // MCP and plugin tools, by what their names say. Order matters: a Supabase
  // deploy is a deploy, its docs search is a web lookup, the rest is database.
  if (/browser|chrome|computer|playwright|puppeteer/i.test(tool)) return 'browser'
  if (/deploy|publish|release/i.test(tool)) return 'deploy'
  if (/search_docs|docs|context7|exa|firecrawl|web_?search|fetch/i.test(tool)) return 'web'
  if (/supabase|postgres|mysql|sqlite|mongo|redis|database|_sql|migration|list_tables|query/i.test(tool)) return 'database'
  if (/figma|canva|design|excalidraw/i.test(tool)) return 'design'
  if (/memory|remember/i.test(tool)) return 'memory'
  if (/debug/i.test(tool)) return 'debugging'
  if (/search/i.test(tool)) return 'web'
  return 'bash'
}
