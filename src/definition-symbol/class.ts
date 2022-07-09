import invariant from 'tiny-invariant';
import ts from 'typescript';
import { getPropertySymbol } from '../utils';
import { defineSymbol } from './index';
import {
  collectAllAncestorTypes,
  directTypeAndSymbol,
  invariantNode,
  nodeOperators,
} from './utils';

export const classOperators = nodeOperators({
  [ts.SyntaxKind.OverrideKeyword](node, checker) {
    return directTypeAndSymbol(node.parent, checker);
  },
  [ts.SyntaxKind.SuperKeyword]: directTypeAndSymbol,
  [ts.SyntaxKind.HeritageClause]: directTypeAndSymbol, // extends/implements

  [ts.SyntaxKind.PrivateIdentifier]: directTypeAndSymbol,

  [ts.SyntaxKind.ClassExpression](node, checker) {
    return directTypeAndSymbol(node.parent, checker);
  },
  [ts.SyntaxKind.ClassDeclaration]: directTypeAndSymbol,
  [ts.SyntaxKind.Constructor](node, checker) {
    invariantNode(node, ts.isConstructorDeclaration);
    return directTypeAndSymbol(node.parent, checker);
  },
  [ts.SyntaxKind.MethodDeclaration]: handleClassFieldDeclaration,
  [ts.SyntaxKind.PropertyDeclaration]: handleClassFieldDeclaration,
  [ts.SyntaxKind.ClassStaticBlockDeclaration]: () => undefined,

  [ts.SyntaxKind.GetAccessor](node, checker) {
    invariantNode(node, ts.isGetAccessor);
    return directTypeAndSymbol(node.name, checker);
  },
  [ts.SyntaxKind.SetAccessor](node, checker) {
    invariantNode(node, ts.isSetAccessor);
    return directTypeAndSymbol(node.name, checker);
  },

  [ts.SyntaxKind.SemicolonClassElement]: () => undefined,

  // Type
  [ts.SyntaxKind.PropertySignature](node, checker) {
    invariantNode(node, ts.isPropertySignature);
    return directTypeAndSymbol(node.name, checker);
  },
});

function handleClassFieldDeclaration(node: ts.Node, checker: ts.TypeChecker) {
  invariantNode(node, ts.isClassElement);

  const nameNode = node.name;
  if (!nameNode) {
    return directTypeAndSymbol(node, checker);
  }

  const ret = directTypeAndSymbol(nameNode, checker);
  if (ret) {
    const declaration = ret.symbol?.declarations?.[0];
    if (declaration === node) {
      // Walk through heritage clauses to see if we have any upstream
      // interfaces defining this property.
      const ancestorsWithProperty = collectAllAncestorTypes(
        node.parent,
        checker
      )
        .map((type) => {
          if (type.getProperty(nameNode.getText())) {
            return type;
          }
        })
        .filter(Boolean);

      if (ancestorsWithProperty?.[0]) {
        return getPropertySymbol(
          node,
          ancestorsWithProperty[0],
          checker,
          node.name.getText()
        );
      }

      return ret;
    }
  }
}