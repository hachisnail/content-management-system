const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- CONFIG ---
const ROOT_DIR = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

// --- ARGUMENTS ---
const newVersion = process.argv[2];
const releaseNote = process.argv.slice(3).join(' ') || 'Release updates';

if (!newVersion) {
  console.error('Error: No version provided.');
  console.log('Usage: npm run bump -- 0.5.0 "Release description"');
  process.exit(1);
}

// --- HELPERS ---
const run = (cmd, silent = false) => {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, stdio: silent ? 'pipe' : 'inherit' })
      ?.toString()
      .trim();
  } catch {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
};

// Check last commit message to see if it's a WIP/feature commit
const lastCommitMsg = run('git log -1 --pretty=%B', true);

// --- VERSION FILE TARGETS ---
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

// --- UPDATE VERSION FILES ---
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

if (changedFiles.length === 0) {
  console.error('No version files were modified.');
  process.exit(1);
}

// --- UPDATE CHANGELOG ---
if (!fs.existsSync(CHANGELOG_PATH)) fs.writeFileSync(CHANGELOG_PATH, '# Changelog\n\n');
const changelogEntry = `## v${newVersion}\n- ${releaseNote}\n\n`;
fs.appendFileSync(CHANGELOG_PATH, changelogEntry);
changedFiles.push(CHANGELOG_PATH);

// --- STAGE FILES ---
run(`git add ${changedFiles.map((p) => `"${p}"`).join(' ')}`);

// --- COMMIT LOGIC ---
let commitCmd;
if (lastCommitMsg.toLowerCase().startsWith('wip') || lastCommitMsg.toLowerCase().includes('ready for release')) {
  console.log('Amending last WIP commit with version bump and changelog...');
  commitCmd = 'git commit --amend --no-edit';
} else {
  console.log('Creating new release commit...');
  commitCmd = `git commit -m "release: v${newVersion} - ${releaseNote.replace(/"/g, '\\"')}"`;
}
run(commitCmd);

// --- TAG RELEASE ---
run(`git tag v${newVersion}`);

console.log('\n✅ Release snapshot ready!');
console.log('Push to remote with:');
console.log('git push && git push --tags');
