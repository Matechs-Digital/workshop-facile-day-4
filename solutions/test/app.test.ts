import * as App from "@app/App";
import * as E from "@app/Either";

describe("App", () => {
  it("should use succeed", async () => {
    const program = App.succeed(0);

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.right(0));
  });
  it("should use fail", async () => {
    const program = App.fail(0);

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.left(0));
  });
  it("should use sync", async () => {
    const program = App.sync(() => {
      return 1 + 1;
    });

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.right(2));
  });
});
