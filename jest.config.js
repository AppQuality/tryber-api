// jest.config.js
const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("./tsconfig.json");

module.exports = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
    jsonwebtoken: "<rootDir>/src/__mocks__/jsonwebtoken",
    "@appquality/wp-auth": "<rootDir>/src/__mocks__/@appquality-wp-auth",
  }),
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!<rootDir>/node_modules/"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  setupFiles: ["<rootDir>/src/__mocks__/mocks.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__mocks__/globalSetup.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 3000,
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
