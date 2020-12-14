import * as R from "@app/Reader"
import * as T from "@app/Task"
import * as E from "@app/Either"

export type App<R, E, A> = R.Reader<R, T.Task<E.Either<E, A>>>

export function succeed<A>(a: A): App<unknown, never, A> {
    return () => () => Promise.resolve(E.right(a))
}
