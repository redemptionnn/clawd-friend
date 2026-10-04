export type Activity =
  | 'idle'
  | 'sleep'
  | 'thinking'
  | 'writing'
  | 'coding'
  | 'web'
  | 'reading'
  | 'bash'
  | 'agents'
  | 'todo'
  | 'ask'
  | 'browser'
  | 'testing'
  | 'commit'
  | 'deploy'
  | 'waiting'
  | 'debugging'
  | 'memory'
  | 'database'
  | 'design'
  | 'build'
  | 'done'
  | 'oops'

export type Scene = { activity: Activity; detail: string }

// Where the friend lives: the band above the prompt or a side pane.
export type Place = 'stage' | 'pane'

// Today's tally, kept in $.store and reset when the date changes.
export type Stats = {
  day: string
  edits: number
  reads: number
  commands: number
  web: number
  helpers: number
  plans: number
  questions: number
  done: number
  snags: number
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-friend': {
      scene: Scene
      isOn: boolean
      preview: Activity | null
      place: Place
      // The skin he wears: a skin id, or '' for none.
      skin: string
      // What he's called; greets with "<name> has arrived!".
      name: string
      // True for a few seconds after he arrives, while he waves hello.
      isArriving: boolean
    }
  }
}
