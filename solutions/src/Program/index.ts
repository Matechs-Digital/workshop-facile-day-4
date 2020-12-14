import * as App from "@app/App";
import { Command } from "@app/Domain/Command";
import { West } from "@app/Domain/Orientation";
import { Planet } from "@app/Domain/Planet";
import { RoverState } from "@app/Domain/RoverState";
import { pipe } from "@app/Function";
import { makeStateRef } from "@app/StateRef";

export interface ProgramConfig {
  ProgramConfig: {
    planet: Planet;
    initialState: RoverState;
  };
}

export interface ProgramState {
  ProgramState: {
    roverState: App.UIO<RoverState>;
    setRoverState: (s: RoverState) => App.UIO<RoverState>;
  };
}

export const initialState = pipe(
  App.Do,
  App.bind("initial", () => getInitialState),
  App.bind("ref", ({ initial }) => makeStateRef(initial)),
  App.map(
    ({ ref }): ProgramState => ({
      ProgramState: {
        roverState: ref.get,
        setRoverState: ref.set,
      },
    })
  )
);

export const getPlanet = App.access(
  ({ ProgramConfig }: ProgramConfig) => ProgramConfig.planet
);

export const getInitialState = App.access(
  ({ ProgramConfig }: ProgramConfig) => ProgramConfig.initialState
);

export const getRoverState = App.accessM(
  ({ ProgramState }: ProgramState) => ProgramState.roverState
);

export const setRoverState = (nextState: RoverState) =>
  App.accessM(({ ProgramState }: ProgramState) =>
    ProgramState.setRoverState(nextState)
  );

export function move(
  _commands: readonly Command[]
): App.RIO<ProgramConfig & ProgramState, RoverState> {
  return pipe(
    App.Do,
    App.bind("planet", () => getPlanet),
    App.bind("state", () => getRoverState),
    App.map(({ state }) => state)
  );
}

export function mod(actual: number, n: number) {
  const r = actual % n;
  if (r < 0) {
    return r + n;
  }
  return r;
}

export function process(
  command: Command
): App.RIO<ProgramConfig & ProgramState, void> {
  return pipe(
    App.Do,
    App.bind("planet", () => getPlanet),
    App.bind("state", () => getRoverState),
    App.bind("nextState", ({ state, planet }) =>
      App.sync(
        (): RoverState => {
          switch (command._tag) {
            case "TurnLeft": {
              switch (state.orientation._tag) {
                case "North": {
                  return {
                    orientation: new West(),
                    position: {
                      x: mod(state.position.x - 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
              }
              return {
                orientation: state.orientation,
                position: state.position,
              };
            }
            case "TurnRight": {
              return {
                orientation: state.orientation,
                position: state.position,
              };
            }
            case "MoveForward": {
              return {
                orientation: state.orientation,
                position: state.position,
              };
            }
            case "MoveBackward": {
              return {
                orientation: state.orientation,
                position: state.position,
              };
            }
          }
        }
      )
    ),
    App.tap(({ nextState }) => setRoverState(nextState)),
    App.map(() => {})
  );
}
