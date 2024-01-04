import fs from "fs";
import path from "path";

export function mapFileNames(directoryPath: string) {
  let fileNames: string[] = [];

  function traverseDirectory(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else {
        fileNames.push(filePath.replace(directoryPath.replace(/\.\//, ""), ""));
      }
    });
  }

  traverseDirectory(directoryPath);

  return fileNames;
}

export function generateHandlers(
  fileNames: string[],
  basePath: string,
  baseDir: string
) {
  const https: Record<string, { path: string; dir: string }[]> = {
    get: [],
    post: [],
    put: [],
    patch: [],
    delete: [],
  };

  fileNames.forEach((fileName) => {
    const paths = fileName.split("/").filter((f) => f !== "");
    const httpMethod = paths[0];
    https[httpMethod]?.push({
      path: path.join(basePath, paths.slice(1).join("/")),
      dir: `.${path.sep}${baseDir.split("/").pop()}${fileName}`,
    });
  });

  let result = `
  import { delay, http, HttpResponse } from "msw";
  `;

  for (const httpMethod in https) {
    result += `
        const http${
          httpMethod[0].toUpperCase() + httpMethod.slice(1)
        } = {${https[httpMethod]
          .map(
            (_path) =>
              `"${generatePath(_path.path)}": await import("${_path.dir}")`
          )
          .join(",")}};`;
  }
  result += `const https = [${Object.keys(https).map((httpMethod) => {
    return `{method: "${httpMethod}",http: http${
      httpMethod[0].toUpperCase() + httpMethod.slice(1)
    }}`;
  })}];`;

  result += `
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

  return result;
}

function generatePath(path: string): string {
  return path.replace(".json", "").replace("/index", "").replace(/\*.+/, "*");
}
