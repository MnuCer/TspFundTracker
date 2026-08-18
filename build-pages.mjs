import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve('/home/ubuntu/tsp-tracker-pwa');
const docsDir = resolve(projectRoot, 'docs');

console.log('Building client for GitHub Pages...');
execSync('pnpm run build', { cwd: projectRoot, stdio: 'inherit' });

console.log('Preparing docs/ output directory...');
rmSync(docsDir, { recursive: true, force: true });
cpSync(resolve(projectRoot, 'dist/public'), docsDir, { recursive: true });

// Ensure CNAME is copied to docs/
writeFileSync(resolve(docsDir, 'CNAME'), 'TSPFundTracker.com\n', 'utf8');

console.log('GitHub Pages static bundle ready in docs/.');
