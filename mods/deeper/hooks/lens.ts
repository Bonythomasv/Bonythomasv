import type { PromptSubmitInput } from 'claude-code'

import type { DeeperMode } from '../types'

export const PREFIX = /^deeper:\s*/i

/** The person's own words: typed at the terminal, sent from the app, or the SDK host. */
const HUMAN = new Set(['composer', 'bridge', 'sdk'])

export const LENS = `Expert-depth mode is on for this prompt. I want a deeper version of the task, not a bigger one. Before you start the work:

1. Unasked craft: say what a top professional in this field would do here that I'm not asking for.
2. Raw material: name the rawest material they would start from, not the version already digested for me (primary sources, source code, logs, original data, the people involved).
3. Methods and tools: name the specific methods and tools they would use.
4. Outside proof: say what, other than you or me, would show the result is right (a test, a measurement, a benchmark, a reference implementation, a real user, a domain reviewer).

Then rewrite my prompt so it asks for exactly that. Keep the same scope and go deeper, not wider. Put the rewritten prompt in one fenced block so I can copy it.`

export const THEN = {
  pause: 'Stop after the rewritten prompt and wait for me to approve or edit it.',
  run: 'After the rewritten prompt, carry it out as if I had sent it.',
} as const

export type After = keyof typeof THEN

/**
 * What this prompt becomes: `null` leaves it untouched; otherwise the prompt to
 * pass on (your words unchanged, any `deeper:` prefix removed, the lens
 * attached as hidden context) and the mode to keep afterwards.
 */
export function deepen(
  e: Pick<PromptSubmitInput, 'text' | 'context' | 'command' | 'isMeta' | 'origin'>,
  mode: DeeperMode,
  after: After,
): { text: string; context: string[]; mode: DeeperMode } | null {
  if (e.command || e.isMeta || !HUMAN.has(e.origin.kind)) {
    return null
  }

  const isPrefixed = PREFIX.test(e.text)

  if (mode === 'off' && !isPrefixed) {
    return null
  }

  return {
    text: isPrefixed ? e.text.replace(PREFIX, '') : e.text,
    context: [...(e.context ?? []), `${LENS}\n\n${THEN[after]}`],
    mode: mode === 'once' ? 'off' : mode,
  }
}

/** `/deeper` with no argument toggles; `once`, `on`/`always` and `off` choose. */
export function choose(args: string, current: DeeperMode): DeeperMode {
  const arg = args.trim().toLowerCase()

  if (arg === 'once') return 'once'
  if (arg === 'off') return 'off'
  if (arg === 'on' || arg === 'always') return 'always'

  return current === 'off' ? 'always' : 'off'
}
