# deeper

An expert-depth mode for Claude Code. When it's on, each prompt you type reaches the model unchanged, with a hidden lens attached. The lens tells Claude to work through four steps before it acts: what a top professional would do that you didn't ask for, the rawest material they'd start from, the specific methods and tools they'd use, and what outside evidence would show the result is right. Claude then rewrites your prompt to ask for exactly that: deeper, not bigger.

It runs alongside any other prompt-shaping mod and replaces nothing.

- `/deeper` turns the mode on or off for every prompt
- `/deeper once` applies it to your next prompt only
- `/deeper off` turns it off
- `deeper: <your prompt>` applies it to that one prompt

Setting `after` (in /config): `pause` (the default) shows the rewritten prompt and waits for you. `run` carries it out straight away.

## Install

```
/plugin install deeper --marketplace bonythomasv/bonythomasv
```
