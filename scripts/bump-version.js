const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- CONFIGURATION ---
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Parse Arguments
const newVersion = process.argv[2];
const commitDescription = process.argv.slice(3).join(' ');

if (!newVersion) {
  console.error('Error: No version provided.');
  console.log('Usage: npm run bump -- 0.6.0 "Release description"');
  process.exit(1);
}

// 2. Define Targets to Update
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

// --- HELPERS ---

const run = (command) => {
  try {
    console.log(`> ${command}`);
    execSync(command, { stdio: 'inherit', cwd: ROOT_DIR });
  } catch (err) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
};

const updateFile = (target) => {
  if (!fs.existsSync(target.path)) {
    console.warn(`Warning: ${target.name} not found at ${target.path}`);
    return false;
  }
  const content = fs.readFileSync(target.path, 'utf8');
  const updatedContent = content.replace(target.regex, target.replacement);
  
  if (content !== updatedContent) {
    fs.writeFileSync(target.path, updatedContent);
    console.log(`Updated ${target.name}`);
    return true;
  }
  return false;
};

// --- MAIN EXECUTION ---

console.log(`Bumping version to v${newVersion}...`);

// 1. Update Configuration Files
const changedPaths = [];
targets.forEach((target) => {
  if (updateFile(target)) {
    changedPaths.push(target.path);
  }
});

// 2. Always include CHANGELOG.md if it exists
const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  changedPaths.push(changelogPath);
}

// 3. Git Automation
// We proceed even if only CHANGELOG changed, or only Config changed.
if (changedPaths.length > 0) {
  try {
    console.log('Staging changes...');
    const filesToAdd = changedPaths.map(p => `"${p}"`).join(' ');
    run(`git add ${filesToAdd}`);

    console.log('Committing...');
    let commitMsg = `bump version to v${newVersion}`;
    if (commitDescription) {
      commitMsg += ` - ${commitDescription}`;
    }
    
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

    console.log('Tagging...');
    try {
      run(`git tag v${newVersion}`);
    } catch (e) {
      console.warn('Tag creation failed (Tag might already exist). Continuing...');
    }

    console.log('\nSUCCESS! Version bumped, committed, and tagged.');
    console.log('Push now: git push && git push --tags');
  } catch (e) {
    console.error('Git operations failed.');
    process.exit(1);
  }
} else {
  console.log('No files were changed. Git commit skipped.');
}