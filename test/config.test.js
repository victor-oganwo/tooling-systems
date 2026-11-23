import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const configPath = fileURLToPath(new URL('../src/config/index.js', import.meta.url));

function runConfig(overrides = {}, modulePath = configPath, args = [], cwd = tmpdir()) {
  const env = { ...process.env };
  delete env.APP_ENV;
  delete env.PORT;
  delete env.MONGODB_URI;
  Object.assign(env, overrides);
  const code = `import config from ${JSON.stringify(pathToFileURL(modulePath).href)}; console.log(JSON.stringify(config));`;
  // Match a script launch, where argv[1] is the script and argv[2] selects the environment.
  return spawnSync(process.execPath, ['--input-type=module', '--eval', code, 'config-probe', ...args], {
    cwd,
    env,
    encoding: 'utf8',
  });
}

test('selects isolated defaults for staging, preprod, and prod', () => {
  for (const [env, port] of [['staging', 3001], ['preprod', 3002], ['prod', 3003]]) {
    const result = runConfig({ APP_ENV: env });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      env,
      port,
      mongodbUri: `mongodb://127.0.0.1:27017/env_branching_${env}`,
    });
  }
});

test('defaults to staging and rejects unknown environments', () => {
  const defaultResult = runConfig();
  assert.equal(defaultResult.status, 0, defaultResult.stderr);
  assert.equal(JSON.parse(defaultResult.stdout).env, 'staging');
  const invalidResult = runConfig({ APP_ENV: 'production' });
  assert.notEqual(invalidResult.status, 0);
  assert.match(invalidResult.stderr, /APP_ENV must be staging, preprod, or prod/);
});

test('accepts a CLI environment and gives APP_ENV precedence', () => {
  const cliResult = runConfig({}, configPath, ['preprod']);
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.equal(JSON.parse(cliResult.stdout).env, 'preprod');
  const overrideResult = runConfig({ APP_ENV: 'prod' }, configPath, ['preprod']);
  assert.equal(overrideResult.status, 0, overrideResult.stderr);
  assert.equal(JSON.parse(overrideResult.stdout).env, 'prod');
});

test('accepts real environment overrides and rejects invalid ports', () => {
  const result = runConfig({ APP_ENV: 'prod', PORT: '4100', MONGODB_URI: 'mongodb://127.0.0.1:27017/custom' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).port, 4100);
  assert.equal(JSON.parse(result.stdout).mongodbUri, 'mongodb://127.0.0.1:27017/custom');
  for (const port of ['', '0', '65536', '3.5', 'abc', '1e3']) {
    const invalidResult = runConfig({ PORT: port });
    assert.notEqual(invalidResult.status, 0);
    assert.match(invalidResult.stderr, /PORT must be an integer/);
  }
});

test('loads project-relative env files while preserving real environment precedence', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'env-branching-config-'));
  try {
    cpSync(path.dirname(configPath), path.join(fixture, 'src', 'config'), { recursive: true });
    writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ type: 'module' }));
    writeFileSync(path.join(fixture, '.env.preprod'), 'PORT=4200\nMONGODB_URI=mongodb://127.0.0.1:27017/from_file\n');
    const fixtureModule = path.join(fixture, 'src', 'config', 'index.js');
    const fileResult = runConfig({ APP_ENV: 'preprod' }, fixtureModule);
    assert.equal(fileResult.status, 0, fileResult.stderr);
    assert.equal(JSON.parse(fileResult.stdout).port, 4200);
    assert.equal(JSON.parse(fileResult.stdout).mongodbUri, 'mongodb://127.0.0.1:27017/from_file');
    const overrideResult = runConfig({ APP_ENV: 'preprod', PORT: '4300' }, fixtureModule);
    assert.equal(overrideResult.status, 0, overrideResult.stderr);
    assert.equal(JSON.parse(overrideResult.stdout).port, 4300);
  } finally {
    const resolvedFixture = path.resolve(fixture);
    assert.equal(path.dirname(resolvedFixture), path.resolve(tmpdir()));
    assert.ok(path.basename(resolvedFixture).startsWith('env-branching-config-'));
    rmSync(fixture, { recursive: true, force: true });
  }
});
