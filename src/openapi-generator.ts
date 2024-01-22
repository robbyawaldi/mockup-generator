import fs from "fs";
import path from "path";
import YAML from "json-to-pretty-yaml";
import prettier from "prettier";

interface Files {
  name: string;
  dir: string;
  path: string;
}

export class OpenApiGenerator {
  private files: Files[];
  private directoryPath: string;
  readonly header = `openapi: 3.0.0

info:
  title: API Specification
  description: API Specification
  version: 1.0.0

paths:`;
  constructor(directoryPath: string) {
    this.files = this.mapFileNames(directoryPath).map((map) => ({
      name: this.createSchemaName(map),
      dir: map,
      path: map.replace(directoryPath.replace(/\.\//, ""), ""),
    }));
    this.directoryPath = directoryPath;
  }
  async generateOpenApi() {
    let result = this.header;
    result += "\n";
    result += this.mappingPaths();
    result += "\n";
    result += await this.mappingSchemas();
    return result;
  }
  private mapFileNames(directoryPath: string): string[] {
    let fileNames: string[] = [];

    function traverseDirectory(currentPath: string, filter = true) {
      let files = fs.readdirSync(currentPath);
      if (filter)
        files = files.filter((f) =>
          ["post", "get", "delete", "patch", "put"].includes(f)
        );
      files.forEach((file) => {
        const filePath = path.join(currentPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          traverseDirectory(filePath, false);
        } else {
          fileNames.push(filePath);
        }
      });
    }

    traverseDirectory(directoryPath);

    return fileNames;
  }
  private mappingPaths(): string {
    return this.files
      .map((file) => {
        let requestBody: any = null;
        try {
          const requestFilePath = path.join(
            this.directoryPath + "/request.config.json"
          );
          const requestFile = JSON.parse(
            fs.readFileSync(requestFilePath, "utf-8")
          );
          const requestDataPath = path.join(
            this.directoryPath,
            requestFile[file.path]
          );
          const requestData = JSON.parse(
            fs.readFileSync(requestDataPath, "utf-8")
          );
          requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: this.jsonToOpenApiSchema(requestData),
              },
            },
          };
        } catch (err) {}

        const paths = file.path
          .split("/")
          .map((f) => f.replace(".json", ""))
          .filter((f) => f !== "");
        const method = paths.shift();
        if (paths[paths.length - 1] === "index") {
          paths.pop();
        }
        if (paths[paths.length - 1].includes("*")) {
          paths[paths.length - 1] = paths[paths.length - 1].replace("*", "");
        }
        const formattedPath = paths.map((p) => `/${p}`).join("");
        const result: any = {
          [formattedPath]: {
            [method ?? "post"]: {
              responses: {
                200: {
                  description: "Description",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${file.name}`,
                      },
                    },
                  },
                },
              },
            },
          },
        };
        if (requestBody) {
          result[formattedPath][method ?? "post"]["requestBody"] = requestBody;
        }
        return YAML.stringify(result);
      })
      .join("\n");
  }
  private async mappingSchemas(): Promise<string> {
    return await prettier.format(
      YAML.stringify({
        components: {
          schemas: this.files.reduce((schemas, file) => {
            const data = fs.readFileSync(file.dir, "utf-8");
            (schemas as any)[file.name] = this.jsonToOpenApiSchema(
              JSON.parse(data)
            );
            return schemas;
          }, {}),
        },
      }),
      {
        semi: false,
        singleQuote: false,
        printWidth: 80,
        tabWidth: 2,
        trailingComma: "none",
        arrowParens: "avoid",
        endOfLine: "auto",
        parser: "yaml",
      }
    );
  }
  private createSchemaName(filePath: string) {
    let fileName = filePath.replace(".json", "");
    const pathComponents = fileName.split("/");
    const lastPathComponent = pathComponents[pathComponents.length - 1];

    fileName = lastPathComponent.includes("*")
      ? lastPathComponent.replace("*", "")
      : lastPathComponent;
    if (fileName === "index") {
      const secondLastPathComponent = pathComponents[pathComponents.length - 2];
      fileName = secondLastPathComponent;
    }
    return fileName;
  }
  private jsonToOpenApiSchema(jsonData: any) {
    function parseObject(obj: any) {
      const properties: any = {};
      for (const [key, value] of Object.entries(obj)) {
        properties[key] = parseValue(value);
      }
      if (Object.entries(obj).length < 1) {
        properties["name"] = {
          type: "string",
        };
      }
      return { type: "object", properties: properties };
    }

    function parseArray(arr: any[]) {
      const items: any = arr.length ? parseValue(arr[0]) : { type: "string" };
      return { type: "array", items: items };
    }

    function parseValue(value: any) {
      if (Array.isArray(value)) {
        return parseArray(value);
      } else if (typeof value === "object" && value !== null) {
        return parseObject(value);
      } else {
        return { type: typeof value };
      }
    }

    return parseValue(jsonData);
  }
}
