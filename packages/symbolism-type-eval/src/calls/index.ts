import ts, { findAncestor } from "typescript";

import { AnySchemaNode } from "../schema";
import { CallContext } from "../context";
import { dumpNode, dumpSchema, dumpSymbol } from "@symbolism/ts-debug";
import { areSchemasEqual, nonConcreteInputs, SchemaError } from "../classify";
import { getLocalSymbol, resolveSymbolsInSchema } from "../value-eval/symbol";
import {
  logVerbose,
  logWarn,
  NodeError,
  removeDuplicates,
} from "@symbolism/utils";
import { expandUnions } from "../value-eval/union";
import { getSymbolDeclaration, isNamedDeclaration } from "@symbolism/ts-utils";
import { getNodeSchema } from "../value-eval";
import invariant from "tiny-invariant";
import { defineSymbol } from "@symbolism/definitions";

export type FunctionCallInfo = {
  callExpression: ts.CallExpression;
  arguments: AnySchemaNode[];
  symbols: ts.Symbol[];
};

export function loadFunctionCalls(
  symbol: ts.Symbol,
  context: CallContext
): FunctionCallInfo[] {
  const functionCalls = convertFunctionCallsForSymbol(symbol, context);

  // TODO: Flatten binary expressions, etc
  return functionCalls;
}

export function loadFunctionCall(
  node: ts.Node,
  context: CallContext
): FunctionCallInfo[] {
  const callExpression = findAncestor(node, ts.isCallExpression);
  invariant(callExpression, "Node must be in a call expression");

  const definition = defineSymbol(callExpression.expression, context.checker);
  const symbol = definition?.symbol;
  invariant(symbol, "Definition must have a symbol");

  const collectedCalls: FunctionCallInfo[] = [];
  convertCall(symbol, callExpression, context, collectedCalls);

  return removeDuplicates(collectedCalls, (a, b) => {
    return areSchemasEqual(a.arguments, b.arguments);
  });
}

function convertFunctionCallsForSymbol(
  symbol: ts.Symbol,
  context: CallContext
): FunctionCallInfo[] {
  const { symbols, checker } = context;

  const referenceSet = symbols.get(symbol);
  const references = referenceSet && Array.from(referenceSet);

  logVerbose(
    "Converting call",
    dumpSymbol(symbol, checker),
    "references",
    references?.length
  );

  const calls = (references ?? [])
    .map((reference) => {
      const call = findAncestor(reference, ts.isCallExpression)!;
      if (call) {
        if (call.expression === reference) {
          return call;
        } else if (
          ts.isPropertyAccessExpression(call.expression) &&
          call.expression.name === reference
        ) {
          return call;
        }
      }

      return undefined!;
    })
    .filter(Boolean);

  const collectedCalls: FunctionCallInfo[] = [];

  calls.forEach((callExpression) => {
    try {
      convertCall(symbol, callExpression, context, collectedCalls);
    } catch (e: any) {
      throw new NodeError(
        "Error converting call " +
          JSON.stringify(dumpSymbol(symbol, context.checker)),
        callExpression,
        context.checker,
        e
      );
    }
  });

  return removeDuplicates(collectedCalls, (a, b) => {
    return areSchemasEqual(a.arguments, b.arguments);
  });
}

function convertCall(
  currentSymbol: ts.Symbol,
  callExpression: ts.CallExpression,
  context: CallContext,
  collectedCalls: FunctionCallInfo[]
) {
  const { checker } = context;

  const signature = checker.getResolvedSignature(callExpression)!;
  const parameterSymbols = signature.getParameters();

  const argSchemas = callExpression.arguments.map((argument, i) => {
    const schema = getNodeSchema({
      context,
      node: argument,
      decrementDepth: false,
      allowMissing: false,
      limitToValues: true,
    })!;

    const inputs = nonConcreteInputs(schema);
    const inputSymbols = inputs
      .map((input) => {
        const symbol = getLocalSymbol(input, checker);
        if (symbol) {
          return {
            symbol,
            declaration: getSymbolDeclaration(symbol),
          };
        }

        const type = checker.getTypeAtLocation(input);
        if (type.flags & ts.TypeFlags.Any) {
          return undefined!;
        }

        if (
          !ts.isCallExpression(input) &&
          !ts.isArrayLiteralExpression(input)
        ) {
          logWarn("Could not find symbol for input", dumpNode(input, checker));
        }

        return undefined!;
      })
      .filter(Boolean);

    return {
      schema,
      inputs,
      inputSymbols,
    };
  });

  const baseSymbolMap = new Map<ts.Symbol, AnySchemaNode>();

  // Find the inputs that are parameter calls
  const parameterInputs = new Set(
    argSchemas.flatMap((arg) => {
      const parameterNodes: ts.ParameterDeclaration[] = arg.inputSymbols
        .map((node) => findAncestor(node?.declaration, ts.isParameter)!)
        .filter(Boolean);
      return parameterNodes;
    })
  );

  argSchemas.forEach((arg) => {
    arg.inputSymbols.forEach((inputSymbol) => {
      baseSymbolMap.set(
        inputSymbol.symbol,
        getNodeSchema({
          context,
          node: inputSymbol.declaration!,
          decrementDepth: false,
        })!
      );
    });
  });

  // Everything is concrete. No need to expand.
  if (argSchemas.every((arg) => !arg.inputs.length)) {
    collectedCalls.push({
      callExpression,
      arguments: argSchemas.map((arg) =>
        resolveSymbolsInSchema(arg.schema, baseSymbolMap, context)
      ),
      symbols: parameterSymbols,
    });
    return;
  }

  const functionDeclarations = Array.from(
    new Set(Array.from(parameterInputs.values()).map((node) => node.parent))
  ).sort((a, b) => a.pos - b.pos);

  // We have parameters that need to be resolved via upstream calls.
  const upstreamCalls = new Map<ts.SignatureDeclaration, FunctionCallInfo[]>();
  functionDeclarations.forEach((declaration) => {
    let symbol: ts.Symbol | undefined =
      checker.getSymbolAtLocation(declaration);
    if (declaration.name) {
      symbol = context.checker.getSymbolAtLocation(declaration.name);
    } else if (
      isNamedDeclaration(declaration.parent) &&
      declaration.parent.name
    ) {
      symbol = context.checker.getSymbolAtLocation(declaration.parent.name);
    } else {
      symbol = context.checker.getSymbolAtLocation(declaration.parent);
    }
    if (!symbol) {
      // This was likely renamed or passed into a function as an argument.
      // For now we can't go any further than this. In the future we may
      // be able to go further if we trace the callbacks.
      // throw new NodeError(
      //   "Could not find symbol",
      //   declaration,
      //   context.checker
      // );
      return;
    }

    if (context.symbolsHandled.includes(symbol)) {
      throw new NodeError(
        `Infinite recursion detected
  Next Symbol: ${JSON.stringify(dumpSymbol(symbol, checker))}
  Current Symbol: ${JSON.stringify(dumpSymbol(currentSymbol, checker))}

  Symbols Seen:
  - ${context.symbolsHandled
    .map((s) => JSON.stringify(dumpSymbol(s, checker)))
    .join("\n  - ")}


  Declaration: ${JSON.stringify(dumpNode(declaration, checker))}

  Parameter Inputs:
  - ${Array.from(parameterInputs)
    .map((s) => JSON.stringify(dumpNode(s, checker)))
    .join("\n  - ")}

  Arg Schemas:
  - ${argSchemas
    .map(
      (arg) =>
        `\n    - ${arg.inputSymbols
          .map((inputSymbol) =>
            JSON.stringify(dumpSymbol(inputSymbol?.symbol, checker))
          )
          .join("\n    - ")}`
    )
    .join("\n  - ")}
`,
        callExpression,
        context.checker
      );
    }

    const upstreamCall = convertFunctionCallsForSymbol(
      ...context.cloneSymbol(symbol)
    );
    upstreamCalls.set(declaration, upstreamCall);
  });

  let partiallyResolvedArgSchemas: AnySchemaNode[][] = [];

  // Outer call should always be bound
  const firstDeclaration = functionDeclarations.shift()!;
  if (firstDeclaration) {
    const upstreamCall = upstreamCalls.get(firstDeclaration);
    if (!upstreamCall?.length) {
      // If we have no calls at this level, then there is nothing to resolve for any thing inside.
      partiallyResolvedArgSchemas.push(argSchemas.map((arg) => arg.schema));
    } else {
      upstreamCall.forEach((call) => {
        // Inject the arguments into the call
        const symbolMap = new Map<ts.Symbol, AnySchemaNode>(baseSymbolMap);
        parameterInputs.forEach((node) => {
          if (node.parent === firstDeclaration) {
            const symbol = checker.getSymbolAtLocation(node.name)!;
            const parameterIndex = node.parent.parameters.indexOf(node);

            const argument = context.resolveSchema(
              call.arguments[parameterIndex]
            );
            if (argument) {
              symbolMap.set(symbol, argument);
            }
          }
        });
        partiallyResolvedArgSchemas.push(
          argSchemas.map((arg) =>
            resolveSymbolsInSchema(arg.schema, symbolMap, context)
          )
        );
      });
    }
  } else {
    // No calls, so everything is resolved.
    partiallyResolvedArgSchemas.push(
      argSchemas.map((arg) =>
        resolveSymbolsInSchema(arg.schema, baseSymbolMap, context)
      )
    );
  }

  if (functionDeclarations.length) {
    // TODO: Currying. Figure this out. We will have to differentiate between
    // multiple invocations of the outer function, to ensure proper parameter
    // matching on the inner.
    // TODO: Figure out how to record where this return was used
    console.log(
      "multiple declarations",
      dumpNode(firstDeclaration, checker),
      ...functionDeclarations.map((declaration) =>
        dumpNode(declaration, checker)
      )
    );
  }

  partiallyResolvedArgSchemas.forEach((argSchemas) => {
    const expandedArgs = expandUnions({
      items: argSchemas,
      merger() {
        return undefined;
      },
    });

    expandedArgs.forEach((args) => {
      collectedCalls.push({
        callExpression,
        arguments: args,
        symbols: parameterSymbols,
      });
    });
  });
}
