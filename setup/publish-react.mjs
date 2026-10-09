import { cpSync, readdirSync } from 'node:fs';

// Keep the existing main/root GitHub Pages deployment and site storage origin.
// Editable React source stays in frontend; root HTML is the compiled output.
for (const entry of readdirSync('dist', { withFileTypes: true })) {
  if (entry.name === 'react-assets' || entry.name.endsWith('.html')) {
    cpSync(`dist/${entry.name}`, entry.name, { recursive: true });
  }
}
