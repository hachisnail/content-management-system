module.exports = {
  // Use babel-jest to transpile tests
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // The test environment that will be used for testing
  testEnvironment: "node",

  // Ignore transforms for node_modules (standard practice)
  transformIgnorePatterns: [
    "/node_modules/"
  ]
};