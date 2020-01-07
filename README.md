# ansi-parser-ts

parse ANSI graphics.

```js
import { writable } from '@tetsuo/parser-ts-contrib'
import { parser, Cmd } from '@tetsuo/ansi-parser-ts'
import { deepEqual } from 'assert'

export const ansi = writable(parser, row => rows.push(row))

const rows: Array<Cmd> = []

ansi.on('finish', () => {
  deepEqual(rows, [
    { _tag: 'sgr', args: [1, 31, 0, 0, 2, 3], text: 'LsD' },
    { _tag: 'cuu', args: [22], text: '1993' }
  ])
})

ansi.end('\x1b[1;31;;;2;3mLsD\x1b[22A1993')
```
