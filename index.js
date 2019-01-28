const assert = require('assert');
const { readdirSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');
const glob = require('glob');

// 在windows环境下，很多工具都会把换行符lf自动改成crlf，修改了一下。
// https://github.com/cssmagic/blog/issues/22
const isWindows =
  typeof process !== 'undefined' && process.platform === 'win32';
const winEOL = content => {
  if (typeof content !== 'string') {
    return content;
  }
  return isWindows ? content.replace(/\r/g, '') : content;
};

function noop(content) {
  return content;
}

function assertBuildResult({ cwd, replaceContent = noop }) {
  const actualDir = join(cwd, 'dist');
  const expectDir = join(cwd, 'expected');

  const actualFiles = glob.sync('**/*', { cwd: actualDir, nodir: true });
  const expectFiles = glob.sync('**/*', { cwd: actualDir, nodir: true });

  expect(actualFiles.length).toEqual(expectFiles.length);

  actualFiles.forEach(file => {
    const actualFile = readFileSync(join(actualDir, file), 'utf-8');
    const expectFile = readFileSync(join(expectDir, file), 'utf-8');
    expect(winEOL(replaceContent(actualFile).trim())).toEqual(winEOL(expectFile.trim()));
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
