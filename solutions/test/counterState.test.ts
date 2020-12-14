import * as App from "@app/App";
import * as E from "@app/Either";
import * as Counter from "@app/CounterState";
import { pipe } from "@app/Function";

describe("CounterState", () => {
  it("should use program", async () => {
    const result = await pipe(
      Counter.program,
      App.provideM(Counter.liveCounterState),
      App.unsafeRun
    );
    expect(result).toEqual(E.right(3));
  });
});
