import { expect, test } from 'claude-code/testing'

import { LENS, choose, deepen } from './lens'

const typed = (text: string, kind: 'composer' | 'bridge' | 'sdk' | 'peer' = 'composer') =>
  ({ text, origin: { kind } }) as const

test('off: your prompt passes untouched', () => {
  expect(deepen(typed('fix the login bug'), 'off', 'pause')).toBe(null)
})

test('a deeper: prefix applies the lens to that one prompt and is removed', () => {
  const out = deepen(typed('deeper: fix the login bug'), 'off', 'pause')
  expect(out?.text).toBe('fix the login bug')
  expect(out?.context[0]?.startsWith(LENS)).toBe(true)
  expect(out?.context[0]?.endsWith('wait for me to approve or edit it.')).toBe(true)
  expect(out?.mode).toBe('off')
})

test('always: every prompt typed in the terminal, app or SDK gets the lens', () => {
  for (const kind of ['composer', 'bridge', 'sdk'] as const) {
    const out = deepen(typed('plan the migration', kind), 'always', 'run')
    expect(out?.text).toBe('plan the migration')
    expect(out?.context[0]?.endsWith('carry it out as if I had sent it.')).toBe(true)
    expect(out?.mode).toBe('always')
  }
})

test('once: the lens applies once, then the mode switches off', () => {
  expect(deepen(typed('write the spec'), 'once', 'pause')?.mode).toBe('off')
})

test('the lens is added after context other mods attached, not over it', () => {
  const out = deepen({ ...typed('x'), context: ['from another mod'] }, 'always', 'pause')
  expect(out?.context.length).toBe(2)
  expect(out?.context[0]).toBe('from another mod')
})

test('slash commands, hidden prompts and peer messages are left alone', () => {
  expect(deepen({ ...typed('/deeper'), command: { name: 'deeper', args: '' } }, 'always', 'pause')).toBe(null)
  expect(deepen({ ...typed('note'), isMeta: true }, 'always', 'pause')).toBe(null)
  expect(deepen(typed('hi from a peer', 'peer'), 'always', 'pause')).toBe(null)
})

test('/deeper toggles, and its arguments choose', () => {
  expect(choose('', 'off')).toBe('always')
  expect(choose('', 'always')).toBe('off')
  expect(choose('', 'once')).toBe('off')
  expect(choose(' Once ', 'always')).toBe('once')
  expect(choose('on', 'off')).toBe('always')
  expect(choose('off', 'always')).toBe('off')
})

test('the command and the status line work end to end', async ($, on) => {
  on('command.register', () => ({ value: { command: 'deeper' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const run = (args: string) =>
    $.command.run({
      command: 'deeper',
      args,
      origin: { kind: 'composer' },
      presentation: { isFullscreen: false, columns: 80 },
    })

  expect((await run('')).text).toContain('on for every prompt')
  expect((await run('once')).text).toContain('next prompt only')
  expect((await run('off')).text).toContain('off')
})
