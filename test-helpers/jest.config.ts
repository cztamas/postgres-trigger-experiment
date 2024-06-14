export default {
  rootDir: '..',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test-helpers/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.{spec,test}.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  resetMocks: true
};
