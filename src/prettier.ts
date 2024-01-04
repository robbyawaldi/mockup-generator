import { Config } from "prettier";

const config: Config = {
  parser: "typescript",
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 80,
  trailingComma: "all",
  arrowParens: "always",
};

export default config;
