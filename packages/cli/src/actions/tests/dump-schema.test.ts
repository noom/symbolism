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
            ],
            \\"documentationComment\\": [],
            \\"jsDocTags\\": []
          },
          \\"merged\\": {
            \\"type\\": \\"number\\",
            \\"documentationComment\\": [],
            \\"jsDocTags\\": []
          }
        },
        \\"documentationComment\\": [],
        \\"jsDocTags\\": []
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
                ],
                \\"jsDocTags\\": []
              }
            },
            \\"documentationComment\\": [
              \\"This is prop7, cache test\\"
            ],
            \\"jsDocTags\\": []
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
            ],
            \\"jsDocTags\\": []
          },
          \\"prop1\\": {
            \\"type\\": \\"string\\",
            \\"documentationComment\\": [
              \\"This is prop1\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop2\\": {
            \\"anyOf\\": [
              {
                \\"const\\": null,
                \\"documentationComment\\": [],
                \\"jsDocTags\\": []
              },
              {
                \\"type\\": \\"string\\",
                \\"documentationComment\\": [
                  \\"This is prop2\\"
                ],
                \\"jsDocTags\\": []
              }
            ],
            \\"documentationComment\\": [
              \\"This is prop2\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop3\\": {
            \\"type\\": \\"number\\",
            \\"documentationComment\\": [
              \\"This is prop3\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop4\\": {
            \\"anyOf\\": [
              {
                \\"const\\": null,
                \\"documentationComment\\": [],
                \\"jsDocTags\\": []
              },
              {
                \\"type\\": \\"number\\",
                \\"documentationComment\\": [
                  \\"This is prop4\\"
                ],
                \\"jsDocTags\\": []
              }
            ],
            \\"documentationComment\\": [
              \\"This is prop4\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop5\\": {
            \\"$ref\\": \\"#/$defs/Array\\",
            \\"documentationComment\\": [
              \\"This is prop5\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop7\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop7, cache test\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop8\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop8, cache test\\"
            ],
            \\"jsDocTags\\": []
          },
          \\"prop9\\": {
            \\"$ref\\": \\"#/$defs/Record\\",
            \\"documentationComment\\": [
              \\"This is prop9, cache test\\"
            ],
            \\"jsDocTags\\": [
              {
                \\"name\\": \\"deprecated\\",
                \\"text\\": [
                  \\"This is jsDoc tag test\\"
                ]
              }
            ]
          }
        },
        \\"documentationComment\\": [
          \\"This is SchemaWithComments\\"
        ],
        \\"jsDocTags\\": []
      }"
    `);
  });
});
