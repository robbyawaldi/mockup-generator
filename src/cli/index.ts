import { program } from "commander";
import { generateHandlers, mapFileNames } from "../handlers-generator";
import fs from "fs";
import prettier from "prettier";
import config from "../prettier";

program
  .command("gen:handlers")
  .description("Generate the Handlers File")
  .requiredOption("-d, --dir <string>", "Mockup JSON directories")
  .option("-b, --base <string>", "Base Path API", "api")
  .option("-o, --output <string>", "File Name", "handlers.ts")
  .action(async (options) => {
    const dir = options.dir;
    const base = options.base;
    const output = options.output;
    const fileNames = mapFileNames(dir);
    const handlers = generateHandlers(fileNames, base, dir);
    const formatted = await prettier.format(handlers, config);
    try {
      fs.writeFileSync(output, formatted, "utf-8");
    } catch (err) {
      console.error(err);
    }
  });

program.parse(process.argv);
