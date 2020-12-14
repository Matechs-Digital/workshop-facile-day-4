import * as R from "@app/Reader";
import * as T from "@app/Task";
import * as E from "@app/Either";
import { pipe, identity } from "@app/Function";

export type App<R, E, A> = R.Reader<R, T.Task<E.Either<E, A>>>;
export type UIO<A> = App<unknown, never, A>;
export type FIO<E, A> = App<unknown, E, A>;
export type RIO<R, A> = App<R, never, A>;

export function succeed<A>(a: A): UIO<A> {
  return () => () => Promise.resolve(E.right(a));
}

export function fail<E>(e: E): FIO<E, never> {
  return () => () => Promise.resolve(E.left(e));
}

export function sync<A>(f: () => A): UIO<A> {
  return () => () =>
    new Promise((res) => {
      res(E.right(f()));
    });
}

export function async<A>(f: () => Promise<A>): UIO<A> {
  return () => async () => {
    const a = await f();
    return E.right(a);
  };
}

export function trySync<A, E>(
  f: () => A,
  onError: (u: unknown) => E
): FIO<E, A> {
  return () => () =>
    new Promise((res) => {
      try {
        res(E.right(f()));
      } catch (e) {
        res(E.left(onError(e)));
      }
    });
}

export function tryAsync<A, E>(
  f: () => Promise<A>,
  onError: (u: unknown) => E
): FIO<E, A> {
  return () => () =>
    f()
      .then((a) => E.right(a))
      .catch((e) => E.left(onError(e)));
}

export function access<R, A>(f: (r: R) => A): RIO<R, A> {
  return (c) => () =>
    new Promise((res) => {
      res(E.right(f(c)));
    });
}

export function map<A, B>(
  f: (a: A) => B
): <R, E>(fa: App<R, E, A>) => App<R, E, B> {
  return R.map(T.map(E.map(f)));
}

export function chain<A, R1, E1, B>(
  f: (a: A) => App<R1, E1, B>
): <R, E>(fa: App<R, E, A>) => App<R & R1, E | E1, B> {
  return (fa) => (env) => async () => {
    const maybeA = await fa(env)();

    if (E.isLeft(maybeA)) {
      return maybeA;
    }

    const maybeB = await f(maybeA.right)(env)();

    return maybeB;
  };
}

export function accessM<R, R1, E1, A>(
  f: (env: R) => App<R1, E1, A>
): App<R & R1, E1, A> {
  return pipe(access(f), chain(identity));
}

export function zipWith<R1, E1, A, B, C>(
  fb: App<R1, E1, B>,
  f: (a: A, b: B) => C
): <R, E>(fa: App<R, E, A>) => App<R & R1, E | E1, C> {
  return chain((a) =>
    pipe(
      fb,
      chain((b) => succeed(f(a, b)))
    )
  );
}
