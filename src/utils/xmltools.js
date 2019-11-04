"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var change_case_1 = require("change-case");
var path = require("path");
var xmldom = require("xmldom");
var xpathutils_1 = require("./xpathutils");
var xpath = require("xpath");
exports.MissingFieldNameError = "A field is missing a name attribute";
/**
 * createInterface parses an xml string and generates code for a TypeScript interface.
 */
function createInterface(interfaceName, xml) {
    return formatInterface(parseXML(interfaceName, xml));
}
exports.createInterface = createInterface;
/**
 * generateInterfaceName generates a name for a TypeScript interface from a filename.
 * @param filename
 */
function generateInterfaceName(filename) {
    return change_case_1.pascalCase(path.basename(filename, path.extname(filename)));
}
exports.generateInterfaceName = generateInterfaceName;
function formatInterface(iface) {
    var fields = iface.fields.map(formatField).join("\n\n");
    return "export interface " + iface.name + " {\n" + fields + "\n};\n";
}
function formatField(field) {
    var optional = field.optional ? "?" : "";
    var comment = field.comment ? formatComment(field.comment) : "";
    var subfields = field.subfields && field.subfields.length > 0
        ? "<{\n" +
            field.subfields
                .map(formatField)
                .join("\n\n")
                .split("\n")
                .map(function (line) { return (line.length > 0 ? "  " + line : line); })
                .join("\n") +
            "\n  }>"
        : "";
    return comment + "  " + field.name + optional + ": " + field.type + subfields;
}
function formatComment(comment) {
    var commentLines = comment
        .split("\n")
        .map(function (line) { return "   * " + line; })
        .join("\n");
    return "  /**\n" + commentLines + "\n   */\n";
}
function parseXML(name, xml) {
    var doc = new xmldom.DOMParser().parseFromString(xml);
    var form = xpathutils_1.evaluate("//form", doc).iterateNext();
    return { name: name, fields: parseForm(form) };
}
exports.parseXML = parseXML;
function parseForm(form) {
    return form
        ? __spreadArrays(getInputFields(form), getFieldSetItems(form), getItemSetFields(form)) : [];
}
function getInputFields(node) {
    var inputs = xpathutils_1.evaluate("./input", node);
    return xpathutils_1.mapXpathResult(inputs, createFieldFromInput);
}
// FieldSet is a flat structure with no nesting.
function getFieldSetItems(node) {
    var fieldSets = xpathutils_1.evaluate("./field-set", node);
    return xpathutils_1.flatmapXpathResult(fieldSets, function (node) {
        return xpathutils_1.mapXpathResult(xpathutils_1.evaluate("./items/input", node), createFieldFromInput);
    });
}
// ItemSet is a nested structure.
function getItemSetFields(node) {
    var itemSets = xpathutils_1.evaluate("./item-set", node);
    return xpathutils_1.mapXpathResult(itemSets, function (node) {
        var nameAttr = xpath.select1("@name", node);
        var minimumOccurrencesAttr = xpath.select1("./occurrences/@minimum", node);
        var name = nameAttr.value;
        var type = "Array";
        var optional = minimumOccurrencesAttr
            ? minimumOccurrencesAttr.value === "0"
            : true;
        var items = xpathutils_1.evaluate("./items", node).iterateNext();
        var subfields = __spreadArrays(getInputFields(items), getFieldSetItems(items), getItemSetFields(items));
        return { name: name, type: type, optional: optional, subfields: subfields };
    });
}
function createFieldFromInput(input) {
    var nameAttr = xpath.select1("@name", input);
    if (!nameAttr) {
        throw exports.MissingFieldNameError;
    }
    var minimumOccurrencesAttr = xpath.select1("./occurrences/@minimum", input);
    var name = nameAttr.value;
    var comment = xpath.select1("string(./label)", input);
    var optional = minimumOccurrencesAttr
        ? minimumOccurrencesAttr.value === "0"
        : true;
    var type = "string";
    return { name: name, type: type, comment: comment, optional: optional };
}
