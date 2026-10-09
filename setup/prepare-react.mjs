import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('frontend/public', { recursive: true });
for (const directory of ['Assets', 'styles', 'scripts']) {
  cpSync(directory, `frontend/public/${directory}`, { recursive: true });
}
