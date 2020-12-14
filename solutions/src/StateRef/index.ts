import * as App from "@app/App";
import { pipe } from "@app/Function";

export interface StateRef<S> {
  readonly get: App.UIO<S>;
  readonly set: (s: S) => App.UIO<S>;
  readonly update: (f: (s: S) => S) => App.UIO<S>;
  readonly modify: <A>(f: (s: S) => readonly [S, A]) => App.UIO<A>;
}

export function makeStateRef<S>(s: S): App.UIO<StateRef<S>> {
  return pipe(
    App.Do,
    App.bind("stateRef", () =>
      App.sync(() => {
        const ref = {
          current: s,
        };
        return ref;
      })
    ),
    App.map(
      ({ stateRef }): StateRef<S> => ({
        get: App.sync(() => stateRef.current),
        modify: (f) =>
          App.sync(() => {
            const current = stateRef.current;
            const [updated, result] = f(current);
            stateRef.current = updated;
            return result;
          }),
        set: (s) =>
          App.sync(() => {
            stateRef.current = s;
            return stateRef.current;
          }),
        update: (f) =>
          App.sync(() => {
            const current = stateRef.current;
            const updated = f(current);
            stateRef.current = updated;
            return updated;
          }),
      })
    )
  );
}
