# Enonic TypeScript Code Generation

[![npm version](https://badge.fury.io/js/enonic-ts-codegen.svg)](https://badge.fury.io/js/enonic-ts-codegen)

Code generation tool that creates **TypeScript interfaces** based on xmls in Enonic XP. It can create interfaces for:

 * Content types
 * Pages
 * Parts
 * Site
 * Layout
 * Macros
 * Id-provider
 * Mixins
 
It is recommended to let Gradle run this tool on every build, so that we always have a tight cupling between the xmls and TypeScript-code.

## Example

Given that we have a content-type described in **content-types/article/article.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<content-type>
  <display-name>Article</display-name>
  <super-type>base:structured</super-type>
  <form>
    <input name="title" type="TextLine">
      <label>Title of the article</label>
      <occurrences minimum="1" maximum="1"/>
    </input>

    <input name="body" type="HtmlArea">
      <label>Main text body</label>
      <occurrences minimum="0" maximum="1"/>
    </input>
  </form>
</content-type>
```

Running *enonic-ts-codegen* will generate the a TypeScript-interface in the file **content-types/article/article.ts**:

```typescript
export interface Article {
  /** Title of the article */
  title: string;
 
  /** Main text body */
  body?: string;
}
```

This interface will describe the data shape for this content type. Note that body can be undefined since `occurrences/@minimum` is `0` for `body`, so the key becomes `body?`, since the value can be `undefined`.

## CLI

`xml-to-ts.js` is a command line utility that can generate TypeScript interfaces.

- Build it: `npm run build` or `npm run build:cli`
- Run it from the command line: `node bin/xml-to-ts.js my-xml-file.xml`

### Gradle

`xml-to-ts.js` can be run automatically as part of the`enonic project deploy`
process. First, add the dependency with `npm install enonic-ts-codegen --save`, and then
add a task to `build.gradle`, for example:

```groovy
task generateTypeScriptInterfaces( type: NodeTask, dependsOn: npmInstall ) {
    description = 'Generate TypeScript interfaces'
    environment = [ 'NODE_ENV': nodeEnvironment() ]
    args = [ '--project', '.', '--write-to-file' ]
    script = file( 'node_modules/enonic-ts-codegen/bin/index.js' )
}
```

To run the task as part of the deploy process, add it to the `jar` block:

```
jar {
  // ... other dependencies

  dependsOn += generateTypeScriptInterfaces

  // ...
}
```
