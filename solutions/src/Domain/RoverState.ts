import { Orientation } from "./Orientation";
import { Position } from "./Position";

export interface RoverState {
  readonly position: Position;
  readonly orientation: Orientation;
}
