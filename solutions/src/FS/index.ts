import * as App from "@app/App";
import * as E from "@app/Either";
import * as fs from "fs";
import * as readline from "readline";

export class ReadFileError {
  readonly _tag = "ReadFileError";
  constructor(readonly path: string, readonly error: NodeJS.ErrnoException) {}
}

export interface FS {
  FS: {
    readFile: (path: string) => App.FIO<ReadFileError, string>;
    readConsole: App.UIO<string>;
  };
}

export const readFile = (path: string) =>
  App.accessM(({ FS }: FS) => FS.readFile(path));

export const readLineFromConsole = App.accessM(({ FS }: FS) => FS.readConsole);

export const liveFS: FS = {
  FS: {
    readFile: (path) =>
      App.callback((res) => {
        fs.readFile(path, (err, data) => {
          if (err) {
            res(E.left(new ReadFileError(path, err)));
          } else {
            res(E.right(data.toString("utf-8")));
          }
        });
      }),
    readConsole: App.callback((res) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("> ", (answer) => {
        rl.close();
        res(E.right(answer));
      });
    }),
  },
};
