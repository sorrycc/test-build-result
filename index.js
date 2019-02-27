const assert = require('assert');
const { readdirSync, readFileSync, existsSync } = require('fs');
const { copy } = require('fs-extra');
const { join } = require('path');
const glob = require('glob');

function noop(content) {
  return content;
}

function assertBuildResult({ cwd, replaceContent = noop }) {
  const actualDir = join(cwd, 'dist');
  const expectDir = join(cwd, 'expected');

  if (existsSync(actualDir) && !existsSync(expectDir)) {
    copy(actualDir, expectDir);
    return;
  }

  const actualFiles = glob.sync('**/*', { cwd: actualDir, nodir: true });
  const expectFiles = glob.sync('**/*', { cwd: actualDir, nodir: true });

  expect(actualFiles.length).toEqual(expectFiles.length);

  actualFiles.forEach(file => {
    const actualFile = readFileSync(join(actualDir, file), 'utf-8');
    const expectFile = readFileSync(join(expectDir, file), 'utf-8');
    expect(replaceContent(actualFile).trim()).toEqual(expectFile.trim());
  });
}

function test({ root, build, replaceContent }) {
  assert(root && build, `Invalid arguments`);
  assert(existsSync(root), `root (${root}) not exists`);

  readdirSync(root)
    .filter(dir => dir.charAt(0) !== '.')
    .forEach(dir => {
      const fn = dir.endsWith('-only') ? it.only : it;
      fn(dir, done => {
        const cwd = join(root, dir);
        build({ cwd, dir })
          .then(() => {
            try {
              assertBuildResult({ cwd, replaceContent });
              done();
            } catch (e) {
              done(e);
            }
          })
          .catch(e => {
            done(e);
          });
      });
    });
}

module.exports = test;
