import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "src/cli/index.ts",
    output: {
      file: "dist/cli/index.cjs",
      format: "cjs",
      banner: "#!/usr/bin/env node",
    },
    plugins: [commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },
];
