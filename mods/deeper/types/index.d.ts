/** off: untouched. once: the next prompt only. always: every prompt you type. */
export type DeeperMode = 'off' | 'once' | 'always'

declare module 'claude-code' {
  interface PluginState {
    deeper: { mode: DeeperMode }
  }
}
