import * as App from "@app/App";
import { makeStateRef } from "@app/StateRef";
import { pipe } from "fp-ts/lib/pipeable";

export interface CounterState {
  CounterState: {
    readonly increment: App.UIO<number>;
    readonly decrement: App.UIO<number>;
    readonly count: App.UIO<number>;
  };
}

export const increment = App.accessM(
  ({ CounterState }: CounterState) => CounterState.increment
);

export const decrement = App.accessM(
  ({ CounterState }: CounterState) => CounterState.decrement
);

export const count = App.accessM(
  ({ CounterState }: CounterState) => CounterState.count
);

export const liveCounterState = pipe(
  App.Do,
  App.bind("ref", () => makeStateRef(0)),
  App.bind("service", ({ ref }) =>
    App.sync(
      (): CounterState => ({
        CounterState: {
          count: ref.get,
          increment: ref.update((n) => n + 1),
          decrement: ref.update((n) => n - 1),
        },
      })
    )
  ),
  App.map(({ service }) => service)
);

export const program = pipe(
  increment,
  App.chain(() => increment),
  App.chain(() => increment),
  App.chain(() => increment),
  App.chain(() => decrement),
  App.chain(() => count)
);
