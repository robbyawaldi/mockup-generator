import fs from "fs";
import path from "path";
const convertPath = require("@stdlib/utils-convert-path");

type Https = Record<
  string,
  {
    path: string;
    dir: string;
  }[]
>;

export class HttpHandlersGeneratorWindows {
  private fileNames: string[];
  private basePath: string;
  private baseDir: string;
  private https: Https;
  private directoryPath: string;
  readonly importTemplate = `
  import { delay, http, HttpResponse } from "msw";
  `;
  private handlersTemplate: string;
  constructor(
    directoryPath: string,
    basePath: string,
    baseDir: string,
    delay: string
  ) {
    this.handlersTemplate = `
    export const handlers = import.meta.env.DEV
    ? [
      ...https.flatMap((h) =>
        Object.keys(h.http).map((route) => {
          return (http as any)[h.method](route, async () => {
            await delay(${delay});
            return HttpResponse.json(h.http[route as keyof typeof h.http]);
          });
        })
      ),
    ]
    : [];
    `;
    this.directoryPath = directoryPath;
    this.fileNames = this.mapFileNames(directoryPath).filter((f) =>
      /(post|get|delete|put|patch)/.test(f)
    );
    this.basePath = basePath;
    this.baseDir = baseDir;
    this.https = this.groupingHttps();
  }
  private mapFileNames(directoryPath: string): string[] {
    let fileNames: string[] = [];

    function traverseDirectory(currentPath: string) {
      const files = fs.readdirSync(currentPath);

      files.forEach((file) => {
        const filePath = path.join(currentPath, file);
        const convertFilePath = convertPath(filePath, "posix");

        if (fs.statSync(filePath).isDirectory()) {
          traverseDirectory(filePath);
        } else {
          fileNames.push(
            convertFilePath.replace(directoryPath.replace(/\.\//, ""), "")
          );
        }
      });
    }

    traverseDirectory(directoryPath);

    return fileNames;
  }
  private groupingHttps(): Https {
    const https: Record<string, { path: string; dir: string }[]> = {
      get: [],
      post: [],
      put: [],
      patch: [],
      delete: [],
    };

    for (const fileName of this.fileNames) {
      const paths = fileName.split("/").filter((f) => f !== "");
      const httpMethod = paths[0];
      https[httpMethod]?.push({
        path: convertPath(
          path.join(this.basePath, paths.slice(1).join("/")),
          "posix"
        ),
        dir: convertPath(
          `.${path.sep}${this.baseDir.split("/").pop()}${fileName}`,
          "win32"
        ),
      });
    }

    return https;
  }
  private generatePath(path: string): string {
    return path.replace(".json", "").replace("/index", "").replace(/\#.+/, "*");
  }
  private mappingHttpMethods(): string {
    let result = "";

    for (const httpMethod in this.https) {
      result += `
        const http${
          httpMethod[0].toUpperCase() + httpMethod.slice(1)
        } = {${this.https[httpMethod]
          .map((_path) => {
            const name = this.createSchemaName(
              _path.path.replace(this.basePath, "")
            );
            const key = this.generatePath(_path.path);
            return `"${key}": ${name}`;
          })
          .join(",")}};`;
    }

    result += `const https = [${Object.keys(this.https).map((httpMethod) => {
      return `{method: "${httpMethod}",http: http${
        httpMethod[0].toUpperCase() + httpMethod.slice(1)
      }}`;
    })}];`;

    return result;
  }
  private mappingImports(): string {
    let result = Object.keys(this.https)
      .flatMap((http) =>
        this.https[http].map((item) => {
          const name = this.createSchemaName(
            item.path.replace(this.basePath, "")
          );
          const dir = convertPath(item.dir, "posix");
          return `import ${name} from "${dir}"`;
        })
      )
      .join(";\n");

    return result;
  }
  private createSchemaName(filePath: string) {
    let fileName = filePath
      .replace(this.directoryPath.replace("./", ""), "")
      .replace(".json", "")
      .replace("#", "")
      .replace("/index", "");

    // Convert kebab case to camelCase
    fileName = fileName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

    const pathComponents = fileName.split("/");

    fileName = pathComponents
      .map((item, index) => {
        if (index > 1) {
          return item?.[0]?.toUpperCase() + item?.slice(1);
        }
        return item;
      })
      .join("");

    return fileName;
  }
  public generateHandlers(): string {
    let result = this.mappingImports();
    result += "\n\n";
    result += this.importTemplate;
    result += this.mappingHttpMethods();
    result += this.handlersTemplate;
    return result;
  }
}
