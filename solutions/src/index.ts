import * as App from "@app/App";
import * as E from "@app/Either";
import { pipe } from "@app/Function";
import * as P from "@app/Program";
import {
  MoveBackward,
  MoveForward,
  TurnLeft,
  TurnRight,
} from "./Domain/Command";
import { liveFS, readLineFromConsole } from "./FS";

export class InvalidCommand {
  readonly _tag = "InvalidCommand";
  constructor(readonly s: string) {}
}

const main = pipe(
  readLineFromConsole,
  App.chain((s) =>
    s === "F"
      ? P.move([new MoveForward()])
      : s === "B"
      ? P.move([new MoveBackward()])
      : s === "L"
      ? P.move([new TurnLeft()])
      : s === "R"
      ? P.move([new TurnRight()])
      : App.fail(new InvalidCommand(s))
  ),
  App.chain(() => P.getRoverState)
);

pipe(
  main,
  App.provideM(P.initialState),
  App.provideM(P.liveProgramConfig),
  App.provide(liveFS),
  App.unsafeRun
).then((res) => {
  if (E.isLeft(res)) {
    switch (res.left._tag) {
      case "ReadFileError": {
        console.log("Bad file");
        break;
      }
      case "InvalidPlanetConfig": {
        console.log("Invalid planet");
        break;
      }
      case "InvalidInitialStateConfig": {
        console.log("Invalid rover state");
        break;
      }
      case "InvalidCommand": {
        console.log("Invalid command", res.left.s);
        break;
      }
    }
    process.exit(1);
  } else {
    console.log(res.right);
  }
});
