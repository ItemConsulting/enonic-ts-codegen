import * as commander from "commander";
import * as fs from "fs";
import * as path from "path";
import * as xmltools from "./utils/xmltools";

const generator = xmltools.NewInterfaceGenerator();

function generateInterface(xmlFilename: string, tsFilename: string): string {
  const interfaceName = xmltools.generateInterfaceName(tsFilename);
  const xml = fs.readFileSync(xmlFilename, "utf-8");
  return generator.createInterface(interfaceName, xml);
}

// map<directory, suffix>
const directorySuffix: { [key: string]: string } = {
  parts: "-part-config",
  pages: "-page-config",
  site: "-config",
  idprovider: "-config"
};

// tries to avoid conflicting filenames
function getTsFilename(filename: string): string {
  const dirname = path.dirname(filename);
  const basename = path.basename(filename, path.extname(filename));

  const closestDir = path
    .dirname(filename)
    .split(path.sep)
    .reverse()
    .slice(0, 2)
    .find(p => directorySuffix[p]);
  const suffix = closestDir ? directorySuffix[closestDir] : "";

  return `${dirname}/${basename}${suffix}.ts`;
}

function replaceFileExtension(
  newExtension: string
): (filename: string) => string {
  return (filename: string): string =>
    filename.substring(0, filename.length - path.extname(filename).length) +
    newExtension;
}

// XML-files in these directories will generate TypeScript interfaces when
// using the --enonic-xml flag.
const directories = [
  "src/main/resources/site/site.xml",
  "src/main/resources/idprovider/idprovider.xml",
  "src/main/resources/site/content-types",
  "src/main/resources/site/parts",
  "src/main/resources/site/pages"
];
const mixinDir = "src/main/resources/site/mixins";

function getEnonicXmlFiles(projectRootDir: string): Array<string> {
  return directories
    .map(dir => path.join(projectRootDir, dir))
    .map(dir => path.resolve(dir))
    .filter(dir => fs.existsSync(dir))
    .reduce((result: Array<string>, dir: string) => {
      const stat = fs.statSync(dir);
      return result
        .concat(stat.isFile() ? [dir] : [])
        .concat(stat.isDirectory() ? listXmlFiles(dir) : []);
    }, []);
}

function listXmlFiles(dir: string): Array<string> {
  return listFiles(dir).filter(file => path.extname(file) === ".xml");
}

function listFiles(dir: string): Array<string> {
  return fs
    .readdirSync(dir)
    .map(file => path.join(dir, file))
    .reduce((result: Array<string>, dir) => {
      const stat = fs.statSync(dir);
      return result
        .concat(stat.isFile() ? [dir] : [])
        .concat(stat.isDirectory() ? listFiles(dir) : []);
    }, []);
}

function consoleWriter(): (output: string) => void {
  return console.log;
}

function fileWriter(filename: string): (output: string) => void {
  return (output: string): void => {
    const fd = fs.openSync(filename, "w+");
    fs.writeSync(fd, Buffer.from(output, "utf8"));
    fs.closeSync(fd);
  };
}

function exit(message: string): void {
  console.error(message);
  process.exit(1);
}

function collect<T>(next: T, prev: Array<T>): Array<T> {
  return prev.concat([next]);
}

function command(argv: Array<string>): void {
  const cmd = new commander.Command();

  cmd
    .option(
      "--project <dir>",
      "generate all xml files for the specified Enonic project"
    )
    .option("--write-to-file", "write to .ts files instead of stdout")
    .option("-v, --verbose")
    .option("--mixin <file>", "add a file as a mixin", collect, [])
    .command("<cmd> [options] [files...]");

  cmd.parse(argv);

  const absoluteMixinDirPath: string | undefined = cmd.project
    ? path.join(cmd.project, mixinDir)
    : undefined;

  const projectMixins =
    absoluteMixinDirPath && fs.existsSync(absoluteMixinDirPath)
      ? listXmlFiles(absoluteMixinDirPath)
      : [];
  const mixinFiles = cmd.mixin.concat(projectMixins);

  for (const filename of mixinFiles) {
    const xml = fs.readFileSync(filename, "utf8");
    generator.addMixin(filename, xml);
  }

  const rename = cmd.project ? getTsFilename : replaceFileExtension(".ts");
  const write = cmd.writeToFile ? fileWriter : consoleWriter;

  const files = cmd.project ? getEnonicXmlFiles(cmd.project) : cmd.args;
  if (files.length === 0) {
    exit("No files");
  }

  const notFiles = files.filter(file => !fs.existsSync(file));
  if (notFiles.length > 0) {
    const fileList = notFiles.map(file => `  - ${file}`).join("\n");
    exit(`Files do not exist: \n${fileList}`);
  }

  for (const xmlFilename of files) {
    if (cmd.verbose) {
      console.error(xmlFilename);
    }
    try {
      const tsFilename = rename(xmlFilename);
      const tsInterface = generateInterface(xmlFilename, tsFilename);
      if (tsInterface) {
        write(tsFilename)(tsInterface);
      }
    } catch (err) {
      if (err === xmltools.MissingFieldNameError) {
        exit(`${xmlFilename}: ${err}`);
      }
      throw err;
    }
  }
}

command(process.argv);
