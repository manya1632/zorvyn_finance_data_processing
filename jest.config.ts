import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/*.unit.test.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/*.integration.test.ts'],
      globalSetup: './tests/globalSetup.ts',
      globalTeardown: './tests/globalTeardown.ts',
    },
    {
      displayName: 'property',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/*.property.test.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/modules/**/*.controller.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
    'src/modules/**/*.service.ts': {
      lines: 80,
      functions: 80,
      branches: 70,
    },
  },
  coverageReporters: ['text', 'lcov'],
};

export default config;
