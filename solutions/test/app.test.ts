import * as App from "@app/App";
import * as E from "@app/Either";
import { pipe } from "@app/Function";

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
  it("should use async", async () => {
    const program = App.async(
      () =>
        new Promise<number>((res) => {
          setTimeout(() => {
            res(1);
          }, 100);
        })
    );

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.right(1));
  });
  it("should use trySync - succeed", async () => {
    class MyError {
      readonly _tag = "MyError";
      constructor(readonly error: unknown) {}
    }
    const program = App.trySync(
      () => {
        return 1 + 1;
      },
      (e) => new MyError(e)
    );

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.right(2));
  });
  it("should use trySync - fail", async () => {
    class MyError {
      readonly _tag = "MyError";
      constructor(readonly error: unknown) {}
    }
    const program = App.trySync(
      (): number => {
        throw "error";
      },
      (e) => new MyError(e)
    );

    const main = program({});

    const result = await main();

    expect(result).toEqual(E.left(new MyError("error")));
  });
  it("should use tryAsync", async () => {
    class MyError {
      readonly _tag = "MyError";
      constructor(readonly error: unknown) {}
    }
    const programFail = App.tryAsync(
      () => Promise.reject("error"),
      (e) => new MyError(e)
    );
    const programSucceed = App.tryAsync(
      () => Promise.resolve("result"),
      (e) => new MyError(e)
    );

    const mainFail = programFail({});
    const mainSucceed = programSucceed({});

    const resultFail = await mainFail();
    const resultSucceed = await mainSucceed();

    expect(resultFail).toEqual(E.left(new MyError("error")));
    expect(resultSucceed).toEqual(E.right("result"));
  });
  it("should use access", async () => {
    interface Config {
      Config: {
        multiplier: number;
      };
    }

    const program = App.access(({ Config }: Config) => Config.multiplier * 3);

    const main = program({
      Config: {
        multiplier: 2,
      },
    });

    const result = await main();

    expect(result).toEqual(E.right(6));
  });
  it("should use map", async () => {
    interface Config {
      Config: {
        base: number;
      };
    }

    const program = pipe(
      App.access((_: Config) => _.Config.base),
      App.map((n) => n + 1),
      App.map((n) => n + 2),
      App.map((n) => n + 3)
    );

    const main = program({
      Config: {
        base: 1,
      },
    });

    const result = await main();

    expect(result).toEqual(E.right(7));
  });
});
