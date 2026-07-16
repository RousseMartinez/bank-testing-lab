module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],
  coverageReporters: ["text", "text-summary", "html", "lcov"],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
  testPathIgnorePatterns: ['/node_modules/', '/.stryker-tmp/']
};
