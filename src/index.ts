import { pipe } from 'fp-ts/lib/pipeable'
import { array } from 'fp-ts/lib/Array'
import * as P from 'parser-ts/lib/Parser'

const CODES = {
  A: 'cuu', // cursor up
  B: 'cud', // cursor down
  C: 'cuf', // cursor forward
  D: 'cub', // cursor backward
  f: 'cup', // cursor position
  H: 'cup', // cursor position
  s: 'sc', // save cursor position
  u: 'rc', // restore cursor position
  m: 'sgr', // select graphics rendition
  J: 'ed' // erase in display
}

export type Cmd = {
  _tag: 'cuu' | 'cud' | 'cuf' | 'cub' | 'cup' | 'sc' | 'rc' | 'sgr' | 'ed'
  args: Array<number>
  text: string
}

function equals(n: number): P.Parser<number, number> {
  return P.sat(x => x === n)
}

function within(lower: number, upper: number) {
  return P.sat((x: number) => x >= lower && x <= upper)
}

function manyWithin(lower: number, upper: number) {
  return P.many(within(lower, upper))
}

export const parser = pipe(
  P.seq(equals(27), () => equals(91)),
  P.chain(() =>
    P.seq(manyWithin(48, 63), p =>
      pipe(
        within(64, 126),
        P.map(f => [p, f] as [Array<number>, number]),
        P.chain(([p, f]) =>
          pipe(
            P.many(
              pipe(
                P.withStart(P.item<number>()),
                P.chain(([a, start]) =>
                  // start.cursor > 0 && a === 91 && start.buffer[start.cursor - 1] === 27
                  start.cursor > 0 && a === 27 && start.buffer[start.cursor + 1] === 91
                    ? P.failAt(start)
                    : P.parser.of(a)
                )
              )
            ),
            P.map(data =>
              pipe(
                array.reduceWithIndex<number, [Array<number>, Array<number>]>(p, [[], []], (i, [r, t], ia) =>
                  ia === 59 || i === p.length - 1
                    ? [
                        r.concat(
                          parseInt(
                            String.fromCharCode(
                              ...(t.length ? (ia !== 59 ? t.concat(ia) : t) : ia !== 59 ? [ia] : [48])
                            ),
                            10
                          )
                        ),
                        []
                      ]
                    : [r, t.concat(ia)]
                )[0],
                args =>
                  // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
                  ({
                    _tag: CODES[String.fromCharCode(f) as keyof typeof CODES] as Cmd['_tag'],
                    args,
                    text: Buffer.from(data).toString('latin1')
                  } as Cmd)
              )
            )
          )
        )
      )
    )
  )
)
