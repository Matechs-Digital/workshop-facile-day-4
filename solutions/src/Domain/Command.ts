export type Command = MoveForward | MoveBackward | TurnLeft | TurnRight;

export class MoveForward {
  readonly _tag = "MoveForward";
}

export class MoveBackward {
  readonly _tag = "MoveBackward";
}

export class TurnLeft {
  readonly _tag = "TurnLeft";
}

export class TurnRight {
  readonly _tag = "TurnRight";
}
