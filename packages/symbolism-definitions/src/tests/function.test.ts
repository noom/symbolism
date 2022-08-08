import { dumpDefinition } from "@symbolism/ts-debug";
import { findIdentifiers, findNodeInTree } from "@symbolism/ts-utils";
import ts from "typescript";
import { mockProgram } from "../../test/utils";
import { defineSymbol } from "../index";

describe("infer functions", () => {
  it("should resolve function expression", () => {
    const program = mockProgram({
      "test.ts": `
        const foo = function() {}
        foo();
      `,
    });
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile("test.ts")!;

    const expressionNode = findNodeInTree(sourceFile, ts.isFunctionExpression)!;
    const expressionSymbol = defineSymbol(expressionNode, checker);
    expect(dumpDefinition(expressionSymbol, checker)).toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 15,
            "fileName": "test.ts",
            "kind": "VariableDeclaration",
            "line": 2,
            "name": "foo = function() {}",
            "path": "foo",
          },
        ],
        "type": "() => void",
      }
    `);

    const nodes = findIdentifiers(sourceFile, "foo");

    const reference = defineSymbol(nodes[0], checker);
    expect(dumpDefinition(reference, checker)).toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 15,
            "fileName": "test.ts",
            "kind": "VariableDeclaration",
            "line": 2,
            "name": "foo = function() {}",
            "path": "foo",
          },
        ],
        "type": "() => void",
      }
    `);
  });
  it("should handle yield", () => {
    const program = mockProgram({
      "test.ts": `
        const bar = {};
        const foo = function*() {
          yield bar;
        }
        foo();
      `,
    });
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile("test.ts")!;

    const node = findNodeInTree(sourceFile, ts.isYieldExpression)!;
    expect(dumpDefinition(defineSymbol(node, checker), checker))
      .toMatchInlineSnapshot(`
      Object {
        "symbol": Array [],
        "type": "any",
      }
    `);
  });
  it("should resolve destructured parameters", () => {
    const program = mockProgram({
      "test.ts": `
        type ExplicitType = { foo: string };
        const bar: (obj: ExplicitType) => void = function({
          foo
        }) {
          console.log(foo);
          console.log({ foo });
        }
      `,
    });
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile("test.ts")!;

    const nodes = findIdentifiers(sourceFile, "foo");

    // Declaration
    expect(dumpDefinition(defineSymbol(nodes[0], checker), checker))
      .toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 31,
            "fileName": "test.ts",
            "kind": "PropertySignature",
            "line": 2,
            "name": "foo: string",
            "path": "ExplicitType.foo",
          },
        ],
        "type": "string",
      }
    `);

    // Destructure
    expect(dumpDefinition(defineSymbol(nodes[1], checker), checker))
      .toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 31,
            "fileName": "test.ts",
            "kind": "PropertySignature",
            "line": 2,
            "name": "foo: string",
            "path": "ExplicitType.foo",
          },
        ],
        "type": "string",
      }
    `);

    // Use
    expect(dumpDefinition(defineSymbol(nodes[2], checker), checker))
      .toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 31,
            "fileName": "test.ts",
            "kind": "PropertySignature",
            "line": 2,
            "name": "foo: string",
            "path": "ExplicitType.foo",
          },
        ],
        "type": "string",
      }
    `);

    // Shorthand property
    expect(dumpDefinition(defineSymbol(nodes[3], checker), checker))
      .toMatchInlineSnapshot(`
      Object {
        "symbol": Array [
          Object {
            "column": 31,
            "fileName": "test.ts",
            "kind": "PropertySignature",
            "line": 2,
            "name": "foo: string",
            "path": "ExplicitType.foo",
          },
        ],
        "type": "string",
      }
    `);
  });
});
