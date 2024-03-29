import { program } from "commander";
import { HttpHandlersGenerator } from "../handlers-generator";
import fs from "fs";
import prettier from "prettier";
import config from "../prettier";
import { OpenApiGenerator } from "../openapi-generator";
import os from "os";
import { OpenApiGeneratorWindows } from "../openapi-generator-windows";
import { HttpHandlersGeneratorWindows } from "../handlers-generator-windows";

const headerHandlers = `
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA MOCKUP-GENERATOR              ##
 * ##                                                           ##
 * ## AUTHOR: robbyawaldi                                       ##
 * ## SOURCE: https://github.com/robbyawaldi/mockup-generator   ##
 * ---------------------------------------------------------------
 */\n\n
`;
const headerOpenApi = `
# ---------------------------------------------------------------
# THIS FILE WAS GENERATED VIA MOCKUP-GENERATOR             
#                                                            
# AUTHOR: robbyawaldi                                       
# SOURCE: https://github.com/robbyawaldi/mockup-generator   
# ---------------------------------------------------------------\n\n
`;

program
  .command("gen:handlers")
  .description("Generate the Handlers File")
  .requiredOption("-d, --dir <string>", "Mockup JSON Location")
  .option("-b, --base <string>", "Base Path API", "api")
  .option("-o, --output <string>", "File Name", "handlers.ts")
  .option("--delay <number>", "Delay Response", "0")
  .action(async (options) => {
    const dir = options.dir;
    const base = options.base;
    const output = options.output;
    const delay = options.delay;
    let generator;
    if (os.platform() === "win32") {
      generator = new HttpHandlersGeneratorWindows(dir, base, dir, delay);
    } else {
      generator = new HttpHandlersGenerator(dir, base, dir, delay);
    }
    const handlers = generator.generateHandlers();
    const formatted = await prettier.format(handlers, config);
    try {
      fs.writeFileSync(output, headerHandlers + formatted, "utf-8");
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
    let generator;
    if (os.platform() === "win32") {
      generator = new OpenApiGeneratorWindows(dir);
    } else {
      generator = new OpenApiGenerator(dir);
    }
    const openapi = await generator.generateOpenApi();
    try {
      fs.writeFileSync(output, headerOpenApi + openapi, "utf-8");
    } catch (err) {}
  });

program.parse(process.argv);
