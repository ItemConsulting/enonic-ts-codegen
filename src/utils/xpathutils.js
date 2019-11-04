"use strict";
exports.__esModule = true;
var xpath = require("xpath");
function evaluate(xpathExpression, contextNode) {
    return xpath.evaluate(xpathExpression, contextNode, null, xpath.XPathResult.ANY_TYPE, null);
}
exports.evaluate = evaluate;
function mapXpathResult(inputs, f) {
    var result = [];
    var input = null;
    while ((input = inputs.iterateNext())) {
        result.push(f(input));
    }
    return result;
}
exports.mapXpathResult = mapXpathResult;
function flatmapXpathResult(inputs, f) {
    var result = [];
    var input = null;
    while ((input = inputs.iterateNext())) {
        var r = f(input);
        if (Array.isArray(r)) {
            result.push.apply(result, r);
        }
        else if (r == null) {
            continue;
        }
        else {
            result.push(r);
        }
    }
    return result;
}
exports.flatmapXpathResult = flatmapXpathResult;
