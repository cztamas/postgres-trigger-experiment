export default {
  rootDir: '..',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test-helpers/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.{spec,test}.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  resetMocks: true,
  moduleNameMapper: {
    '^plv8ify$': '<rootDir>/node_modules/plv8ify/src'
  }
};
