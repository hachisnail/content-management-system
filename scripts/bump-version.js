const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

const newVersion = process.argv[2];
const releaseNote = process.argv.slice(3).join(' ') || 'Release updates';

if (!newVersion) {
  console.error('Error: No version provided.');
  process.exit(1);
}

const run = (cmd, silent = false) => {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, stdio: silent ? 'pipe' : 'inherit' }).toString().trim();
  } catch {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
};

// --- Safety Checks ---
// 1. Clean working tree
const status = run('git status --porcelain', true);
if (status) {
  console.error('Error: Working tree is not clean. Commit or stash changes first.');
  process.exit(1);
}

// 2. Branch up-to-date
const behind = run('git rev-list --left-right --count origin/main...HEAD', true);
const [behindCount] = behind.split('\t');
if (parseInt(behindCount) > 0) {
  console.error('Error: Your branch is behind origin/main. Pull first.');
  process.exit(1);
}

// --- Version Files ---
const targets = [
  {
    name: 'Server Config',
    path: path.join(ROOT_DIR, 'server/src/config/env.js'),
    regex: /version:\s*['"][^'"]+['"]/,
    replacement: `version: '${newVersion}'`,
  },
  {
    name: 'Client Config',
    path: path.join(ROOT_DIR, 'client/src/config.js'),
    regex: /export const APP_VERSION = ['"][^'"]+['"]/,
    replacement: `export const APP_VERSION = "${newVersion}"`,
  },
];

// --- Update Version Files ---
const changedFiles = [];
targets.forEach((t) => {
  if (!fs.existsSync(t.path)) return;
  const content = fs.readFileSync(t.path, 'utf8');
  const updated = content.replace(t.regex, t.replacement);
  if (content !== updated) {
    fs.writeFileSync(t.path, updated);
    console.log(`Updated ${t.name}`);
    changedFiles.push(t.path);
  }
});

// --- Update Changelog ---
if (!fs.existsSync(CHANGELOG_PATH)) fs.writeFileSync(CHANGELOG_PATH, '# Changelog\n\n');
fs.appendFileSync(CHANGELOG_PATH, `## v${newVersion}\n- ${releaseNote}\n\n`);
changedFiles.push(CHANGELOG_PATH);

// --- Stage Files ---
run(`git add ${changedFiles.map((p) => `"${p}"`).join(' ')}`);

// --- Commit ---
const lastCommitMsg = run('git log -1 --pretty=%B', true);
let commitCmd;
if (lastCommitMsg.toLowerCase().startsWith('wip') || lastCommitMsg.toLowerCase().includes('ready for release')) {
  console.log('Amending last WIP commit with version bump and changelog...');
  commitCmd = 'git commit --amend --no-edit';
} else {
  console.log('Creating new release commit...');
  commitCmd = `git commit -m "release: v${newVersion} - ${releaseNote.replace(/"/g, '\\"')}"`;
}
run(commitCmd);

// --- Tag ---
run(`git tag v${newVersion}`);

console.log('\n Release snapshot ready!');
console.log('Push with: git push && git push --tags');
