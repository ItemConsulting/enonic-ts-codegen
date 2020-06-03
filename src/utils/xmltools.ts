import { pascalCaseTransformMerge, pascalCase } from "pascal-case";
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
  return pascalCase(
    path.basename(filename, path.extname(filename)),
    {
      transform: pascalCaseTransformMerge
    }
  );
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
    this._mixins[name] = subfields;
  }

  substituteMixins = (
    result: Array<GeneratedField>,
    field: GeneratedField
  ): Array<GeneratedField> => {
    if (field.type != GeneratedFieldType.Mixin) {
      if(field.subfields){
        field.subfields = field.subfields.reduce(this.substituteMixins,[]);
      }
      return result.concat([field]);
    }
    const mixin = this._mixins[field.name];
    if (!mixin) {
      throw InvalidMixinError;
    }

    return result.concat(mixin);
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
  [key: string]: Array<GeneratedField>;
}

enum GeneratedFieldType {
  Boolean = "boolean",
  String = "string",
  Number = "number",
  StringArray = "Array<string>",
  StringOrStringArray = "string | Array<string>",
  Array = "Array",
  Object = "Object",
  Mixin = "mixin"
}

function formatInterface(iface: GeneratedInterface): string {
  const fields = iface.fields.map(formatField).join("\n\n");
  return `export interface ${iface.name} {\n${fields}\n}\n`;
}

function formatField(field: GeneratedField): string {
  const isTypeBoolean = field.type === GeneratedFieldType.Boolean;
  const optional = (field.optional && !isTypeBoolean) ? "?" : "";
  const comment = field.comment ? formatComment(field.comment) : "";
  const type = formatType(field.type, field.subfields || []);
  return `${comment}  ${escapeIfDashes(field.name)}${optional}: ${type};`;
}

function escapeIfDashes(key: string): string {
  return (key.indexOf('-') !== -1)
    ? `'${key}'`
    : key;
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
    ...getOptionSetFields(form),
    ...getMixins(form)
  ];
}

function getInputFields(node: Node): Array<GeneratedField> {
  const inputs = evaluate("./input", node);
  return mapXpathResult(inputs, createFieldFromInput);
}

// FieldSet is a flat structure with no nesting.
function getFieldSetItems(node: Node): Array<GeneratedField> {
  const fieldSets = evaluate("./field-set/items", node);

  return flatmapXpathResult(
    fieldSets,
    (node: Node): Array<GeneratedField> =>
      [
       ...mapXpathResult(evaluate("./input", node), createFieldFromInput),
       ...getItemSetFields(node),
       ...getOptionSetFields(node),
       ...getMixins(node)
      ]
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
            ...getItemSetFields(items),
            ...getOptionSetFields(items),
            ...getMixins(items)
          ]
        : [];

      return { name, type, optional, comment, subfields };
    }
  );
}

// Options in optionsSets can contain optionSets so this function is called recursively.
function getOptionSetFields(node: Node): Array<GeneratedField> {
  const optionSets = evaluate("./option-set", node);

  return mapXpathResult(
    optionSets,
    (node: Node): GeneratedField => {
      const minimumOccurrences = xpath.select1(
        "string(./occurrences/@minimum)",
        node
      );

      const name = xpath.select1("string(@name)", node);
      const type = GeneratedFieldType.Object;
      const optional = minimumOccurrences ? minimumOccurrences === "0" : true;
      const comment = xpath.select1("string(./label)", node);

      const options = evaluate("./options", node).iterateNext();
      const subfields = options
        ? [
            ...getOptionsSelectedField(options),
            ...getOptionFields(options)
          ]
        : [];

      return { name, type, optional, comment, subfields };
    }
  );
}

// Options can contain optionSets
function getOptionFields(node: Node): Array<GeneratedField> {
  const option = evaluate("./option", node);

  return mapXpathResult(
    option,
    (node: Node): GeneratedField => {
      const minimumOccurrences = xpath.select1(
        "string(./occurrences/@minimum)",
        node
      );

      const name = xpath.select1("string(@name)", node);
      const type = GeneratedFieldType.Object;
      const optional = minimumOccurrences ? minimumOccurrences === "0" : true;
      const comment = xpath.select1("string(./label)", node);

      const options = evaluate("./items", node).iterateNext();
      const subfields = options
        ? [
            ...getInputFields(options),
            ...getFieldSetItems(options),
            ...getItemSetFields(options),
            ...getOptionSetFields(options),
            ...getMixins(options)
          ]
        : [];

      return { name, type, optional, comment, subfields };
    }
  );
}

function getOptionsSelectedField(node: Node): Array<GeneratedField> {
  const options = evaluate(".", node);

  return mapXpathResult(
    options,
    (node: Node): GeneratedField => {
      const minimumOccurrences = xpath.select1(
        "string(./@minimum)",
        node
      );
      const maxOccurrences = xpath.select1(
        "string(./@maximum)",
        node
      );
      const name = "_selected";
      const type = [minimumOccurrences <= 1 ? GeneratedFieldType.String : null,
                   maxOccurrences > 1 ? GeneratedFieldType.StringArray: null].filter(x => x).join(" | ") ;
      const optional = minimumOccurrences ? minimumOccurrences === "0" : true;
      const comment = "Selected";

      return { name, type, optional, comment};
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
  }, input);

  return { name, type, comment, optional };
}

function getType(
  inputType: string,
  options: { maxOccurrences?: number },
  node: Node
): string  {
  switch (inputType.toLowerCase()) {
    case "contentselector":
    case "mediaselector":
      return (options.maxOccurrences === 1)
        ? GeneratedFieldType.String
        : GeneratedFieldType.StringArray;
    case "contenttypefilter":
      return (options.maxOccurrences === 1)
        ? GeneratedFieldType.String
        : GeneratedFieldType.StringOrStringArray;
    case "checkbox":
      return GeneratedFieldType.Boolean;
    case "combobox":
      const union = createStringUnion(getAllowedOptions(node));

      return ((options.maxOccurrences ?? 1) > 1)
        ? `${union} | Array<${union}>`
        : union;
    case "radiobutton":
      return createStringUnion(getAllowedOptions(node));
    case "long":
    case "double":
      return GeneratedFieldType.Number;
    default:
      return GeneratedFieldType.String;
  }
}

function getAllowedOptions(node: Node): Array<string> {
  return mapXpathResult<string>(
    evaluate("./config/option", node),
    (node) => xpath.select1("@value",node).value
  );
}

function createStringUnion(strings: Array<string>): string {
  return strings
    .map(value => `"${value}"`)
    .join(" | ");
}
