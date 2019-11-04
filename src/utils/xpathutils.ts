const xpath = require('xpath');

export function evaluate(
  xpathExpression: string,
  contextNode: Document | Node
): XPathResult {
  return xpath.evaluate(
    xpathExpression,
    contextNode,
    null,
    xpath.XPathResult.ANY_TYPE,
    null
  );
}

export function mapXpathResult<A>(
  inputs: XPathResult,
  f: (node: Node) => A
): Array<A> {
  const result: Array<A> = [];

  let input: Node | null = null;
  while ((input = inputs.iterateNext())) {
    result.push(f(input));
  }

  return result;
}

export function flatmapXpathResult<A>(
  inputs: XPathResult,
  f: (node: Node) => Array<A> | A | null
): Array<A> {
  const result: Array<A> = [];

  let input: Node | null = null;
  while ((input = inputs.iterateNext())) {
    const r = f(input);
    if (Array.isArray(r)) {
      result.push(...r);
    } else if (r == null) {
      continue;
    } else {
      result.push(r);
    }
  }

  return result;
}
