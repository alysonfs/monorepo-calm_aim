/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@calm-aim/eslint-config"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
