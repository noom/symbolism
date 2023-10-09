const foo = "bar";

declare const value: "bat" | typeof foo;

export interface Schema {
  [foo]: typeof value;
}

/** This is SchemaWithComments */
export interface SchemaWithComments {
  /** This is prop1 */
  prop1: string;
  /** This is prop2 */
  prop2?: string;
  /** This is prop3 */
  prop3: number;
  /** This is prop4 */
  prop4?: number;
  /** This is prop5 */
  prop5: (string | number)[];
  /** This is index prop "bar" */
  [foo]: typeof value;
  /** This is prop7, cache test */
  prop7: Record<string, string>;
  /** This is prop8, cache test */
  prop8: Record<string, string>;
  /** This is prop9, cache test */
  prop9: Record<string, string>;
}

window.location.search;
