const path = require("path");
const transformRuntimePlugin = [
  "@babel/plugin-transform-runtime",
  {
    regenerator: true,
  },
];
const moduleResolverPlugin = [
  "module-resolver",
  {
    alias: {
      "@src": "./src",
    },
  },
];

module.exports = {
  presets: ["@babel/typescript", "@babel/env"],
  plugins: [transformRuntimePlugin, moduleResolverPlugin],
  env: {},
};
