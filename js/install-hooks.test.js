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

const { installHooks, samePath, isNotARepository, isExecutable } = require('../scripts/install-hooks.js');

const ok  = (out) => ({ ok: true,  status: 0, out: out === undefined ? '' : out, why: '' });
const bad = (why, err) => ({
  ok: false, status: 1, out: '', err: err || '', why: why || 'git exited 1'
});

/* The installer tells the one tolerated failure apart from the rest by what
   git printed to stderr, so these carry a plausible message for each shape:
   no repository, a repository git refuses to read, and no usable git at all
   (which arrives as a spawn error, with no stderr). */
const noRepo = () =>
  bad('not a git repository',
      'fatal: not a git repository (or any of the parent directories): .git');
const otherGitFailure = (msg) => bad(msg, msg);
const gitMissing = () =>
  ({ ok: false, status: null, out: '', err: '', why: 'spawn git ENOENT' });

/* Dispatches on an args prefix and records every call. An unmatched config
   call succeeds with empty output, so a test states only what it cares about.
   An unmatched rev-parse fails: the installer reads real values from those,
   and a silently empty answer would let a test pass without exercising the
   code it names. */
function fakeGit(routes) {
  const calls = [];
  const git = (args) => {
    const key = args.join(' ');
    calls.push(key);
    for (const [prefix, result] of routes) {
      if (key === prefix || key.startsWith(prefix + ' ')) return result;
    }
    return args[0] === 'rev-parse' ? bad('unrouted in test: ' + key) : ok('');
  };
  git.calls = calls;
  return git;
}

function fakeIo(exists, executable) {
  const out = [], err = [];
  return {
    log: (m) => out.push(m),
    error: (m) => err.push(m),
    exists: exists === undefined ? () => true : exists,
    executable: executable === undefined ? () => true : executable,
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
  ['rev-parse --path-format=absolute --git-path hooks', ok(MAIN_TOP + '/.githooks')]
].concat(extra || []));

const worktreeRoutes = (extra) => ([
  ['rev-parse --git-dir', ok(COMMON_DIR + '/worktrees/wt1')],
  ['rev-parse --git-common-dir', ok(COMMON_DIR)],
  ['rev-parse --show-toplevel', ok(WT_TOP)],
  ['rev-parse --path-format=absolute --git-path hooks', ok(WT_TOP + '/.githooks')]
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

  test('verification asks git for an absolute path and checks it as given', () => {
    const seen = [];
    const git = fakeGit(mainRoutes());
    const io = fakeIo((p) => { seen.push(p); return true; });
    expect(installHooks(git, io)).toBe(0);
    expect(git.calls).toContain('rev-parse --path-format=absolute --git-path hooks');
    expect(seen).toHaveLength(1);
    expect(seen[0].split(String.fromCharCode(92)).join('/')).toBe('/repo/.githooks/pre-commit');
  });

  test('a hooks path that is not absolute is refused, not joined', () => {
    // What a relative answer looks like from js/. Joining it onto the top
    // level is the bug this replaced: it checked a directory outside the repo.
    // The override is listed first because routes match in order.
    const git = fakeGit([
      ['rev-parse --path-format=absolute --git-path hooks', ok('../.githooks')]
    ].concat(mainRoutes()));
    const io = fakeIo(() => true);
    expect(installHooks(git, io)).toBe(1);
    expect(io.err.join(' ')).toContain('git 2.31 or later');
    expect(io.err.join(' ')).toMatch(/NOT installed/);
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

describe('the probe for a repository', () => {
  test('no repository: exits 0, says so, and attempts nothing further', () => {
    const git = fakeGit([['rev-parse --git-dir', noRepo()]]);
    const io = fakeIo();
    expect(installHooks(git, io)).toBe(0);
    expect(git.calls).toEqual(['rev-parse --git-dir']);
    expect(io.err).toEqual([]);
    expect(io.out.join(' ')).toMatch(/not a git repository/);
  });

  test('git missing or unrunnable is a loud failure, not a skip', () => {
    // The distinction this pins. Both arrive as a failed rev-parse, but only
    // one of them means there is no hook to install. An unrunnable git left
    // the guard uninstalled on a machine that does have a repository.
    const git = fakeGit([['rev-parse --git-dir', gitMissing()]]);
    const io = fakeIo();
    expect(installHooks(git, io)).toBe(1);
    expect(io.out).toEqual([]);
    expect(io.err.join(' ')).toMatch(/ENOENT/);
    expect(io.err.join(' ')).toMatch(/NOT installed/);
  });

  test('a repository git will not read is a loud failure, not a skip', () => {
    const git = fakeGit([
      ['rev-parse --git-dir', otherGitFailure('fatal: detected dubious ownership in repository')]
    ]);
    const io = fakeIo();
    expect(installHooks(git, io)).toBe(1);
    expect(io.out).toEqual([]);
    expect(io.err.join(' ')).toMatch(/dubious ownership/);
    expect(io.err.join(' ')).toMatch(/NOT installed/);
  });

  test('the tolerated case is decided by what git says, not by exit status', () => {
    expect(isNotARepository({ err: 'fatal: not a git repository (or any of the parent directories): .git' }))
      .toBe(true);
    expect(isNotARepository({ err: 'fatal: detected dubious ownership in repository' })).toBe(false);
    expect(isNotARepository({ err: '' })).toBe(false);
    expect(isNotARepository({})).toBe(false);
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

  test('a hook git would skip for want of the executable bit is caught', () => {
    // The same silent no-op by another route: pre-commit is there, but outside
    // Windows git will not run a file without +x, and says at most a hint.
    const checked = [];
    const io = fakeIo(() => true, (p) => { checked.push(p); return false; });
    expect(installHooks(fakeGit(worktreeRoutes()), io)).toBe(1);
    expect(checked).toHaveLength(1);
    expect(checked[0].split(String.fromCharCode(92)).join('/')).toBe(WT_TOP + '/.githooks/pre-commit');
    expect(io.err.join(' ')).toMatch(/not executable/);
    expect(io.err.join(' ')).toMatch(/chmod \+x \.githooks\/pre-commit/);
    expect(io.out).toEqual([]);
    saysGuardIsNotInstalled(io);
  });

  test('a missing hook is reported as missing, before executability is asked', () => {
    const checked = [];
    const io = fakeIo(() => false, (p) => { checked.push(p); return false; });
    expect(installHooks(fakeGit(worktreeRoutes()), io)).toBe(1);
    expect(checked).toEqual([]);
    expect(io.err.join(' ')).toMatch(/no pre-commit/);
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

describe('direct invocation from a subdirectory (real git)', () => {
  // Regression for the review finding on #171. The fakes above cannot catch
  // this one: the bug was in how real git answers. With a relative hooksPath,
  // `rev-parse --git-path hooks` from js/ says `../.githooks`, and the old
  // join onto the top level checked a directory outside the repository, so a
  // correct install was reported as NOT installed. Via npm this never showed,
  // because npm runs lifecycle scripts from the package root; running the
  // script by hand from a subdirectory did.
  const fs = require('fs'), os = require('os'), path = require('path');
  const { spawnSync } = require('child_process');
  const script = path.join(__dirname, '..', 'scripts', 'install-hooks.js');

  let repo;
  beforeAll(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-hooks-'));
    const init = spawnSync('git', ['init', '-q', repo], { encoding: 'utf8' });
    if (init.status !== 0) throw new Error('git init failed: ' + init.stderr);
    fs.mkdirSync(path.join(repo, '.githooks'));
    // Executable, as the tracked hook is: the installer now refuses one that
    // is not, which on Linux CI would fail these for the wrong reason.
    fs.writeFileSync(path.join(repo, '.githooks', 'pre-commit'), '#!/bin/sh' + String.fromCharCode(10),
      { mode: 0o755 });
    fs.mkdirSync(path.join(repo, 'js'));
  });
  afterAll(() => { fs.rmSync(repo, { recursive: true, force: true }); });

  const runFrom = (cwd) => spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });

  test('a main checkout verifies as installed when run from a subdirectory', () => {
    const r = runFrom(path.join(repo, 'js'));
    expect(r.stderr).not.toMatch(/NOT installed/);
    expect(r.status).toBe(0);
    // The hooks directory it reports is the repository's, not one level up.
    const reported = r.stdout.match(/wired from (.+?)\.?\s*$/m)[1];
    expect(path.resolve(reported).toLowerCase())
      .toBe(path.resolve(repo, '.githooks').toLowerCase());
  });

  test('and it still writes the relative, main-checkout value', () => {
    runFrom(path.join(repo, 'js'));
    const get = spawnSync('git', ['-C', repo, 'config', '--local', '--get', 'core.hooksPath'],
      { encoding: 'utf8' });
    expect(get.stdout.trim()).toBe('.githooks');
  });
});

describe('executability', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const { spawnSync } = require('child_process');
  const posixOnly = process.platform === 'win32' ? test.skip : test;
  const windowsOnly = process.platform === 'win32' ? test : test.skip;

  let dir;
  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-exec-')); });
  afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  const writeHook = (name, mode) => {
    const p = path.join(dir, name);
    fs.writeFileSync(p, '#!/bin/sh' + String.fromCharCode(10));
    fs.chmodSync(p, mode);
    return p;
  };

  posixOnly('a 0644 file is not executable, a 0755 one is', () => {
    expect(isExecutable(writeHook('plain', 0o644))).toBe(false);
    expect(isExecutable(writeHook('runnable', 0o755))).toBe(true);
  });

  windowsOnly('on Windows every file counts, because git ignores mode bits there', () => {
    expect(isExecutable(writeHook('plain', 0o644))).toBe(true);
  });

  test('the tracked hook is committed as 100755', () => {
    // The root cause. A clone checks the hook out with the mode git stored,
    // so a 100644 entry reaches every Linux and macOS clone non-executable,
    // whatever the installer does. Windows never shows the difference.
    const r = spawnSync('git', ['ls-files', '--stage', '--', '.githooks/pre-commit'],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout.split(' ')[0]).toBe('100755');
  });
});
