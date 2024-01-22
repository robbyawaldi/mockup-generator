import fs from "fs";
import path from "path";

type Https = Record<
  string,
  {
    path: string;
    dir: string;
  }[]
>;

export class HttpHandlersGenerator {
  private fileNames: string[];
  private basePath: string;
  private baseDir: string;
  private https: Https;
  readonly importTemplate = `
  import { delay, http, HttpResponse } from "msw";
  `;
  readonly handlersTemplate = `
  export const handlers = import.meta.env.DEV
  ? [
    ...https.flatMap((h) =>
      Object.keys(h.http).map((route) => {
        return (http as any)[h.method](route, async () => {
          await delay(1000);
          return HttpResponse.json(h.http[route as keyof typeof h.http]);
        });
      })
    ),
  ]
  : [];
  `;
  constructor(directoryPath: string, basePath: string, baseDir: string) {
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
        if (fs.statSync(filePath).isDirectory()) {
          traverseDirectory(filePath);
        } else {
          fileNames.push(
            filePath.replace(directoryPath.replace(/\.\//, ""), "")
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
        path: path.join(this.basePath, paths.slice(1).join("/")),
        dir: `.${path.sep}${this.baseDir.split("/").pop()}${fileName}`,
      });
    }
    return https;
  }
  private generatePath(path: string): string {
    return path.replace(".json", "").replace("/index", "").replace(/\*.+/, "*");
  }
  private mappingHttpMethods(): string {
    let result = "";

    for (const httpMethod in this.https) {
      result += `
        const http${
          httpMethod[0].toUpperCase() + httpMethod.slice(1)
        } = {${this.https[httpMethod]
          .map(
            (_path) =>
              `"${this.generatePath(_path.path)}": await import("${_path.dir}")`
          )
          .join(",")}};`;
    }

    result += `const https = [${Object.keys(this.https).map((httpMethod) => {
      return `{method: "${httpMethod}",http: http${
        httpMethod[0].toUpperCase() + httpMethod.slice(1)
      }}`;
    })}];`;

    return result;
  }
  public generateHandlers(): string {
    let result = this.importTemplate;
    result += this.mappingHttpMethods();
    result += this.handlersTemplate;
    return result;
  }
}
