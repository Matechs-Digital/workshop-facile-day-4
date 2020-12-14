import * as App from "@app/App";
import * as E from "@app/Either";
import { Planet } from "@app/Domain/Planet";
import { RoverState } from "@app/Domain/RoverState";
import { East, North, South, West } from "@app/Domain/Orientation";

export class InvalidPlanetConfig {
  readonly _tag = "InvalidPlanetConfig";
  constructor(readonly spec: string) {}
}
export class InvalidInitialStateConfig {
  readonly _tag = "InvalidInitialStateConfig";
  constructor(readonly spec: string) {}
}

export function parsePlanet(
  spec: string
): App.FIO<InvalidPlanetConfig, Planet> {
  return App.callback((res) => {
    const result = spec.match(/^(\d+)x(\d+)$/);

    if (result) {
      try {
        const x = parseInt(result[1], 10);
        const y = parseInt(result[2], 10);

        if (Number.isNaN(x) || Number.isNaN(y)) {
          res(E.left(new InvalidPlanetConfig(spec)));
        } else {
          res(
            E.right({
              x,
              y,
            })
          );
        }
      } catch {
        res(E.left(new InvalidPlanetConfig(spec)));
      }
    } else {
      res(E.left(new InvalidPlanetConfig(spec)));
    }
  });
}

export function parseInitialState(
  spec: string
): App.FIO<InvalidInitialStateConfig, RoverState> {
  return App.callback((res) => {
    const result = spec.match(/^(\d+),(\d+):(N|S|E|W)$/);

    if (result) {
      try {
        const x = parseInt(result[1], 10);
        const y = parseInt(result[2], 10);

        if (Number.isNaN(x) || Number.isNaN(y)) {
          res(E.left(new InvalidInitialStateConfig(spec)));
        } else {
          res(
            E.right({
              position: {
                x,
                y,
              },
              orientation:
                result[3] === "N"
                  ? new North()
                  : result[3] === "S"
                  ? new South()
                  : result[3] === "E"
                  ? new East()
                  : new West(),
            })
          );
        }
      } catch {
        res(E.left(new InvalidInitialStateConfig(spec)));
      }
    } else {
      res(E.left(new InvalidInitialStateConfig(spec)));
    }
  });
}
