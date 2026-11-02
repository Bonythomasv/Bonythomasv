import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { DeeperMode } from '../types'
import { choose, deepen } from './lens'

// Expert-depth mode. It runs beside any other prompt-shaping mod and never
// rewrites what you typed: the lens goes in as hidden context, so your words
// reach the model, and every other mod, unchanged.

const mode = atom({ plugin: 'deeper', key: 'mode' } as const, 'off' as DeeperMode)

const LABEL: Record<DeeperMode, string | undefined> = {
  off: undefined,
  once: 'deeper: next prompt',
  always: 'deeper: on',
}

const SAID: Record<DeeperMode, string> = {
  always: 'Expert-depth mode is on for every prompt you type. /deeper again turns it off.',
  once: 'Expert-depth mode is set for your next prompt only.',
  off: 'Expert-depth mode is off.',
}

async function show($: EngineInterface) {
  $.ui.status(LABEL[await read($, mode)])
}

export const register: Register = (on, options) => {
  const after = options.after === 'run' ? 'run' : 'pause'

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'deeper',
      description: 'Expert-depth mode: /deeper (toggle), /deeper once, /deeper off',
    })
    await show($)

    return next(e)
  })

  on('command.run', { command: 'deeper' }, async ($, e) => {
    const chosen = choose(e.args, await read($, mode))
    await update($, mode, () => chosen)
    await show($)

    return { text: SAID[chosen] }
  })

  on('prompt.submit', async ($, e, next) => {
    const current = await read($, mode)
    const deeper = deepen(e, current, after)

    if (!deeper) {
      return next(e)
    }

    if (deeper.mode !== current) {
      await update($, mode, () => deeper.mode)
      await show($)
    }

    return next({ ...e, text: deeper.text, context: deeper.context })
  })
}
