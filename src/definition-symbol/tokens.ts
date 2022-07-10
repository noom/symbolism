import ts from "typescript";
import { nodeOperators } from "./utils";

export const tokenOperators = nodeOperators({
  [ts.SyntaxKind.EndOfFileToken]: nopHandler,
  [ts.SyntaxKind.SingleLineCommentTrivia]: nopHandler,
  [ts.SyntaxKind.MultiLineCommentTrivia]: nopHandler,
  [ts.SyntaxKind.NewLineTrivia]: nopHandler,
  [ts.SyntaxKind.WhitespaceTrivia]: nopHandler,
  [ts.SyntaxKind.ShebangTrivia]: nopHandler,
  [ts.SyntaxKind.ConflictMarkerTrivia]: nopHandler,
  [ts.SyntaxKind.OpenBraceToken]: nopHandler,
  [ts.SyntaxKind.CloseBraceToken]: nopHandler,
  [ts.SyntaxKind.OpenParenToken]: nopHandler,
  [ts.SyntaxKind.CloseParenToken]: nopHandler,
  [ts.SyntaxKind.OpenBracketToken]: nopHandler,
  [ts.SyntaxKind.CloseBracketToken]: nopHandler,
  [ts.SyntaxKind.DotToken]: nopHandler,
  [ts.SyntaxKind.DotDotDotToken]: nopHandler,
  [ts.SyntaxKind.SemicolonToken]: nopHandler,
  [ts.SyntaxKind.CommaToken]: nopHandler,
  [ts.SyntaxKind.QuestionDotToken]: nopHandler,
  [ts.SyntaxKind.LessThanToken]: nopHandler,
  [ts.SyntaxKind.LessThanSlashToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanToken]: nopHandler,
  [ts.SyntaxKind.LessThanEqualsToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanEqualsToken]: nopHandler,
  [ts.SyntaxKind.EqualsEqualsToken]: nopHandler,
  [ts.SyntaxKind.ExclamationEqualsToken]: nopHandler,
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: nopHandler,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: nopHandler,
  [ts.SyntaxKind.EqualsGreaterThanToken]: nopHandler,
  [ts.SyntaxKind.PlusToken]: nopHandler,
  [ts.SyntaxKind.MinusToken]: nopHandler,
  [ts.SyntaxKind.AsteriskToken]: nopHandler,
  [ts.SyntaxKind.AsteriskAsteriskToken]: nopHandler,
  [ts.SyntaxKind.SlashToken]: nopHandler,
  [ts.SyntaxKind.PercentToken]: nopHandler,
  [ts.SyntaxKind.PlusPlusToken]: nopHandler,
  [ts.SyntaxKind.MinusMinusToken]: nopHandler,
  [ts.SyntaxKind.LessThanLessThanToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: nopHandler,
  [ts.SyntaxKind.AmpersandToken]: nopHandler,
  [ts.SyntaxKind.BarToken]: nopHandler,
  [ts.SyntaxKind.CaretToken]: nopHandler,
  [ts.SyntaxKind.ExclamationToken]: nopHandler,
  [ts.SyntaxKind.TildeToken]: nopHandler,
  [ts.SyntaxKind.AmpersandAmpersandToken]: nopHandler,
  [ts.SyntaxKind.BarBarToken]: nopHandler,
  [ts.SyntaxKind.QuestionToken]: nopHandler,
  [ts.SyntaxKind.ColonToken]: nopHandler,
  [ts.SyntaxKind.AtToken]: nopHandler,
  [ts.SyntaxKind.QuestionQuestionToken]: nopHandler,
  [ts.SyntaxKind.BacktickToken]: nopHandler,
  [ts.SyntaxKind.HashToken]: nopHandler,
  [ts.SyntaxKind.EqualsToken]: nopHandler,
  [ts.SyntaxKind.PlusEqualsToken]: nopHandler,
  [ts.SyntaxKind.MinusEqualsToken]: nopHandler,
  [ts.SyntaxKind.AsteriskEqualsToken]: nopHandler,
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken]: nopHandler,
  [ts.SyntaxKind.SlashEqualsToken]: nopHandler,
  [ts.SyntaxKind.PercentEqualsToken]: nopHandler,
  [ts.SyntaxKind.LessThanLessThanEqualsToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken]: nopHandler,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: nopHandler,
  [ts.SyntaxKind.AmpersandEqualsToken]: nopHandler,
  [ts.SyntaxKind.BarEqualsToken]: nopHandler,
  [ts.SyntaxKind.BarBarEqualsToken]: nopHandler,
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken]: nopHandler,
  [ts.SyntaxKind.QuestionQuestionEqualsToken]: nopHandler,
  [ts.SyntaxKind.CaretEqualsToken]: nopHandler,
  [ts.SyntaxKind.BreakKeyword]: nopHandler,
  [ts.SyntaxKind.CaseKeyword]: nopHandler,
  [ts.SyntaxKind.CatchKeyword]: nopHandler,
  [ts.SyntaxKind.ClassKeyword]: nopHandler,
  [ts.SyntaxKind.ConstKeyword]: nopHandler,
  [ts.SyntaxKind.ContinueKeyword]: nopHandler,
  [ts.SyntaxKind.DebuggerKeyword]: nopHandler,
  [ts.SyntaxKind.DefaultKeyword]: nopHandler,
  [ts.SyntaxKind.DeleteKeyword]: nopHandler,
  [ts.SyntaxKind.DoKeyword]: nopHandler,
  [ts.SyntaxKind.ElseKeyword]: nopHandler,
  [ts.SyntaxKind.EnumKeyword]: nopHandler,
  [ts.SyntaxKind.ExportKeyword]: nopHandler,
  [ts.SyntaxKind.ExtendsKeyword]: nopHandler,

  [ts.SyntaxKind.FinallyKeyword]: nopHandler,
  [ts.SyntaxKind.ForKeyword]: nopHandler,
  [ts.SyntaxKind.FunctionKeyword]: nopHandler,
  [ts.SyntaxKind.IfKeyword]: nopHandler,
  [ts.SyntaxKind.ImportKeyword]: nopHandler,
  [ts.SyntaxKind.InKeyword]: nopHandler,
  [ts.SyntaxKind.InstanceOfKeyword]: nopHandler,
  [ts.SyntaxKind.NewKeyword]: nopHandler,
  [ts.SyntaxKind.ReturnKeyword]: nopHandler,
  [ts.SyntaxKind.SwitchKeyword]: nopHandler,
  [ts.SyntaxKind.ThrowKeyword]: nopHandler,
  [ts.SyntaxKind.TryKeyword]: nopHandler,
  [ts.SyntaxKind.TypeOfKeyword]: nopHandler,
  [ts.SyntaxKind.VarKeyword]: nopHandler,
  [ts.SyntaxKind.WhileKeyword]: nopHandler,
  [ts.SyntaxKind.WithKeyword]: nopHandler,
  [ts.SyntaxKind.ImplementsKeyword]: nopHandler,
  [ts.SyntaxKind.InterfaceKeyword]: nopHandler,
  [ts.SyntaxKind.LetKeyword]: nopHandler,
  [ts.SyntaxKind.PackageKeyword]: nopHandler,
  [ts.SyntaxKind.PrivateKeyword]: nopHandler,
  [ts.SyntaxKind.ProtectedKeyword]: nopHandler,
  [ts.SyntaxKind.PublicKeyword]: nopHandler,
  [ts.SyntaxKind.StaticKeyword]: nopHandler,
  [ts.SyntaxKind.YieldKeyword]: nopHandler,
  [ts.SyntaxKind.AbstractKeyword]: nopHandler,
  [ts.SyntaxKind.AsKeyword]: nopHandler,
  [ts.SyntaxKind.AssertsKeyword]: nopHandler,
  [ts.SyntaxKind.AssertKeyword]: nopHandler,
  [ts.SyntaxKind.AnyKeyword]: nopHandler,
  [ts.SyntaxKind.AsyncKeyword]: nopHandler,
  [ts.SyntaxKind.AwaitKeyword]: nopHandler,
  [ts.SyntaxKind.VoidKeyword]: nopHandler,
  [ts.SyntaxKind.BooleanKeyword]: nopHandler,
  [ts.SyntaxKind.ConstructorKeyword]: nopHandler,
  [ts.SyntaxKind.DeclareKeyword]: nopHandler,
  [ts.SyntaxKind.GetKeyword]: nopHandler,
  [ts.SyntaxKind.InferKeyword]: nopHandler,
  [ts.SyntaxKind.IntrinsicKeyword]: nopHandler,
  [ts.SyntaxKind.IsKeyword]: nopHandler,
  [ts.SyntaxKind.KeyOfKeyword]: nopHandler,
  [ts.SyntaxKind.ModuleKeyword]: nopHandler,
  [ts.SyntaxKind.NamespaceKeyword]: nopHandler,
  [ts.SyntaxKind.NeverKeyword]: nopHandler,
  [ts.SyntaxKind.OutKeyword]: nopHandler,
  [ts.SyntaxKind.ReadonlyKeyword]: nopHandler,
  [ts.SyntaxKind.RequireKeyword]: nopHandler,
  [ts.SyntaxKind.NumberKeyword]: nopHandler,
  [ts.SyntaxKind.ObjectKeyword]: nopHandler,
  [ts.SyntaxKind.SetKeyword]: nopHandler,
  [ts.SyntaxKind.StringKeyword]: nopHandler,
  [ts.SyntaxKind.SymbolKeyword]: nopHandler,
  [ts.SyntaxKind.TypeKeyword]: nopHandler,
  [ts.SyntaxKind.UndefinedKeyword]: nopHandler,
  [ts.SyntaxKind.UniqueKeyword]: nopHandler,
  [ts.SyntaxKind.UnknownKeyword]: nopHandler,
  [ts.SyntaxKind.FromKeyword]: nopHandler,
  [ts.SyntaxKind.GlobalKeyword]: nopHandler,
  [ts.SyntaxKind.BigIntKeyword]: nopHandler,
  [ts.SyntaxKind.OfKeyword]: nopHandler,
});

function nopHandler() {
  return null;
}
