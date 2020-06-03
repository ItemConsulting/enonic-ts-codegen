import * as xmltools from "./xmltools";

const xml = {
  employee: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input type="TextLine" name="firstName">
      <label>First name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <input type="TextLine" name="lastName">
      <label>Last name</label>
      <occurrences minimum="0" maximum="1"/>
    </input>
    <item-set name="contactInfo">
      <label>Contact Info</label>
      <occurrences minimum="0" maximum="0"/>
      <items>
        <input name="label" type="TextLine">
          <label>Label</label>
          <occurrences minimum="0" maximum="1"/>
        </input>
        <input name="phoneNumber" type="TextLine">
          <label>Phone Number</label>
          <occurrences minimum="0" maximum="1"/>
        </input>
      </items>
    </item-set>
  </form>
  </content-type>
  `,

  simple: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input type="TextLine" name="firstName">
      <label>First name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <input type="TextLine" name="lastName">
      <label>Last name</label>
      <occurrences minimum="0" maximum="1"/>
    </input>
    <input type="Long" name="age">
      <label>Age</label>
      <occurrences minimum="0" maximum="1"/>
    </input>
  </form>
  </content-type>\n`,

  simpleMissingName: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input type="TextLine">
      <label>First name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
  </form>
  </content-type>\n`,

  simpleCaseIncentiveType: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input name="gdprSigned" type="cHeckbOx">
      <label>GDPR Signed</label>
    </input>
  </form>
  </content-type>\n`,

  simpleMissingComment: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input type="TextLine" name="firstName">
      <occurrences minimum="1" maximum="1"/>
    </input>
  </form>
  </content-type>\n`,

  simpleMissingOccurrences: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input type="TextLine" name="firstName">
    </input>
    <input type="TextLine" name="lastName">
      <occurrences maximum="1"/>
    </input>
  </form>
  </form>
  </content-type>\n`,

  itemSet: `<content-type>
<display-name>Employee</display-name>
<super-type>base:structured</super-type>
<form>
  <item-set name="contactInfo">
    <label>Contact Info</label>
    <occurrences minimum="0" maximum="0"/>
    <items>
      <input name="label" type="TextLine">
        <label>Label</label>
        <occurrences minimum="0" maximum="1"/>
      </input>
      <input name="phoneNumber" type="TextLine">
        <label>Phone Number</label>
        <occurrences minimum="0" maximum="1"/>
      </input>
      <item-set name="contactInfo">
        <label>Contact Info</label>
        <occurrences minimum="0" maximum="0"/>
        <items>
          <input name="phoneNumber" type="TextLine">
            <label>Phone Number</label>
            <occurrences minimum="0" maximum="1"/>
          </input>
        </items>
      </item-set>
    </items>
  </item-set>
</form>
</content-type>\n`,

  fieldSet: `<content-type>
<display-name>Employee</display-name>
<super-type>base:structured</super-type>
<form>
  <field-set name="Juryvotes">
    <label>Juryavgjørelser</label>
    <items>
        <input type="TextArea" name="juryvote1">
            <label>Runde 1</label>
            <occurrences minimum="0" maximum="1"/>
        </input>
        <input type="TextArea" name="juryvote2">
            <label>Runde 2</label>
            <occurrences minimum="0" maximum="1"/>
        </input>
    </items>
  </field-set>
</form>
</content-type>\n`,

  minimalSite: `<site>
  <form/>
</site>`,

  simpleSite: `<site>
  <processors> 
    <response-processor name="tracker" order="10"/>  
  </processors>
  <mappings> 
     <mapping controller="/site/foobar/api.js" order="10">
       <pattern>/api/v\d+/.*</pattern>
     </mapping>
     <mapping controller="/site/pages/default/default.js">
       <match>type:'portal:fragment'</match>
     </mapping>
   </mappings>
   <form> 
    <input type="TextLine" name="company">
      <label>Company</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
  </form>
  <x-data name="seo-settings"/> 
</site>`,

  simplePage: `<page>
  <display-name i18n="component.page.name">My first page</display-name>
  <description>Front page of our site</description>
  <form>
    <input type="TextLine" name="pageName">
      <label>Page Name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
  </form>
  <regions>
    <region name="main"/>
  </regions>
</page>`,

  simplePart: `<part>
  <display-name i18n="employeeForm.displayName">Employee Form</display-name>
  <description i18n="employeeForm.description">Edit the information of an employee</description>
  <form>
    <input type="TextLine" name="partPart">
      <label>Part of a part</label>
      <occurrences minimum="0" maximum="10"/>
    </input>
  </form>
</part>`,

  missingForm: `<part>
  <display-name i18n="groupForm.displayName">Group form</display-name>
  <description i18n="groupForm.description">Edit description about tahe group</description>
</part>`,

  mixinUser: `<content-type>
  <display-name>Using mixins</display-name>
  <form>
    <input type="TextLine" name="firstName">
      <label>First Name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <input type="TextLine" name="lastName">
      <label>Last Name</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <mixin name="address"/>
  </form>
</content-type>`,

  mixin: `<mixin>
  <display-name>Full address</display-name>
  <form>
    <input type="TextLine" name="addressLine">
      <label>Street address</label>
      <occurrences minimum="0" maximum="2"/>
    </input>
    <input type="TextLine" name="city">
      <label>City</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <input type="TextLine" name="zipCode">
      <label>Zip code</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
    <input type="TextLine" name="country">
      <label>Country</label>
      <occurrences minimum="1" maximum="1"/>
    </input>
  </form>
</mixin>`,

mixinMultiLevel: `<content-type>
  <display-name>Using mixins</display-name>
  <form> 
    <field-set> 
      <label i18n="metadata.label">Metadata</label>
      <items> 
        <mixin name="address"/> 
      </items>
    </field-set>
    <item-set name="contact_info"> 
      <label i18n="contact_info.label">Contact Info</label> 
      <occurrences minimum="0" maximum="0"/> 
      <items>
        <input name="label" type="TextLine">
          <label>Label</label>
          <occurrences minimum="0" maximum="1"/>
        </input>
        <mixin name="address"/>
      </items>
    </item-set>
    <option-set name="checkOptionSet">
      <label i18n="checkOptionSet.label">Multi-selection OptionSet</label>
      <expanded>true</expanded> 
      <occurrences minimum="1" maximum="1"/> 
      <options minimum="1" maximum="2">    
        <option name="option_1">  
          <label i18n="checkOptionSet.option_1.label">Option 1</label>  
          <help-text i18n="checkOptionSet.option_1.help-text">Help text for Option 1</help-text>  
        </option>
        <option name="option_2">
          <label i18n="checkOptionSet.option_2.label">Option 2</label>
          <default>true</default> 
          <items> 
            <input name="label" type="TextLine">
              <label>Label</label>
              <occurrences minimum="0" maximum="1"/>
            </input>
            <mixin name="address"/>
          </items>
        </option>
        <option name="option_3">
          <label>Option 3</label>
          <help-text>Help text for Option 3</help-text>
          <items>
            <mixin name="address"/>
          </items>
        </option>
      </options>
    </option-set>
  </form>
</content-type>`,

  noForm: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
</content-type>\n`,

  emptyForm: `<content-type>
  <display-name>Employee</display-name>
  <super-type>base:structured</super-type>
  <form></form>
</content-type>\n`,

  contentSelectorSingle: `<content-type>
  <display-name>Group</display-name>
  <super-type>base:structured</super-type>
  <form>
  <input name="fabTarget" type="ContentSelector">
    <label>FAB button target</label>
    <occurrences minimum="0" maximum="1"/>
  </input>
  </form>
</content-type>\n`,

  contentSelectorMultiple: `<content-type>
  <display-name>Group</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input name="members" type="ContentSelector">
      <label>Members</label>
      <occurrences minimum="0" maximum="2"/>
      <config>
        <allowContentType>employee</allowContentType>
      </config>
    </input>
  </form>
</content-type>\n`,

  checkbox: `<content-type>
  <display-name>Using mixins</display-name>
  <form>
    <input name="gdprSigned" type="CheckBox">
      <label>GDPR Signed</label>
    </input>
  </form>
</content-type>\n`,


  combobox: `<content-type>
  <display-name>Using mixins</display-name>
  <form>
    <input name="invite" type="ComboBox">
    <label>Invited</label>
    <occurrences minimum="0" maximum="1"/>
      <config>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
        <option value="Maybe">Maybe</option>
      </config>
    </input>
  </form>
</content-type>\n`,

  optionSet: `<content-type>
  <display-name>Using mixins</display-name>
  <form>
    <option-set name="checkOptionSet">
      <label i18n="checkOptionSet.label">Multi-selection OptionSet</label>
      <expanded>true</expanded> 
      <occurrences minimum="1" maximum="1"/> 
      <help-text>You can select up to 2 options</help-text>
      <options minimum="1" maximum="2">    
        <option name="option_1">  
          <label i18n="checkOptionSet.option_1.label">Option 1</label>  
          <help-text i18n="checkOptionSet.option_1.help-text">Help text for Option 1</help-text>  
        </option>
        <option name="option_2">
          <label i18n="checkOptionSet.option_2.label">Option 2</label>
          <default>true</default> 
          <items> 
            <input name="contentSelector" type="ContentSelector">
              <label>Content selector</label>
              <occurrences minimum="0" maximum="0"/>
              <config/>
            </input>
          </items>
        </option>
        <option name="option_3">
          <label>Option 3</label>
          <help-text>Help text for Option 3</help-text>
          <items>
            <input name="textarea" type="TextArea">
              <label>Text Area</label>
              <occurrences minimum="0" maximum="1"/>
            </input>
            <input name="long" type="Long">
              <label>Long</label>
              <indexed>true</indexed>
              <occurrences minimum="0" maximum="1"/>
            </input>
            <input name="double" type="Double">
              <label>Long</label>
              <indexed>true</indexed>
              <occurrences minimum="0" maximum="1"/>
            </input>
          </items>
        </option>
      </options>
    </option-set>
  </form>
  </content-type>\n`,

  radioButton: `
    <content-type>
      <display-name>Using mixins</display-name>
      <form>
        <input name="myradiobutton" type="RadioButton">
          <label>My RadioButton</label>
          <occurrences minimum="0" maximum="1"/> 
          <config>
            <option value="one">Option One</option> 
            <option value="two">Option Two</option>
          </config>
          <default>one</default> 
        </input>
      </form>
  </content-type>\n`,

  xData: `
  <x-data>
    <display-name>Menu settings</display-name>
    <form>
      <input type="Checkbox" name="menuItem">
        <label>Show in menu?</label>
        <help-text>Check this to include this content in the menu.</help-text>
        <occurrences minimum="0" maximum="1"/>
      </input>
      <input type="TextLine" name="menuName">
        <label>Override menu name</label>
        <help-text>Name to be used in menu, default is to use the content's DisplayName.</help-text>
        <occurrences minimum="0" maximum="1"/>
      </input>
    </form>
  </x-data>
  `
};

describe("parseXML", () => {
  test("sets the name field", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.simple);
    expect(tsInterface.name).toBe("Employee");
  });

  test("parses all inputs", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.simple);
    expect(tsInterface.fields.length).toBe(3);
  });

  test("parses field names", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.simple);
    expect(tsInterface.fields[0].name).toBe("firstName");
    expect(tsInterface.fields[1].name).toBe("lastName");
    expect(tsInterface.fields[2].name).toBe("age");
  });

  test("parses no form as 0 fields", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.missingForm);
    expect(tsInterface.fields).toHaveLength(0);
  });

  test("parses optional inputs", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.simple);
    expect(tsInterface.fields[0].optional).toBe(false);
    expect(tsInterface.fields[1].optional).toBe(true);
  });

  test("parses inputs with missing name", () => {
    expect(() => {
      xmltools.parseXml("Employee", xml.simpleMissingName);
    }).toThrow();
  });

  test("parses inputs with missing comment", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.simpleMissingComment);
    expect(tsInterface.fields[0].comment).toBe("");
  });

  test("parses optional inputs with missing occurrences", () => {
    // Occurences defaults to minimum=0, maximum=1
    // See: https://developer.enonic.com/docs/xp/stable/cms/schemas#input_types
    const tsInterface = xmltools.parseXml(
      "Employee",
      xml.simpleMissingOccurrences
    );
    expect(tsInterface.fields[0].optional).toBe(true);
    expect(tsInterface.fields[1].optional).toBe(true);
  });

  test("parses FieldSets as a flat structure", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.fieldSet);
    expect(tsInterface.fields.length).toBe(2);
  });

  test("parses ItemSets as a nested structure", () => {
    const tsInterface = xmltools.parseXml("Employee", xml.itemSet);
    expect(tsInterface.fields.length).toBe(1);
    expect(tsInterface.fields[0].subfields.length).toBe(3);
    expect(tsInterface.fields[0].subfields[2].subfields.length).toBe(1);
  });

  test("parses ContentSelector as string", () => {
    const tsInterface = xmltools.parseXml(
      "ContentSelectorExample",
      xml.contentSelectorSingle
    );
    const field = tsInterface.fields[0];
    expect(field.type).toBe("string");
  });

  test("parses ContentSelector as Array<string>", () => {
    const tsInterface = xmltools.parseXml(
      "ContentSelectorExample",
      xml.contentSelectorMultiple
    );
    const field = tsInterface.fields[0];
    expect(field.type).toBe("Array<string>");
  });

  test("parses CheckBox as boolean", () => {
    const tsInterface = xmltools.parseXml("CheckBoxExample", xml.checkbox);
    const field = tsInterface.fields[0];
    expect(field.type).toBe("boolean");
  });

  test("parses Input types regardless of case", () => {
    const tsInterface = xmltools.parseXml("CaseIncentiveTypeExample", xml.simpleCaseIncentiveType);
    const field = tsInterface.fields[0];
    expect(field.type).toBe("boolean");
  });

  test("parses the minimal site", () => {
    const tsInterface = xmltools.parseXml("MySite", xml.minimalSite);
    expect(tsInterface.name).toBe("MySite");
    expect(tsInterface.fields).toHaveLength(0);
  });

  test("parses a simple site", () => {
    const tsInterface = xmltools.parseXml("MySite", xml.simpleSite);
    expect(tsInterface.name).toBe("MySite");
    expect(tsInterface.fields).toHaveLength(1);

    const field = tsInterface.fields[0];
    expect(field.name).toBe("company");
    expect(field.comment).toBe("Company");
    expect(field.optional).toBe(false);
  });

  test("parses a simple page", () => {
    const tsInterface = xmltools.parseXml("MyPage", xml.simplePage);
    expect(tsInterface.name).toBe("MyPage");
    expect(tsInterface.fields).toHaveLength(1);

    const field = tsInterface.fields[0];
    expect(field.name).toBe("pageName");
    expect(field.optional).toBe(false);
    expect(field.comment).toBe("Page Name");
  });

  test("parses a simple part", () => {
    const tsInterface = xmltools.parseXml(
      "SevenElevenWasAPartTimeJob",
      xml.simplePart
    );
    expect(tsInterface.name).toBe("SevenElevenWasAPartTimeJob");
    expect(tsInterface.fields).toHaveLength(1);

    const field = tsInterface.fields[0];
    expect(field.name).toBe("partPart");
    expect(field.optional).toBe(true);
    expect(field.comment).toBe("Part of a part");
  });

  test("parses mixins", () => {
    const tsInterface = xmltools.parseXml("MixinExample", xml.mixinUser);
    const mixins = tsInterface.fields.filter(field => field.type === "mixin");
    expect(mixins).toHaveLength(1);
    expect(mixins[0].name).toBe("address");
    expect(mixins[0].type).toBe("mixin");
  });

  test("parses x-data", () => {
    const tsInterface = xmltools.parseXml("XDataExample", xml.xData);
    expect(tsInterface.fields).toHaveLength(2);
    const field = tsInterface.fields[0];
    expect(field.name).toBe("menuItem");
    expect(field.optional).toBe(true);
    expect(field.comment).toBe("Show in menu?");
  });
});

describe("InterfaceGenerator", () => {
  test("NewInterfaceGenerator creates a new InterfaceGenerator", () => {
    const generator = xmltools.NewInterfaceGenerator();
    expect(generator).toBeDefined();
    expect(generator).not.toBeNull();
  });

  test("throws when no mixin exists", () => {
    const generator = xmltools.NewInterfaceGenerator();
    expect(() => {
      generator.createInterface("MixedIn", xml.mixinUser);
    }).toThrow();
  });

  test("generates the correct input code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface("Simple", xml.simple);
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct FieldSet code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface("FieldSetUser", xml.fieldSet);
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct ItemSet code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface("ItemSetUser", xml.itemSet);
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct ContentSelector code", () => {
    const generator = xmltools.NewInterfaceGenerator();

    const tsInterfaceSingle = generator.createInterface(
      "ContentSelectorExample",
      xml.contentSelectorSingle
    );
    expect(tsInterfaceSingle).toMatchSnapshot();

    const tsInterfaceMultiple = generator.createInterface(
      "ContentSelectorExample",
      xml.contentSelectorMultiple
    );
    expect(tsInterfaceMultiple).toMatchSnapshot();
  });

  test("generates the correct OptionSet code",() => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface(
      "optionSet",
      xml.optionSet
    );
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct CheckBox code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface(
      "CheckBoxExample",
      xml.checkbox
    );
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct ComboBox code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface(
      "ComboBoxExample",
      xml.combobox
    );
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct RadioButton code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface(
      "RadioButtonExample",
      xml.radioButton
    );
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct mixin code", () => {
    const generator = xmltools.NewInterfaceGenerator();
    generator.addMixin("address", xml.mixin);
    const tsInterface = generator.createInterface("MixedIn", xml.mixinUser);
    expect(tsInterface).toMatchSnapshot();
  });

  test("generates the correct mixin code for multilevel", () => {
    const generator = xmltools.NewInterfaceGenerator();
    generator.addMixin("address", xml.mixin);
    const tsInterface = generator.createInterface("MixedIn", xml.mixinMultiLevel);
    expect(tsInterface).toMatchSnapshot();
  });

  test("returns empty string when no form can be found", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface("ShouldBeNull", xml.noForm);
    expect(tsInterface).toBe("");
  });

  test("returns empty string when form is empty", () => {
    const generator = xmltools.NewInterfaceGenerator();
    const tsInterface = generator.createInterface(
      "ShouldBeNull",
      xml.emptyForm
    );
    expect(tsInterface).toBe("");
  });
});

describe("generateInterfaceName", () => {
  test("sets the interface name in PascalCase", () => {
    const filenames = [
      "my_little_interface",
      "myLittleInterface",
      "my-little-interface"
    ];
    for (const filename of filenames) {
      const iname = xmltools.generateInterfaceName(filename);
      expect(iname).toBe("MyLittleInterface");
    }
  });

  test("drops the file extension", () => {
    const filename = "my-little-interface.xml";
    const iname = xmltools.generateInterfaceName(filename);
    expect(iname).toBe("MyLittleInterface");
  });

  test("drops the file path", () => {
    const filename = "/path/to/my-little-interface.xml";
    const iname = xmltools.generateInterfaceName(filename);
    expect(iname).toBe("MyLittleInterface");
  });
});
