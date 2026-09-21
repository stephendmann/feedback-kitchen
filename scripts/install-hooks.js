#!/usr/bin/env node
/* ============================================================
   Wires .githooks as this working tree's hooks directory. Run by
   `npm install` via package.json's `prepare` script.

   WHY THIS IS NOT JUST ONE `git config` LINE.

   This repo is worked on from linked worktrees (.claude/worktrees/*), and it
   has extensions.worktreeConfig enabled. That combination has a failure mode
   that looks exactly like success: a worktree-scoped core.hooksPath, which
   takes precedence over the repository-wide value, pointing somewhere that is
   not this worktree's .githooks. git then finds no pre-commit, runs nothing,
   says nothing, and the commit lands. Observed during PR #170: a commit that
   the student-data guard should have refused went through with no hook run
   and no warning.

   Two ways that stale value gets there. The agent tooling that creates these
   worktrees writes an absolute core.hooksPath into the new worktree's
   config.worktree, freezing whatever the path resolved to at creation time.
   And `git worktree add` copies the creating worktree's config.worktree into
   the new one, so a bad value propagates to every worktree cut from it.

   Note what is NOT the problem: a relative `.githooks` resolves correctly in
   a linked worktree. git returns it unresolved from `rev-parse --git-path
   hooks` and resolves it against the working tree the hook runs in, so each
   worktree finds its own copy. The relative value is therefore kept for the
   main checkout, and only a linked worktree gets an absolute override, to
   defeat any stale one it inherited.

   The install is verified rather than assumed: after configuring, this checks
   that the hooks directory git will actually use contains pre-commit. An
   unverified install is the thing this file exists to prevent.
   ============================================================ */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOOKS_DIR_NAME = '.githooks';
const HOOK_NAME = 'pre-commit';

/* The one place that shells out, injected everywhere else so the decision
   logic can be tested without a repository to stand in. */
function realGit(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  const err = (r.stderr || '').trim();
  return {
    ok: !r.error && r.status === 0,
    status: r.status,
    out: (r.stdout || '').trim(),
    err,
    why: r.error
      ? r.error.message
      : 'git exited ' + r.status + (err ? ': ' + err.split(String.fromCharCode(10))[0] : '')
  };
}

/* The one tolerated failure, told apart from every other one by what git says.
   A missing or unrunnable git binary reports through r.error with no stderr,
   so it cannot be mistaken for this. */
function isNotARepository(result) {
  return /not a git repository/i.test(result.err || '');
}

const CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin';

function samePath(a, b) {
  const norm = (p) => {
    const abs = path.resolve(p);
    return CASE_INSENSITIVE ? abs.toLowerCase() : abs;
  };
  return norm(a) === norm(b);
}

/* Returns the process exit code. `git` and `io` are injected. */
function installHooks(git, io) {
  const log = io.log, error = io.error, exists = io.exists;

  const gitDir = git(['rev-parse', '--git-dir']);
  if (!gitDir.ok) {
    if (isNotARepository(gitDir)) {
      // The one tolerated case: no repository, so there is no hook to wire and
      // nothing is wrong. Happens when this package is installed as a
      // dependency or unpacked from a tarball rather than cloned.
      log('install-hooks: not a git repository, skipping hook wiring.');
      return 0;
    }
    // Anything else here is git missing, unrunnable, or a repository in a
    // state git will not read. None of those means "no hook needed", and
    // treating them as such is how the guard ends up quietly uninstalled.
    return fail(error, 'git rev-parse --git-dir failed: ' + gitDir.why);
  }

  const commonDir = git(['rev-parse', '--git-common-dir']);
  const topLevel = git(['rev-parse', '--show-toplevel']);
  for (const probe of [['--git-common-dir', commonDir], ['--show-toplevel', topLevel]]) {
    if (!probe[1].ok) return fail(error, 'git rev-parse ' + probe[0] + ' failed: ' + probe[1].why);
  }

  // A linked worktree has its own git dir inside the common one; the main
  // checkout's two are the same directory.
  const linked = !samePath(gitDir.out, commonDir.out);

  if (linked) {
    // Worktree scope, so this cannot reach the main checkout or a sibling, and
    // so it beats any stale value already in this worktree's config.
    const enabled = git(['config', '--get', 'extensions.worktreeConfig']);
    if (!enabled.ok || enabled.out !== 'true') {
      const turnOn = git(['config', 'extensions.worktreeConfig', 'true']);
      if (!turnOn.ok) {
        return fail(error, 'could not enable extensions.worktreeConfig: ' + turnOn.why);
      }
    }
    // Computed from the worktree root, not process.cwd(): npm install can run
    // from a subdirectory.
    const absolute = path.posix.join(topLevel.out.split(path.sep).join('/'), HOOKS_DIR_NAME);
    const set = git(['config', '--worktree', 'core.hooksPath', absolute]);
    if (!set.ok) {
      return fail(error, 'could not set core.hooksPath to ' + absolute + ': ' + set.why);
    }
  } else {
    const set = git(['config', 'core.hooksPath', HOOKS_DIR_NAME]);
    if (!set.ok) {
      return fail(error, 'could not set core.hooksPath to ' + HOOKS_DIR_NAME + ': ' + set.why);
    }
  }

  // Verify against what git will actually use, rather than trusting the write.
  const resolved = git(['rev-parse', '--git-path', 'hooks']);
  if (!resolved.ok) {
    return fail(error, 'git rev-parse --git-path hooks failed: ' + resolved.why);
  }
  const hooksDir = path.isAbsolute(resolved.out)
    ? resolved.out
    : path.join(topLevel.out, resolved.out);
  if (!exists(path.join(hooksDir, HOOK_NAME))) {
    return fail(error, 'git resolves hooks to ' + hooksDir + ', which has no ' + HOOK_NAME +
      '. If your working tree is on a commit from before ' + HOOKS_DIR_NAME +
      ' existed, check out a current one and run npm install again.');
  }

  log('install-hooks: ' + HOOK_NAME + ' wired from ' + hooksDir +
    (linked ? ' (worktree-scoped).' : '.'));
  return 0;
}

function fail(error, what) {
  error('install-hooks: ' + what);
  error('The student-data pre-commit guard is NOT installed, so a commit containing');
  error('a real student identifier would not be refused locally. Fix the error above,');
  error('or wire it by hand from the root of this working tree:');
  error('  git config core.hooksPath ' + HOOKS_DIR_NAME + '        # main checkout');
  error('  git config --worktree core.hooksPath "$PWD/' + HOOKS_DIR_NAME + '"   # linked worktree');
  return 1;
}

if (require.main === module) {
  process.exit(installHooks(realGit, {
    log: console.log,
    error: console.error,
    exists: fs.existsSync
  }));
}

module.exports = { installHooks, samePath, realGit, isNotARepository };
