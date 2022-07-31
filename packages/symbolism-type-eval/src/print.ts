import { format } from "prettier";
import ts from "typescript";
import type { AnySchemaNode } from "./schema";

export function printSchema(schema: AnySchemaNode): string {
  const unformattedText = "type foo = " + printSchemaNode(schema);
  try {
    return format(unformattedText, { parser: "typescript" });
  } catch (err) {
    console.log(err);
    // console.log(unformattedText);
    return unformattedText;
  }
}

export function printSchemaNode(schema: AnySchemaNode): string {
  function printString(str: string): string {
    return str
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
  }
  switch (schema.kind) {
    case "primitive":
      return schema.name;
    case "literal":
      if (typeof schema.value === "string") {
        return `"${schema.value}"`;
      }
      if (typeof schema.value === "bigint") {
        return `${schema.value}n`;
      }
      return schema.value + "";
    case "array":
      return `(${printSchemaNode(schema.items)})[]`;
    case "tuple":
      return `[${schema.items
        .map((item, i) => {
          const elementFlags = schema.elementFlags[i];
          const isRest = elementFlags & ts.ElementFlags.Rest;
          const isOptional = elementFlags & ts.ElementFlags.Optional;

          return (
            (isRest ? "..." : "") +
            printSchemaNode(item) +
            (isRest ? "[]" : "") +
            (isOptional ? "?" : "")
          );
        })
        .join(", ")}]`;
    case "object":
      const keys = Object.keys(schema.properties);
      if (keys.length === 1) {
        return `{ ${JSON.stringify(keys[0])}: ${printSchemaNode(
          schema.properties[keys[0]]
        )} }`;
      }

      return (
        "{\n" +
        printString(
          Object.keys(schema.properties)
            .sort()
            .map((name) => {
              const property = schema.properties[name];
              return `  ${JSON.stringify(name)}: ${printSchemaNode(property)},`;
            })
            .join("\n")
        ) +
        "}"
      );
    case "function":
      return `(${schema.parameters
        .map(({ name, schema }) => `${name}: ${printSchemaNode(schema)}`)
        .join(", ")}) => ${printSchemaNode(schema.returnType)}`;
    case "error":
      // console.log(schema, new Error().stack);
      return JSON.stringify("error! " + schema.extra);
    case "union":
    case "intersection":
      const separator = schema.kind === "union" ? "\n  | " : "\n  & ";
      return `
  ${separator} ${printString(
        schema.items.map(printSchemaNode).sort().join(separator)
      )}`;
    case "template-literal":
      return `\`${schema.items
        .map((child) => {
          if (child.kind === "literal") {
            return child.value;
          }
          return "${" + printSchemaNode(child) + "}";
        })
        .join("")}\``;

    default:
      const gottaCatchEmAll: never = schema;
      throw new Error(`Unsupported schema kind ${(schema as any).kind}`);
  }
}
