// jest.config.js
const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("./tsconfig.json");

module.exports = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
    jsonwebtoken: "<rootDir>/src/__mocks__/jsonwebtoken",
    "@appquality/wp-auth": "<rootDir>/src/__mocks__/@appquality-wp-auth",
  }),
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/src/__mocks__/globalSetup.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 15000,
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
