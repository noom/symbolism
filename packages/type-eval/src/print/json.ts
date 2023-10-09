import { assertExists, assertUnreachable } from "@noom/symbolism-utils";
import { JsonObject } from "type-fest";
import { isNumericSchema } from "../classify";
import type { AnySchemaNode, Schema } from "../schema";
import { schemaToRegEx } from "../string";
import { printSchemaNode } from "./typescript";
import { SymbolDisplayPart } from "typescript";
import { getDocumentationComment } from "@noom/symbolism-ts-utils";

export function createJsonSchema(params: {
  schema: Schema;
  $id: string;
  $comment?: string;
}): JsonObject {
  const { schema, $id, $comment } = params;

  const $defs: Record<string, JsonObject | null> = {};
  schema.defs?.forEach((node, typeName) => {
    const resolvedDef = typeof node === "function" ? node() : node;
    $defs[schema.friendlyNames?.[typeName] ?? typeName] =
      schemaToJson(resolvedDef);
  });

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id,
    $comment,
    $defs,
    ...schemaToJson(schema.root),
  };
}

const getDocumentation = (schema: AnySchemaNode | undefined) => {
  const documentationComment = getDocumentationComment(schema?.node)
    // Split on line break
    .map((c: SymbolDisplayPart) => c?.text.split(/\r?\n/))
    .flat(Infinity);

  if (documentationComment.length > 0) {
    return { documentationComment };
  }

  return {};
};

export function schemaToJson(
  schema: AnySchemaNode | undefined
): JsonObject | null {
  if (!schema) {
    return null;
  }
  const documentation = getDocumentation(schema);

  switch (schema.kind) {
    case "primitive":
      return {
        type: schema.name,
        ...documentation,
      };
    case "literal":
      if (typeof schema.value === "bigint") {
        return {
          const: `"${schema.value}"`,
          ...documentation,
        };
      }
      return {
        const: schema.value ?? null,
        ...documentation,
      };
    case "array":
      return {
        type: "array",
        items: schemaToJson(schema.items),
        ...documentation,
      };
    case "tuple":
      return {
        type: "array",
        // TODO: Variable length tuples
        maxItems: schema.items.length,
        minItems: schema.items.length,
        prefixItems: schema.items.map((item) => {
          // TODO: Emit flags
          return schemaToJson(item);
        }),
        ...documentation,
      };
    case "object":
      return {
        type: "object",
        properties: Object.keys(schema.properties)
          .sort()
          .reduce((acc, name) => {
            acc[name] = schemaToJson(schema.properties[name]);
            return acc;
          }, {} as Record<string, JsonObject | null>),
        patternProperties: schema.abstractIndexKeys.length
          ? schema.abstractIndexKeys.reduce((acc, { key, value }) => {
              acc[schemaToRegEx(key) + ""] = schemaToJson(value);
              return acc;
            }, {} as Record<string, JsonObject | null>)
          : undefined,
        ...documentation,
      };
    case "function":
      return {
        type: "error",
        message: `${printSchemaNode(schema)} is not supported in JSON schema`,
        ...documentation,
      };
    case "binary-expression":
      if (
        isNumericSchema(schema.items[0]) &&
        isNumericSchema(schema.items[1])
      ) {
        return {
          type: "number",
          ...documentation,
        };
      }
      return {
        type: "string",
        ...documentation,
      };
    case "index":
      return {
        type: "error",
        message: `${printSchemaNode(schema)} is not supported in JSON schema`,
        ...documentation,
      };
    case "index-access":
      return {
        type: "error",
        message: `${printSchemaNode(schema)} is not supported in JSON schema`,
        ...documentation,
      };
    case "error":
      return {
        type: "error",
        message: JSON.stringify("error! " + schema.extra),
        ...documentation,
      };
    case "union": {
      const anyOf = schema.items.map(schemaToJson);
      const literals = anyOf.filter((item) => item?.const);
      if (literals.length === schema.items.length) {
        return {
          type: "string",
          enum: literals.map((item) => assertExists(item?.const)),
          ...documentation,
        };
      }
      return {
        anyOf,
        ...documentation,
      };
    }
    case "intersection":
      return {
        oneOf: schema.items.map(schemaToJson),
        ...documentation,
      };
    case "template-literal":
      return {
        type: "string",
        pattern: schemaToRegEx(schema) + "",
        ...documentation,
      };
    case "reference":
      return {
        $ref: `#/$defs/${schema.name}`,
        ...documentation,
      };

    default:
      // @ts-expect-error - Exhaustive switch
      assertUnreachable(schema, `Unsupported schema kind ${schema.kind}`);
  }
}
