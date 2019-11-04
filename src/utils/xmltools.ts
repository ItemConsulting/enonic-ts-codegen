import { pascalCase } from "change-case";
import * as path from "path";
import * as xmldom from "xmldom";
import { evaluate, flatmapXpathResult, mapXpathResult } from "./xpathutils";
const xpath = require("xpath");

export const MissingFieldNameError = "A field is missing a name attribute";
export const InvalidMixinError = "Failed to parse mixin";

/**
 * generateInterfaceName generates a name for a TypeScript interface from a filename.
 * @param filename
 */
export function generateInterfaceName(filename: string): string {
  return pascalCase(path.basename(filename, path.extname(filename)));
}

export interface InterfaceGenerator {
  /**
   * createInterface generates TypeScript code for an interface. If the XML contains
   * mixins, the mixins must be added before it can generate the code.
   * @param interfaceName
   * @param xml
   */
  createInterface(interfaceName: string, xml: string): string;

  /**
   * addMixin makes a mixin available to createInterface.
   * @param mixinName
   * @param xml
   */
  addMixin(mixinName: string, xml: string): void;
}

export function NewInterfaceGenerator(): InterfaceGenerator {
  return new Generator();
}

class Generator implements InterfaceGenerator {
  private _mixins: Mixin = {};

  createInterface(interfaceName: string, xml: string): string {
    const iface = parseXml(interfaceName, xml);
    return iface.fields.length > 0
      ? formatInterface({
          name: interfaceName,
          fields: iface.fields.reduce(this.substituteMixins, [])
        })
      : "";
  }

  addMixin(filename: string, xml: string): void {
    const doc = new xmldom.DOMParser().parseFromString(xml);

    const name = path.basename(filename, path.extname(filename));
    const type = GeneratedFieldType.Object;
    const comment = xpath.select1("string(./mixin/display-name)", doc);

    const form = evaluate("./mixin/form", doc).iterateNext();
    if (!form) {
      throw InvalidMixinError;
    }
    const subfields = parseForm(form);
    this._mixins[name] = { name, type, optional: false, comment, subfields };
  }

  substituteMixins = (
    result: Array<GeneratedField>,
    field: GeneratedField
  ): Array<GeneratedField> => {
    if (field.type != GeneratedFieldType.Mixin) {
      return result.concat([field]);
    }
    const mixin = this._mixins[field.name];
    if (!mixin) {
      throw InvalidMixinError;
    }
    if (mixin.subfields) {
      mixin.subfields = mixin.subfields.reduce(this.substituteMixins, []);
    }
    return result.concat([mixin]);
  };
}

export interface GeneratedInterface {
  name: string;
  fields: Array<GeneratedField>;
}

export interface GeneratedField {
  name: string;
  type: string;
  comment?: string;
  optional: boolean;

  subfields?: Array<GeneratedField>;
}

interface Mixin {
  [key: string]: GeneratedField;
}

enum GeneratedFieldType {
  Boolean = "boolean",
  String = "string",
  StringArray = "Array<string>",
  Array = "Array",
  Object = "Object",
  Mixin = "mixin"
}

function formatInterface(iface: GeneratedInterface): string {
  const fields = iface.fields.map(formatField).join("\n\n");
  return `export interface ${iface.name} {\n${fields}\n}\n`;
}

function formatField(field: GeneratedField): string {
  const optional = field.optional ? "?" : "";
  const comment = field.comment ? formatComment(field.comment) : "";
  const type = formatType(field.type, field.subfields || []);
  return `${comment}  ${field.name}${optional}: ${type};`;
}

function formatType(type: string, subfields: Array<GeneratedField>): string {
  switch (type) {
    case GeneratedFieldType.Array:
      return (
        "Array<{\n" +
        subfields
          .map(formatField)
          .join("\n\n")
          .split("\n")
          .map(line => (line.length > 0 ? "  " + line : line))
          .join("\n") +
        "\n  }>"
      );
    case GeneratedFieldType.Object:
      return (
        "{\n" +
        subfields
          .map(formatField)
          .join("\n\n")
          .split("\n")
          .map(line => (line.length > 0 ? "  " + line : line))
          .join("\n") +
        "\n  }"
      );
    default:
      return type;
  }
}

function formatComment(comment: string): string {
  const commentLines = comment
    .split("\n")
    .map(line => `   * ${line}`)
    .join("\n");
  return `  /**\n${commentLines}\n   */\n`;
}

export function parseXml(name: string, xml: string): GeneratedInterface {
  const doc = new xmldom.DOMParser().parseFromString(xml);
  const form: Node | null = evaluate("//form", doc).iterateNext();
  return { name, fields: form ? parseForm(form) : [] };
}

function parseForm(form: Node): Array<GeneratedField> {
  return [
    ...getInputFields(form),
    ...getFieldSetItems(form),
    ...getItemSetFields(form),
    ...getMixins(form)
  ];
}

function getInputFields(node: Node): Array<GeneratedField> {
  const inputs = evaluate("./input", node);
  return mapXpathResult(inputs, createFieldFromInput);
}

// FieldSet is a flat structure with no nesting.
function getFieldSetItems(node: Node): Array<GeneratedField> {
  const fieldSets = evaluate("./field-set", node);
  return flatmapXpathResult(
    fieldSets,
    (node: Node): Array<GeneratedField> =>
      mapXpathResult(evaluate("./items/input", node), createFieldFromInput)
  );
}

// ItemSet is a nested structure.
function getItemSetFields(node: Node): Array<GeneratedField> {
  const itemSets = evaluate("./item-set", node);

  return mapXpathResult(
    itemSets,
    (node: Node): GeneratedField => {
      const minimumOccurrences = xpath.select1(
        "string(./occurrences/@minimum)",
        node
      );

      const name = xpath.select1("string(@name)", node);
      const type = GeneratedFieldType.Array;
      const optional = minimumOccurrences ? minimumOccurrences === "0" : true;
      const comment = xpath.select1("string(./label)", node);

      const items = evaluate("./items", node).iterateNext();
      const subfields = items
        ? [
            ...getInputFields(items),
            ...getFieldSetItems(items),
            ...getItemSetFields(items)
          ]
        : [];

      return { name, type, optional, comment, subfields };
    }
  );
}

function getMixins(form: Node): Array<GeneratedField> {
  const mixins = evaluate("./mixin", form);
  return mapXpathResult(
    mixins,
    (mixin: Node): GeneratedField => {
      const nameAttr = xpath.select1("@name", mixin);
      const name = nameAttr ? nameAttr.value : "";
      return { name, type: GeneratedFieldType.Mixin, optional: false };
    }
  );
}

function createFieldFromInput(input: Node): GeneratedField {
  const nameAttr = xpath.select1("@name", input);
  if (!nameAttr) {
    throw MissingFieldNameError;
  }
  const typeAttr = xpath.select1("@type", input);

  const minimumOccurrencesAttr = xpath.select1("./occurrences/@minimum", input);
  const maximumOccurrencesAttr = xpath.select1("./occurrences/@maximum", input);

  const name = nameAttr.value;
  const comment = xpath.select1("string(./label)", input);

  const optional = minimumOccurrencesAttr
    ? minimumOccurrencesAttr.value === "0"
    : true;

  const type = getType(typeAttr ? typeAttr.value : "", {
    maxOccurrences: maximumOccurrencesAttr
      ? Number.parseInt(maximumOccurrencesAttr.value)
      : undefined
  });

  return { name, type, comment, optional };
}

function getType(
  inputType: string,
  options: { maxOccurrences?: number }
): GeneratedFieldType {
  switch (inputType) {
    case "ContentSelector":
      return options.maxOccurrences === 1
        ? GeneratedFieldType.String
        : GeneratedFieldType.StringArray;
    case "CheckBox":
      return GeneratedFieldType.Boolean;
    default:
      return GeneratedFieldType.String;
  }
}
