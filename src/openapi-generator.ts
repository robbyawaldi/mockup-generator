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
  private requestFile: any;
  private additionalFile: any;
  private paramsFile: any;
  readonly header = {
    openapi: "3.0.0",
    info: {
      title: "API Specification",
      description: "API Specification",
      version: "1.0.0",
    },
    paths: {},
    components: {},
  };
  constructor(directoryPath: string) {
    this.directoryPath = directoryPath;

    this.files = this.mapFileNames(directoryPath).map((map) => ({
      name: this.createSchemaName(map),
      dir: map,
      path: map.replace(directoryPath.replace(/\.\//, ""), ""),
    }));

    const requestFilePath = path.join(
      this.directoryPath,
      "/request.config.json"
    );
    const additionalFilePath = path.join(
      this.directoryPath,
      "/additional.config.json"
    );
    const paramsFilePath = path.join(this.directoryPath, "/params.config.json");
    try {
      this.requestFile = JSON.parse(fs.readFileSync(requestFilePath, "utf-8"));
    } catch {}
    try {
      this.additionalFile = JSON.parse(
        fs.readFileSync(additionalFilePath, "utf-8")
      );
    } catch {}
    try {
      this.paramsFile = JSON.parse(fs.readFileSync(paramsFilePath, "utf-8"));
    } catch {}
  }
  async generateOpenApi() {
    let result = this.header;
    result.paths = this.mappingPaths();
    result.components = this.mappingSchemas();

    return await prettier.format(YAML.stringify(result), {
      semi: false,
      singleQuote: false,
      printWidth: 80,
      tabWidth: 2,
      trailingComma: "none",
      arrowParens: "avoid",
      endOfLine: "auto",
      parser: "yaml",
    });
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
  private mappingPaths() {
    return this.files.reduce((_paths, file) => {
      let requestBody: any = null;
      if (this.requestFile?.[file.path]) {
        const requestDataPath = path.join(
          this.directoryPath,
          this.requestFile[file.path]
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
      }

      let params: any = null;
      const paramArr: any[] | undefined = this.paramsFile?.[file.path];
      if (paramArr) {
        params = paramArr.map((p) => ({
          name: p.name,
          in: "query",
          description: "",
          required: false,
          schema: {
            type: p.type,
          },
        }));
      }

      const paths = file.path
        .split("/")
        .map((f) => f.replace(".json", ""))
        .filter((f) => f !== "");
      const method = paths.shift();
      if (paths[paths.length - 1] === "index") {
        paths.pop();
      }
      if (paths[paths.length - 1]?.includes("#")) {
        paths[paths.length - 1] = paths[paths.length - 1].replace("#", "");
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
      if (paramArr) {
        result[formattedPath][method ?? "post"]["parameters"] = params;
      }
      return { ..._paths, ...result };
    }, {});
  }
  private mappingSchemas() {
    return {
      schemas: this.files.reduce((schemas, file) => {
        const data = fs.readFileSync(file.dir, "utf-8");
        (schemas as any)[file.name] = this.jsonToOpenApiSchema(
          JSON.parse(data),
          this.additionalFile?.[file.path]
        );
        return schemas;
      }, {}),
    };
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
  private jsonToOpenApiSchema(jsonData: any, dynamicProperties: string[] = []) {
    function parseObject(obj: any, prevProperty: string) {
      const properties: any = {};
      let additionalProperties: any = null;
      for (const [key, value] of Object.entries(obj)) {
        const chainProperties = `${
          prevProperty ? `${prevProperty}.` : ""
        }${key}`;
        if (dynamicProperties.includes(chainProperties)) {
          additionalProperties = parseValue(value, chainProperties);
          break;
        }
        properties[key] = parseValue(value, chainProperties);
      }
      if (Object.entries(obj).length < 1) {
        properties["name"] = {
          type: "string",
        };
      }
      const result: any = { type: "object" };
      if (additionalProperties) {
        result["additionalProperties"] = additionalProperties;
      } else {
        result["properties"] = properties;
      }
      return result;
    }

    function parseArray(arr: any[], prevProperty: string) {
      const items: any = arr.length
        ? parseValue(arr[0], prevProperty)
        : { type: "string" };
      return { type: "array", items: items };
    }

    function parseValue(value: any, prevProperty: string) {
      if (Array.isArray(value)) {
        return parseArray(value, prevProperty);
      } else if (typeof value === "object" && value !== null) {
        return parseObject(value, prevProperty);
      } else {
        return { type: typeof value };
      }
    }

    const result = parseValue(jsonData, "");
    return result;
  }
}
