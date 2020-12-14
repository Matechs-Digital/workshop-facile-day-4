import * as App from "@app/App";
import { Command } from "@app/Domain/Command";
import { East, North, South, West } from "@app/Domain/Orientation";
import { Planet } from "@app/Domain/Planet";
import { RoverState } from "@app/Domain/RoverState";
import { pipe } from "@app/Function";
import * as P from "@app/Program";
import { makeStateRef } from "@app/StateRef";
import * as path from "path";
import { readFile } from "@app/FS";
import { parseInitialState, parsePlanet } from "@app/Parser";

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
  commands: readonly Command[]
): App.RIO<ProgramConfig & ProgramState, RoverState> {
  return pipe(
    commands,
    App.foreach(process),
    App.chain(() => getRoverState)
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
                case "East": {
                  return {
                    orientation: new North(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y + 1, planet.y),
                    },
                  };
                }
                case "South": {
                  return {
                    orientation: new East(),
                    position: {
                      x: mod(state.position.x + 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
                case "West": {
                  return {
                    orientation: new South(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y - 1, planet.y),
                    },
                  };
                }
              }
            }
            case "TurnRight": {
              switch (state.orientation._tag) {
                case "North": {
                  return {
                    orientation: new East(),
                    position: {
                      x: mod(state.position.x + 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
                case "East": {
                  return {
                    orientation: new South(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y - 1, planet.y),
                    },
                  };
                }
                case "South": {
                  return {
                    orientation: new East(),
                    position: {
                      x: mod(state.position.x - 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
                case "West": {
                  return {
                    orientation: new North(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y + 1, planet.y),
                    },
                  };
                }
              }
            }
            case "MoveForward": {
              switch (state.orientation._tag) {
                case "North": {
                  return {
                    orientation: new North(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y + 1, planet.y),
                    },
                  };
                }
                case "East": {
                  return {
                    orientation: new East(),
                    position: {
                      x: mod(state.position.x + 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
                case "South": {
                  return {
                    orientation: new South(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y - 1, planet.y),
                    },
                  };
                }
                case "West": {
                  return {
                    orientation: new West(),
                    position: {
                      x: mod(state.position.x - 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
              }
            }
            case "MoveBackward": {
              switch (state.orientation._tag) {
                case "North": {
                  return {
                    orientation: new South(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y - 1, planet.y),
                    },
                  };
                }
                case "East": {
                  return {
                    orientation: new West(),
                    position: {
                      x: mod(state.position.x - 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
                case "South": {
                  return {
                    orientation: new North(),
                    position: {
                      x: state.position.x,
                      y: mod(state.position.y + 1, planet.y),
                    },
                  };
                }
                case "West": {
                  return {
                    orientation: new East(),
                    position: {
                      x: mod(state.position.x + 1, planet.x),
                      y: state.position.y,
                    },
                  };
                }
              }
            }
          }
        }
      )
    ),
    App.tap(({ nextState }) => setRoverState(nextState)),
    App.map(() => {})
  );
}

export const liveProgramConfig = pipe(
  App.Do,
  App.bind("initialState", () =>
    pipe(
      readFile(path.join(__dirname, "../../config/rover.txt")),
      App.chain(parseInitialState)
    )
  ),
  App.bind("planet", () =>
    pipe(
      readFile(path.join(__dirname, "../../config/planet.txt")),
      App.chain(parsePlanet)
    )
  ),
  App.map(
    ({ initialState, planet }): P.ProgramConfig => ({
      ProgramConfig: {
        initialState,
        planet,
      },
    })
  )
);
