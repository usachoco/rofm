export default {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
