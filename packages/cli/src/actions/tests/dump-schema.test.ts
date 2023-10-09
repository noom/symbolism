import { loadCliConfig } from "@noom/symbolism-utils";
import { Command } from "commander";
import { initDumpSchema } from "../dump-schema";

describe("dumpSchema", () => {
  beforeAll(() => {
    loadCliConfig("./.symbolism.json");
  });
  it("should log ts schema", () => {
    const program = new Command();
    initDumpSchema(program);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse([
      "foo",
      "foo",
      "dumpSchema",
      "--file",
      require.resolve("../../../../test/src/dump-symbol.ts"),
      "Schema",
    ]);

    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "{
        bar: \\"bar\\" | \\"bat\\";
        merged: number;
      };
      "
    `);
  });
  it("should log json schema", () => {
    const program = new Command();
    initDumpSchema(program);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse([
      "foo",
      "foo",
      "dumpSchema",
      "--json",
      "foo",
      "--file",
      require.resolve("../../../../test/src/dump-symbol.ts"),
      "Schema",
    ]);

    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "{
        \\"$schema\\": \\"https://json-schema.org/draft/2020-12/schema\\",
        \\"$id\\": \\"foo\\",
        \\"$defs\\": {},
        \\"type\\": \\"object\\",
        \\"properties\\": {
          \\"bar\\": {
            \\"type\\": \\"string\\",
            \\"enum\\": [
              \\"bar\\",
              \\"bat\\"
            ]
          },
          \\"merged\\": {
            \\"type\\": \\"number\\"
          }
        }
      }"
    `);
  });

  it("should handle docuentation comments", () => {
    const program = new Command();
    initDumpSchema(program);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse([
      "foo",
      "foo",
      "dumpSchema",
      "--json",
      "foo",
      "--file",
      require.resolve("../../../../test/src/dump-symbol.ts"),
      "SchemaWithComments",
    ]);

    // Note (mladen) known issues:
    // - documentationComment added multiple times on complex types
    // - documentationComment added to items in $defs
    // - missing defs/Array
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "{
        \\"$schema\\": \\"https://json-schema.org/draft/2020-12/schema\\",
        \\"$id\\": \\"foo\\",
        \\"$defs\\": {
          \\"Record<string, string>\\": {
            \\"type\\": \\"object\\",
            \\"properties\\": {},
            \\"patternProperties\\": {
              \\"/^.*$/\\": {
                \\"type\\": \\"string\\",
                \\"documentationComment\\": [
                  \\"This is prop7, cache test\\"
                ]
              }
            },
            \\"documentationComment\\": [
              \\"This is prop7, cache test\\"
            ]
          }
        },
        \\"type\\": \\"object\\",
        \\"properties\\": {
          \\"bar\\": {
            \\"type\\": \\"string\\",
            \\"enum\\": [
              \\"bar\\",
              \\"bat\\"
            ],
            \\"documentationComment\\": [
              \\"This is index prop \\\\\\"bar\\\\\\"\\"
            ]
          },
          \\"prop1\\": {
            \\"type\\": \\"string\\",
            \\"documentationComment\\": [
              \\"This is prop1\\"
            ]
          },
          \\"prop2\\": {
            \\"anyOf\\": [
              {
                \\"const\\": null
              },
              {
                \\"type\\": \\"string\\",
                \\"documentationComment\\": [
                  \\"This is prop2\\"
                ]
              }
            ],
            \\"documentationComment\\": [
              \\"This is prop2\\"
            ]
          },
          \\"prop3\\": {
            \\"type\\": \\"number\\",
            \\"documentationComment\\": [
              \\"This is prop3\\"
            ]
          },
          \\"prop4\\": {
            \\"anyOf\\": [
              {
                \\"const\\": null
              },
              {
                \\"type\\": \\"number\\",
                \\"documentationComment\\": [
                  \\"This is prop4\\"
                ]
              }
            ],
            \\"documentationComment\\": [
              \\"This is prop4\\"
            ]
          },
          \\"prop5\\": {
            \\"$ref\\": \\"#/$defs/Array\\",
            \\"documentationComment\\": [
              \\"This is prop5\\"
            ]
          },
          \\"prop7\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop7, cache test\\"
            ]
          },
          \\"prop8\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop8, cache test\\"
            ]
          },
          \\"prop9\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop9, cache test\\"
            ]
          }
        },
        \\"documentationComment\\": [
          \\"This is SchemaWithComments\\"
        ]
      }"
    `);
  });
});
