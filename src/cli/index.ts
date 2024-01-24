import { program } from "commander";
import { HttpHandlersGenerator } from "../handlers-generator";
import fs from "fs";
import prettier from "prettier";
import config from "../prettier";
import { OpenApiGenerator } from "../openapi-generator";

program
  .command("gen:handlers")
  .description("Generate the Handlers File")
  .requiredOption("-d, --dir <string>", "Mockup JSON Location")
  .option("-b, --base <string>", "Base Path API", "api")
  .option("-o, --output <string>", "File Name", "handlers.ts")
  .action(async (options) => {
    const dir = options.dir;
    const base = options.base;
    const output = options.output;
    const generator = new HttpHandlersGenerator(dir, base, dir);
    const handlers = generator.generateHandlers();
    const formatted = await prettier.format(handlers, config);
    try {
      fs.writeFileSync(output, formatted, "utf-8");
    } catch (err) {
      console.error(err);
    }
  });

program
  .command("gen:openapi")
  .description("Generate the OpenAPI File")
  .requiredOption("-d, --dir <string>", "Mockup JSON Location")
  .option("-o, --output <string>", "Output Location", "./docs/openapi.yml")
  .action(async (options) => {
    const dir = options.dir;
    const output = options.output;
    const generator = new OpenApiGenerator(dir);
    const openapi = await generator.generateOpenApi();
    try {
      fs.writeFileSync(output, openapi, "utf-8");
    } catch (err) {}
  });

program.parse(process.argv);
