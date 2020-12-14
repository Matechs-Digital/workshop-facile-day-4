import * as R from "@app/Reader";
import * as T from "@app/Task";
import * as E from "@app/Either";
import * as RTE from "fp-ts/ReaderTaskEither";
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

export function tap<A, R1, E1, B>(
  f: (a: A) => App<R1, E1, B>
): <R, E>(fa: App<R, E, A>) => App<R & R1, E | E1, A> {
  return (fa) =>
    pipe(
      fa,
      chain((a) =>
        pipe(
          f(a),
          map(() => a)
        )
      )
    );
}

export function catchAll<E, R1, E1, B>(
  f: (error: E) => App<R1, E1, B>
): <R, A>(fa: App<R, E, A>) => App<R & R1, E1, A | B> {
  return <R, A>(fa: App<R, E, A>) => (env: R & R1) => () =>
    fa(env)().then((res) =>
      res._tag === "Left"
        ? (f(res.left)(env)() as Promise<E.Either<E1, A | B>>)
        : res
    );
}

export type ExtractE<X> = [X] extends [App<infer _R, infer _E, infer _A>]
  ? _E
  : never;

export type ExtractR<X> = [X] extends [App<infer _R, infer _E, infer _A>]
  ? _R
  : never;

export function tuple<Apps extends readonly App<any, any, any>[]>(
  ...apps: Apps & { readonly 0: App<any, any, any> }
): App<
  ExtractR<Apps[number]>,
  ExtractE<Apps[number]>,
  {
    [k in keyof Apps]: [Apps[k]] extends [App<infer _R, infer _E, infer _A>]
      ? _A
      : never;
  }
> {
  return (env) => async (): Promise<any> => {
    const results: any[] = [];
    for (const app of apps) {
      const res = await app(env)();

      if (E.isLeft(res)) {
        return res;
      } else {
        results.push(res.right);
      }
    }
    return E.right(results);
  };
}

export function tuplePar<Apps extends readonly App<any, any, any>[]>(
  ...apps: Apps & { readonly 0: App<any, any, any> }
): App<
  ExtractR<Apps[number]>,
  ExtractE<Apps[number]>,
  {
    [k in keyof Apps]: [Apps[k]] extends [App<infer _R, infer _E, infer _A>]
      ? _A
      : never;
  }
> {
  return (env) => async (): Promise<any> => {
    const results: any[] = [];

    const executed = await Promise.all(apps.map((app) => app(env)()));

    for (const res of executed) {
      if (E.isLeft(res)) {
        return res;
      } else {
        results.push(res.right);
      }
    }

    return E.right(results);
  };
}

export function provide<R>(
  r: R
): <R1, E, A>(fa: App<R & R1, E, A>) => App<R1, E, A> {
  return (fa) => (c) => fa({ ...c, ...r });
}

export function provideM<R, R2, E2>(
  r: App<R2, E2, R>
): <R1, E, A>(fa: App<R & R1, E, A>) => App<R1 & R2, E | E2, A> {
  return (fa) =>
    pipe(
      r,
      chain((c) => pipe(fa, provide(c)))
    );
}

export function unsafeRun<E, A>(fa: App<unknown, E, A>) {
  return fa({})();
}

export const Do = RTE.Do;

export const bind: <N extends string, A, R, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => App<R, E, B>
) => <R1, E1>(
  fa: App<R1, E1, A>
) => App<
  R & R1,
  E | E1,
  { [K in N | keyof A]: K extends keyof A ? A[K] : B }
> = RTE.bind as any;
