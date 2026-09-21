/**
 * @jest-environment node
 *
 * Tests for the hook installer (scripts/install-hooks.js).
 *
 * The bug these exist for is the quiet kind: a worktree-scoped core.hooksPath
 * left pointing somewhere that is not this working tree's .githooks. git finds
 * no pre-commit, runs nothing, reports nothing, and the commit lands. It looks
 * identical to a clean commit, which is why it went unnoticed during PR #170
 * until a commit that should have been refused was not.
 *
 * So the decision logic is driven through an injected git runner: every call
 * the installer would make is recorded, and the assertions are about which
 * scope it wrote to as much as which value it wrote. Writing the main
 * checkout's config from inside a worktree would be its own quiet failure.
 */

const { installHooks, samePath } = require('../scripts/install-hooks.js');

const ok  = (out) => ({ ok: true,  status: 0, out: out === undefined ? '' : out, why: '' });
const bad = (why) => ({ ok: false, status: 1, out: '', why: why || 'git exited 1' });

/* Dispatches on an args prefix and records every call. Anything unmatched
   succeeds with empty output, so a test states only what it cares about. */
function fakeGit(routes) {
  const calls = [];
  const git = (args) => {
    const key = args.join(' ');
    calls.push(key);
    for (const [prefix, result] of routes) {
      if (key === prefix || key.startsWith(prefix + ' ')) return result;
    }
    return ok('');
  };
  git.calls = calls;
  return git;
}

function fakeIo(exists) {
  const out = [], err = [];
  return {
    log: (m) => out.push(m),
    error: (m) => err.push(m),
    exists: exists === undefined ? () => true : exists,
    out, err
  };
}

const MAIN_TOP   = '/repo';
const WT_TOP     = '/repo/.claude/worktrees/wt1';
const COMMON_DIR = '/repo/.git';

const mainRoutes = (extra) => ([
  ['rev-parse --git-dir', ok(COMMON_DIR)],
  ['rev-parse --git-common-dir', ok(COMMON_DIR)],
  ['rev-parse --show-toplevel', ok(MAIN_TOP)],
  ['rev-parse --git-path hooks', ok('.githooks')]
].concat(extra || []));

const worktreeRoutes = (extra) => ([
  ['rev-parse --git-dir', ok(COMMON_DIR + '/worktrees/wt1')],
  ['rev-parse --git-common-dir', ok(COMMON_DIR)],
  ['rev-parse --show-toplevel', ok(WT_TOP)],
  ['rev-parse --git-path hooks', ok(WT_TOP + '/.githooks')]
].concat(extra || []));

const configWrites = (git) =>
  git.calls.filter(c => c.startsWith('config ') && !c.startsWith('config --get'));

describe('main checkout', () => {
  test('sets the relative path, and touches neither worktree scope nor the extension', () => {
    const git = fakeGit(mainRoutes());
    expect(installHooks(git, fakeIo())).toBe(0);

    expect(configWrites(git)).toEqual(['config core.hooksPath .githooks']);
    expect(git.calls.some(c => c.includes('--worktree'))).toBe(false);
    expect(git.calls.some(c => c.includes('worktreeConfig'))).toBe(false);
  });

  test('a relative path is verified against the working tree root', () => {
    const seen = [];
    const io = fakeIo((p) => { seen.push(p); return true; });
    expect(installHooks(fakeGit(mainRoutes()), io)).toBe(0);
    expect(seen).toHaveLength(1);
    expect(seen[0].split(String.fromCharCode(92)).join('/')).toBe('/repo/.githooks/pre-commit');
  });
});

describe('linked worktree', () => {
  const WT_HOOKS = 'config --worktree core.hooksPath ' + WT_TOP + '/.githooks';

  test('writes an absolute path in worktree scope, never the shared config', () => {
    const git = fakeGit(worktreeRoutes());
    expect(installHooks(git, fakeIo())).toBe(0);

    expect(git.calls).toContain(WT_HOOKS);
    // The shared config must be left as it is: a repository-wide hooksPath
    // written from here would follow every other worktree home.
    expect(configWrites(git).some(c => c.includes('core.hooksPath') && !c.includes('--worktree')))
      .toBe(false);
  });

  test('the path comes from the worktree root, not the process directory', () => {
    const git = fakeGit(worktreeRoutes());
    installHooks(git, fakeIo());
    const write = git.calls.find(c => c.startsWith('config --worktree core.hooksPath'));
    expect(write.endsWith(WT_TOP + '/.githooks')).toBe(true);
    expect(write).not.toContain(process.cwd());
  });

  test('enables extensions.worktreeConfig when it is missing', () => {
    const git = fakeGit(worktreeRoutes([
      ['config --get extensions.worktreeConfig', bad('not found')]
    ]));
    expect(installHooks(git, fakeIo())).toBe(0);
    expect(git.calls).toContain('config extensions.worktreeConfig true');
    // Order matters: --worktree is refused while the extension is off.
    expect(git.calls.indexOf('config extensions.worktreeConfig true'))
      .toBeLessThan(git.calls.findIndex(c => c.includes('--worktree')));
  });

  test('leaves extensions.worktreeConfig alone when it is already on', () => {
    const git = fakeGit(worktreeRoutes([
      ['config --get extensions.worktreeConfig', ok('true')]
    ]));
    expect(installHooks(git, fakeIo())).toBe(0);
    expect(git.calls).not.toContain('config extensions.worktreeConfig true');
    expect(git.calls).toContain(WT_HOOKS);
  });

  test('a value other than true is treated as off and enabled', () => {
    const git = fakeGit(worktreeRoutes([
      ['config --get extensions.worktreeConfig', ok('false')]
    ]));
    expect(installHooks(git, fakeIo())).toBe(0);
    expect(git.calls).toContain('config extensions.worktreeConfig true');
  });
});

describe('no git repository', () => {
  test('exits 0, says so, and attempts nothing further', () => {
    const git = fakeGit([['rev-parse --git-dir', bad('not a git repository')]]);
    const io = fakeIo();
    expect(installHooks(git, io)).toBe(0);
    expect(git.calls).toEqual(['rev-parse --git-dir']);
    expect(io.err).toEqual([]);
    expect(io.out.join(' ')).toMatch(/not a git repository/);
  });
});

describe('loud failure', () => {
  const saysGuardIsNotInstalled = (io) => {
    expect(io.err.join(' ')).toMatch(/NOT installed/);
    expect(io.err.join(' ')).toMatch(/git config/);          // the manual fix
  };

  test('a failing config write exits non-zero and says the guard is not installed', () => {
    const io = fakeIo();
    const git = fakeGit(mainRoutes([['config core.hooksPath', bad('permission denied')]]));
    expect(installHooks(git, io)).toBe(1);
    expect(io.err.join(' ')).toMatch(/permission denied/);
    saysGuardIsNotInstalled(io);
  });

  test('a failing worktree config write exits non-zero', () => {
    const io = fakeIo();
    const git = fakeGit(worktreeRoutes([['config --worktree', bad('worktree config disabled')]]));
    expect(installHooks(git, io)).toBe(1);
    saysGuardIsNotInstalled(io);
  });

  test('failing to enable the extension exits non-zero rather than trying anyway', () => {
    const io = fakeIo();
    const git = fakeGit(worktreeRoutes([
      ['config --get extensions.worktreeConfig', bad('not found')],
      ['config extensions.worktreeConfig true', bad('read-only config')]
    ]));
    expect(installHooks(git, io)).toBe(1);
    expect(git.calls.some(c => c.includes('--worktree'))).toBe(false);
    saysGuardIsNotInstalled(io);
  });

  test('a write that reports success but leaves no runnable hook is caught', () => {
    // The whole point. Every config call succeeds; the directory git resolves
    // to holds no pre-commit, so the install did not happen.
    const io = fakeIo(() => false);
    expect(installHooks(fakeGit(worktreeRoutes()), io)).toBe(1);
    expect(io.err.join(' ')).toMatch(/no pre-commit/);
    saysGuardIsNotInstalled(io);
  });

  test('a failing rev-parse is reported rather than assumed', () => {
    const io = fakeIo();
    const git = fakeGit([
      ['rev-parse --git-dir', ok(COMMON_DIR)],
      ['rev-parse --git-common-dir', bad('broken repository')]
    ]);
    expect(installHooks(git, io)).toBe(1);
    saysGuardIsNotInstalled(io);
  });
});

describe('samePath', () => {
  test('distinguishes a worktree git dir from the common one', () => {
    expect(samePath(COMMON_DIR, COMMON_DIR)).toBe(true);
    expect(samePath(COMMON_DIR, COMMON_DIR + '/worktrees/wt1')).toBe(false);
  });

  test('ignores separator style and redundant segments', () => {
    expect(samePath('/repo/.git', '/repo/./.git')).toBe(true);
    expect(samePath('/repo/.git', '/repo/.git/')).toBe(true);
  });
});
