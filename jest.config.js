module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/js/**/*.test.js'],
  rootDir: '.',
  // Nested git worktrees live under .claude/worktrees/ and carry their own
  // package.json, which collides with the root in jest-haste-map. Ignore them.
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  verbose: true
};
