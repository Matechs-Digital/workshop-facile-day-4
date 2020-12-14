import * as R from "@app/Reader";
import * as T from "@app/Task";
import * as E from "@app/Either";

export type App<R, E, A> = R.Reader<R, T.Task<E.Either<E, A>>>;

export function succeed<A>(a: A): App<unknown, never, A> {
  return () => () => Promise.resolve(E.right(a));
}

export function fail<E>(e: E): App<unknown, E, never> {
  return () => () => Promise.resolve(E.left(e));
}

export function sync<A>(f: () => A): App<unknown, never, A> {
  return () => () =>
    new Promise((res) => {
      res(E.right(f()));
    });
}

export function async<A>(f: () => Promise<A>): App<unknown, never, A> {
  return () => async () => {
    const a = await f();
    return E.right(a);
  };
}

export function trySync<A, E>(
  f: () => A,
  onError: (u: unknown) => E
): App<unknown, E, A> {
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
): App<unknown, E, A> {
  return () => () =>
    f()
      .then((a) => E.right(a))
      .catch((e) => E.left(onError(e)));
}

export function access<R, A>(f: (r: R) => A): App<R, never, A> {
  return (c) => () =>
    new Promise((res) => {
      res(E.right(f(c)));
    });
}

export function map<A, B>(
  f: (a: A) => B
): <R, E>(fa: App<R, E, A>) => App<R, E, B> {
  return (fa) => (r) => () => fa(r)().then(E.map(f));
}
