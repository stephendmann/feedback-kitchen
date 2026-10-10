/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './js/**/*.js',
    // Test files are never loaded by the app. Their prose and fixtures must
    // not generate CSS (a comment containing "invisible" emitted .invisible).
    '!./js/**/*.test.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
