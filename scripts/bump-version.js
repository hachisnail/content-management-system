const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

<<<<<<< HEAD
// --- CONFIG ---
=======
// --- CONFIGURATION ---
>>>>>>> 18912a67ffb7de70dcab3539dee342644a62bd12
const ROOT_DIR = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

// --- ARGUMENTS ---
const newVersion = process.argv[2];
<<<<<<< HEAD
const releaseNote = process.argv.slice(3).join(' ') || 'Release updates';

if (!newVersion) {
  console.error('Error: No version provided.');
  console.log('Usage: npm run bump -- 0.5.0 "Release description"');
=======
const commitDescription = process.argv.slice(3).join(' ');

if (!newVersion) {
  console.error('Error: No version provided.');
  console.log('Usage: npm run bump -- 0.4.0 "Release description"');
  process.exit(1);
}

// --- VALIDATION ---

// SemVer validation
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
if (!SEMVER_REGEX.test(newVersion)) {
  console.error('Error: Version must follow semantic versioning (MAJOR.MINOR.PATCH)');
>>>>>>> 18912a67ffb7de70dcab3539dee342644a62bd12
  process.exit(1);
}

// --- HELPERS ---
<<<<<<< HEAD
const run = (cmd, silent = false) => {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, stdio: silent ? 'pipe' : 'inherit' })
      ?.toString()
      .trim();
  } catch {
    console.error(`Command failed: ${cmd}`);
=======

const run = (command, silent = false) => {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      stdio: silent ? 'pipe' : 'inherit'
    })?.toString().trim();
  } catch {
    console.error(`Command failed: ${command}`);
>>>>>>> 18912a67ffb7de70dcab3539dee342644a62bd12
    process.exit(1);
  }
};

<<<<<<< HEAD
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
=======
const ensureCleanWorkingTree = () => {
  const status = run('git status --porcelain', true);
  if (status) {
    console.error(
      'Error: Working tree is not clean.\n' +
      'Commit or stash changes before running the bump script.'
    );
    process.exit(1);
  }
};

const ensureStagedChangesExist = () => {
  const staged = run('git diff --cached --name-only', true);
  if (!staged) {
    console.error(
      'Error: No staged changes detected.\n' +
      'Stage feature changes first using: git add .'
    );
    process.exit(1);
  }
};

const ensureTagDoesNotExist = () => {
  const existing = run(`git tag -l v${newVersion}`, true);
  if (existing) {
    console.error(`Error: Tag v${newVersion} already exists.`);
    process.exit(1);
  }
};

const updateFile = ({ name, path: filePath, regex, replacement }) => {
  if (!fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(regex, replacement);

  if (content !== updated) {
    fs.writeFileSync(filePath, updated);
    console.log(`Updated ${name}`);
    return true;
  }
  return false;
};

// --- VERSION TARGETS ---
const targets = [
  {
    name: 'Server Config',
    path: path.join(ROOT_DIR, 'server', 'src', 'config', 'env.js'),
    regex: /version:\s*['"][^'"]+['"]/,
    replacement: `version: '${newVersion}'`
  },
  {
    name: 'Client Config',
    path: path.join(ROOT_DIR, 'client', 'src', 'config.js'),
    regex: /export const APP_VERSION = ['"][^'"]+['"]/,
    replacement: `export const APP_VERSION = "${newVersion}"`
  }
];

// --- MAIN EXECUTION ---

console.log(`Starting release v${newVersion}`);
if (commitDescription) console.log(`Release note: ${commitDescription}`);

// 0. Safety checks
ensureCleanWorkingTree();
ensureStagedChangesExist();
ensureTagDoesNotExist();

// 1. Update version files
const changedVersionFiles = [];
targets.forEach(target => {
  if (updateFile(target)) {
    changedVersionFiles.push(target.path);
  }
});

if (changedVersionFiles.length === 0) {
  console.error('Error: Version files were not modified.');
  process.exit(1);
}

// 2. Optional CHANGELOG stub (non-blocking)
if (!fs.existsSync(CHANGELOG_PATH)) {
  fs.writeFileSync(CHANGELOG_PATH, '# Changelog\n\n');
}
fs.appendFileSync(
  CHANGELOG_PATH,
  `## v${newVersion}\n- ${commitDescription || 'Release updates'}\n\n`
);

// 3. Stage version files + changelog
run(`git add ${changedVersionFiles.map(p => `"${p}"`).join(' ')} "${CHANGELOG_PATH}"`);

// 4. Commit snapshot
let commitMessage = `(release): v${newVersion}`;
if (commitDescription) commitMessage += ` - ${commitDescription}`;

run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

// 5. Tag release
run(`git tag v${newVersion}`);

console.log('Release snapshot created successfully.');
console.log('Final step: git push && git push --tags');
>>>>>>> 18912a67ffb7de70dcab3539dee342644a62bd12
