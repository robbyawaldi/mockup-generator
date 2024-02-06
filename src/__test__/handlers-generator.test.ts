// Copyright 1999-2024. Plesk International GmbH. All rights reserved.

import { test, expect } from "vitest";
import { HttpHandlersGenerator } from "../handlers-generator";
import prettier from "prettier";
import config from "../prettier";
import { HttpHandlersGeneratorWindows } from "src/handlers-generator-windows";

test("generator should create handlers based on specified file paths", async () => {
  const generator = new HttpHandlersGeneratorWindows(
    "src/examples/jsons",
    "api",
    "src/example/jsons",
    "0"
  );
  const result = generator.generateHandlers();
  const expected = await prettier.format(
    `
    import bookList from "./jsons/get/book-list.json";
    import summaryOverview from "./jsons/post/summary/overview.json";
    import usersDetail from "./jsons/post/users/*detail.json";
    import users from "./jsons/post/users/index.json"
    
    
      import { delay, http, HttpResponse } from "msw";
      
            const httpGet = {"api/book-list": bookList};
            const httpPost = {"api/summary/overview": summaryOverview,"api/users/*": usersDetail,"api/users": users};
            const httpPut = {};
            const httpPatch = {};
            const httpDelete = {};const https = [{method: "get",http: httpGet},{method: "post",http: httpPost},{method: "put",http: httpPut},{method: "patch",http: httpPatch},{method: "delete",http: httpDelete}];
      export const handlers = import.meta.env.DEV
      ? [
        ...https.flatMap((h) =>
          Object.keys(h.http).map((route) => {
            return (http as any)[h.method](route, async () => {
              await delay(0);
              return HttpResponse.json(h.http[route as keyof typeof h.http]);
            });
          })
        ),
      ]
      : [];
  `,
    config
  );
  // expect(await prettier.format(result, config)).toBe(expected);
});
