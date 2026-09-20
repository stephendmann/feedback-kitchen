#!/usr/bin/env node
/* Wires .githooks as this clone's hooks directory. Run by `npm install` via
   package.json's `prepare` script.

   Exactly one failure is tolerated: there being no git repository. That is the
   case when this package is installed as a dependency or unpacked from a
   tarball rather than cloned, where there is no hook to wire and nothing is
   wrong. Every other failure is reported and exits non-zero. The previous
   `|| exit 0` swallowed those too, which meant a real git error left the
   pre-commit guard silently uninstalled and looked like success. */
'use strict';

const { spawnSync } = require('child_process');

const probe = spawnSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
if (probe.error || probe.status !== 0) {
  console.log('install-hooks: not a git repository, skipping hook wiring.');
  process.exit(0);
}

const set = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
if (set.error || set.status !== 0) {
  console.error('install-hooks: could not set core.hooksPath to .githooks' +
    (set.error ? ' (' + set.error.message + ')' : ' (git exited ' + set.status + ')') + '.');
  console.error('The student-data pre-commit guard is NOT installed. Fix the error above, or run:');
  console.error('  git config core.hooksPath .githooks');
  process.exit(1);
}
