import ts from 'typescript';
import { dumpNode } from '../symbols';
import { getPropertySymbol, isArraySymbol, isErrorType } from '../utils';
import { classOperators } from './class';
import { functionOperators } from './function';
import { jsDocHandlers } from './jsdoc';
import { jsxSymbolHandlers } from './jsx';
import { tokenOperators } from './tokens';
import {
  contextualTypeAndSymbol,
  DefinitionOperation,
  directTypeAndSymbol,
  getArrayType,
  invariantNode,
  isNamedDeclaration,
} from './utils';

function nopHandler() {
  return null;
}

// TODO: Remove partial once fully spec
const nodeHandlers: Partial<Record<ts.SyntaxKind, DefinitionOperation>> = {
  [ts.SyntaxKind.SourceFile]: directTypeAndSymbol,

  // Low level tokens
  ...tokenOperators,

  // Intrinsic Values
  [ts.SyntaxKind.NullKeyword]: directTypeAndSymbol,
  [ts.SyntaxKind.NumericLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.Unknown]: directTypeAndSymbol,
  [ts.SyntaxKind.BigIntLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.StringLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.RegularExpressionLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.NoSubstitutionTemplateLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.TrueKeyword]: directTypeAndSymbol,
  [ts.SyntaxKind.FalseKeyword]: directTypeAndSymbol,
  [ts.SyntaxKind.NullKeyword]: directTypeAndSymbol,
  [ts.SyntaxKind.VoidExpression]: directTypeAndSymbol,

  // References
  [ts.SyntaxKind.Identifier]: defineIdentifier,
  [ts.SyntaxKind.QualifiedName]: defineIdentifier, // JSX

  // Expressions
  [ts.SyntaxKind.ArrayLiteralExpression]: contextualTypeAndSymbol,
  [ts.SyntaxKind.ObjectLiteralExpression]: contextualTypeAndSymbol,
  [ts.SyntaxKind.PropertyAccessExpression]: defineProperties,
  [ts.SyntaxKind.PropertyAssignment]: defineProperties,
  [ts.SyntaxKind.ShorthandPropertyAssignment]: defineProperties,
  [ts.SyntaxKind.SpreadAssignment]: defineProperties,
  // case ts.SyntaxKind.ComputedPropertyName:

  // case ts.SyntaxKind.ElementAccessExpression:
  // case ts.SyntaxKind.TypeAssertionExpression:
  // case ts.SyntaxKind.ParenthesizedExpression:
  // case ts.SyntaxKind.DeleteExpression:
  // case ts.SyntaxKind.AwaitExpression:
  [ts.SyntaxKind.PrefixUnaryExpression]: directTypeAndSymbol,
  // case ts.SyntaxKind.PostfixUnaryExpression:
  [ts.SyntaxKind.BinaryExpression](node, checker) {
    invariantNode(node, ts.isBinaryExpression);
    if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const left = contextualTypeAndSymbol(node.left, checker);
      const right = contextualTypeAndSymbol(node.right, checker);

      // Select whoever has a type, giving LHS priority
      return left.symbol?.declarations && left.symbol?.declarations.length > 0
        ? left
        : right;
    }
    throw new Error(
      'Not implemented ' + ts.SyntaxKind[node.operatorToken.kind]
    );
  },
  // case ts.SyntaxKind.ConditionalExpression:
  // case ts.SyntaxKind.TemplateExpression:
  // case ts.SyntaxKind.YieldExpression:
  // case ts.SyntaxKind.SpreadElement:
  // case ts.SyntaxKind.OmittedExpression:
  // case ts.SyntaxKind.ExpressionWithTypeArguments:
  // case ts.SyntaxKind.AsExpression:
  // case ts.SyntaxKind.NonNullExpression:
  // case ts.SyntaxKind.MetaProperty:
  // case ts.SyntaxKind.SyntheticExpression:
  // case ts.SyntaxKind.CommaListExpression:

  [ts.SyntaxKind.TaggedTemplateExpression]: defineTaggedTemplate,
  [ts.SyntaxKind.TemplateHead]: directTypeAndSymbol,
  [ts.SyntaxKind.TemplateMiddle]: directTypeAndSymbol,
  [ts.SyntaxKind.TemplateTail]: directTypeAndSymbol,
  [ts.SyntaxKind.TemplateSpan]: directTypeAndSymbol,

  // Statements
  [ts.SyntaxKind.ExpressionStatement]: (
    node: ts.Node,
    checker: ts.TypeChecker
  ) => {
    invariantNode(node, ts.isExpressionStatement);
    return defineSymbol(node.expression, checker);
  },
  [ts.SyntaxKind.EmptyStatement]: directTypeAndSymbol,
  // case ts.SyntaxKind.VariableStatement:
  [ts.SyntaxKind.IfStatement]: directTypeAndSymbol,
  [ts.SyntaxKind.DoStatement]: directTypeAndSymbol,
  [ts.SyntaxKind.WhileStatement]: directTypeAndSymbol,
  // case ts.SyntaxKind.ForStatement:
  // case ts.SyntaxKind.ForInStatement:
  // case ts.SyntaxKind.ForOfStatement:
  // case ts.SyntaxKind.LabeledStatement:
  [ts.SyntaxKind.ThrowStatement]: (node, checker) => {
    invariantNode(node, ts.isThrowStatement);
    return defineSymbol(node.expression, checker);
  },
  // [ts.SyntaxKind.ContinueStatement]: nopHandler,
  // [ts.SyntaxKind.BreakStatement]: nopHandler,
  // [ts.SyntaxKind.WithStatement]: nopHandler,
  // [ts.SyntaxKind.TryStatement]: nopHandler,
  // [ts.SyntaxKind.CatchClause]:
  // [ts.SyntaxKind.DebuggerStatement]: nopHandler,

  // [ts.SyntaxKind.SwitchStatement]: nopHandler,
  // case ts.SyntaxKind.CaseClause:
  // case ts.SyntaxKind.DefaultClause:
  // case ts.SyntaxKind.CaseBlock:

  // Declarations
  // case ts.SyntaxKind.Decorator:
  // case ts.SyntaxKind.CallSignature: Type?

  [ts.SyntaxKind.ObjectBindingPattern]: defineBindingElement,
  [ts.SyntaxKind.ArrayBindingPattern]: defineBindingElement,
  [ts.SyntaxKind.BindingElement]: defineBindingElement,

  // case ts.SyntaxKind.VariableDeclarationList:
  //   return undefined;
  [ts.SyntaxKind.VariableDeclaration]: defineVariableDeclaration,

  // case ts.SyntaxKind.EnumDeclaration:
  // case ts.SyntaxKind.EnumMember:

  // Type Declarations
  [ts.SyntaxKind.ConstructSignature]: directTypeAndSymbol,
  [ts.SyntaxKind.IndexSignature]: directTypeAndSymbol,
  [ts.SyntaxKind.TypePredicate]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeReference]: directTypeAndSymbol,
  [ts.SyntaxKind.FunctionType]: directTypeAndSymbol,
  [ts.SyntaxKind.ConstructorType]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeQuery]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeLiteral]: directTypeAndSymbol,
  [ts.SyntaxKind.ArrayType]: directTypeAndSymbol,
  [ts.SyntaxKind.TupleType]: directTypeAndSymbol,
  [ts.SyntaxKind.OptionalType]: directTypeAndSymbol,
  [ts.SyntaxKind.RestType]: directTypeAndSymbol,
  [ts.SyntaxKind.UnionType]: directTypeAndSymbol,
  [ts.SyntaxKind.IntersectionType]: directTypeAndSymbol,
  [ts.SyntaxKind.ConditionalType]: directTypeAndSymbol,
  [ts.SyntaxKind.InferType]: directTypeAndSymbol,
  [ts.SyntaxKind.ParenthesizedType]: directTypeAndSymbol,
  [ts.SyntaxKind.ThisType]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeOperator]: directTypeAndSymbol,
  [ts.SyntaxKind.IndexedAccessType]: directTypeAndSymbol,
  [ts.SyntaxKind.MappedType]: directTypeAndSymbol,
  [ts.SyntaxKind.LiteralType]: directTypeAndSymbol,
  [ts.SyntaxKind.NamedTupleMember]: directTypeAndSymbol,
  [ts.SyntaxKind.TemplateLiteralType]: directTypeAndSymbol,
  [ts.SyntaxKind.TemplateLiteralTypeSpan]: directTypeAndSymbol,
  [ts.SyntaxKind.InterfaceDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeAliasDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.ModuleDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.ModuleBlock]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeOfExpression]: directTypeAndSymbol,
  [ts.SyntaxKind.MethodSignature]: directTypeAndSymbol,
  [ts.SyntaxKind.TypeParameter]: directTypeAndSymbol,

  // Import/Export
  [ts.SyntaxKind.ImportType]: directTypeAndSymbol,
  [ts.SyntaxKind.NamespaceExportDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.ImportEqualsDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.ImportDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.ImportClause]: directTypeAndSymbol,
  [ts.SyntaxKind.NamespaceImport]: directTypeAndSymbol,
  [ts.SyntaxKind.NamedImports]: directTypeAndSymbol,
  [ts.SyntaxKind.ImportSpecifier]: directTypeAndSymbol,
  [ts.SyntaxKind.ExportAssignment]: directTypeAndSymbol,
  [ts.SyntaxKind.ExportDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.NamedExports]: directTypeAndSymbol,
  [ts.SyntaxKind.NamespaceExport]: directTypeAndSymbol,
  [ts.SyntaxKind.ExportSpecifier]: directTypeAndSymbol,
  [ts.SyntaxKind.ExternalModuleReference]: directTypeAndSymbol,
  [ts.SyntaxKind.ImportTypeAssertionContainer]: directTypeAndSymbol,
  [ts.SyntaxKind.AssertClause]: directTypeAndSymbol,
  [ts.SyntaxKind.AssertEntry]: directTypeAndSymbol,

  // Error Constructs
  [ts.SyntaxKind.MissingDeclaration]: nopHandler,
  [ts.SyntaxKind.UnparsedPrologue]: nopHandler,
  [ts.SyntaxKind.UnparsedPrepend]: nopHandler,
  [ts.SyntaxKind.UnparsedText]: nopHandler,
  [ts.SyntaxKind.UnparsedInternalText]: nopHandler,
  [ts.SyntaxKind.UnparsedSyntheticReference]: nopHandler,

  // Not Printed Constructs
  [ts.SyntaxKind.Bundle]: nopHandler,
  [ts.SyntaxKind.UnparsedSource]: nopHandler,
  [ts.SyntaxKind.InputFiles]: nopHandler,
  [ts.SyntaxKind.SyntaxList]: nopHandler,
  [ts.SyntaxKind.NotEmittedStatement]: nopHandler,
  [ts.SyntaxKind.PartiallyEmittedExpression]: nopHandler,
  [ts.SyntaxKind.SyntheticReferenceExpression]: nopHandler,

  // Misc
  [ts.SyntaxKind.MergeDeclarationMarker]: nopHandler,
  [ts.SyntaxKind.EndOfDeclarationMarker]: nopHandler,

  ...functionOperators,
  ...classOperators,
  ...jsDocHandlers,
  ...jsxSymbolHandlers,
};

export function defineSymbol(node: ts.Node, checker: ts.TypeChecker) {
  console.log('defineSymbol', ts.SyntaxKind[node.kind]); //, dumpNode(node, checker));

  const nodeHandler = nodeHandlers[node.kind];
  if (nodeHandler) {
    return nodeHandler(node, checker);
  }

  console.warn('failed to infer type', dumpNode(node, checker));
  throw new Error('failed to infer type');
  // return checker.getTypeAtLocation(node);
}

function defineIdentifier(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isIdentifier(node)) {
    if (
      ts.isObjectLiteralExpression(node.parent) ||
      ts.isArrayLiteralExpression(node.parent) ||
      ts.isCallExpression(node.parent) ||
      ts.isNewExpression(node.parent) ||
      ts.isArrowFunction(node.parent)
    ) {
      return contextualTypeAndSymbol(node, checker);
    }

    // Identifier pass through
    if (
      (isNamedDeclaration(node.parent) && node.parent.name === node) ||
      ts.isBindingElement(node.parent) ||
      ts.isPropertyAssignment(node.parent) ||
      ts.isPropertyAccessExpression(node.parent) ||
      ts.isBinaryExpression(node.parent) ||
      ts.isConditionalExpression(node.parent) ||
      ts.isVariableDeclaration(node.parent) ||
      ts.isJsxAttribute(node.parent) ||
      ts.isClassExpression(node.parent)
    ) {
      return defineSymbol(node.parent, checker);
    }

    // Use the identifier directly
    // TODO: We want to remove this. Making an explicit list for now to identify missed cases
    if (
      ts.isTypeOfExpression(node.parent) ||
      ts.isReturnStatement(node.parent) ||
      ts.isJsxSpreadAttribute(node.parent) ||
      (ts.isArrowFunction(node.parent) && node.parent.body === node)
    ) {
      return directTypeAndSymbol(node, checker);
    }

    return directTypeAndSymbol(node, checker);

    console.error('failed to infer identifier', dumpNode(node.parent, checker));
    throw new Error('failed to infer identifier');
  }
}

function defineVariableDeclaration(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isVariableDeclaration(node)) {
    return directTypeAndSymbol(node.name, checker);
  }
}

function handleIdentifierInCall(node: ts.Node, checker: ts.TypeChecker) {
  if (
    (ts.isIdentifier(node) ||
      ts.isObjectLiteralExpression(node) ||
      ts.isArrayLiteralExpression(node)) &&
    (ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent))
  ) {
    const parameterIndex = node.parent.arguments?.indexOf(node) ?? -1;
    if (parameterIndex < 0) {
      return;
    }

    const signature = checker.getResolvedSignature(node.parent);
    const parameterSymbol = signature!.parameters[parameterIndex];
    return {
      symbol: parameterSymbol,
      type: checker.getTypeOfSymbolAtLocation(parameterSymbol, node.parent),
    };
  }
}

function defineProperties(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) {
    const objectType = defineSymbol(node.parent, checker);
    if (!objectType || !objectType.type) {
      return;
    }
    const propertyName = node.name.getText();

    return getPropertySymbol(node, objectType.type, checker, propertyName, {
      stringIndex: true,
    });
  }
  if (ts.isPropertyAccessExpression(node)) {
    const type = directTypeAndSymbol(node, checker);
    const typeDeclaration = type.symbol?.declarations?.[0];

    // Check to see if we can resolve the property into ancestors.
    if (typeDeclaration && ts.isPropertyDeclaration(typeDeclaration)) {
      return defineSymbol(typeDeclaration, checker);
    }

    return type;
  }
}

function defineBindingElement(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isBindingElement(node)) {
    if (node.dotDotDotToken) {
      // Spreads will be a synthetic type, just map directly
      const directInferred = directTypeAndSymbol(node, checker);

      return getArrayType(directInferred) || directInferred;
    }

    const bindingPattern = node.parent;
    const bindingPatternType = defineSymbol(bindingPattern, checker);

    const propertyName = ts.isArrayBindingPattern(bindingPattern)
      ? bindingPattern.elements.indexOf(node) + ''
      : (node.propertyName || node.name).getText();

    return getPropertySymbol(
      node,
      bindingPatternType?.type!,
      checker,
      propertyName,
      {
        stringIndex: ts.isObjectBindingPattern(bindingPattern),
        numberIndex: ts.isArrayBindingPattern(bindingPattern),
      }
    );
  }

  if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
    if (ts.isVariableDeclaration(node.parent) || ts.isParameter(node.parent)) {
      return defineSymbol(node.parent, checker);
    }
    throw new Error(
      'unhandled binding pattern: ' + SyntaxKind[node.parent.kind]
    );
  }
}

function defineTaggedTemplate(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isTaggedTemplateExpression(node)) {
    const signature = checker.getResolvedSignature(node);
    if (signature) {
      const returnType = signature.getReturnType();
      if (returnType) {
        return {
          type: returnType,
          symbol: returnType.symbol,
        };
      }
    }
  }
}

function definePassThrough(node: ts.Node, checker: ts.TypeChecker) {
  if (
    ts.isTypeOfExpression(node) ||
    ts.isConditionalExpression(node) ||
    ts.isAsExpression(node)
  ) {
    return defineSymbol(node.parent, checker);
  }
}