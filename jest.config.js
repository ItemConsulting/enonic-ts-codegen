module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  },
  roots: ['<rootDir>/src', '<rootDir>/bin/utils'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
