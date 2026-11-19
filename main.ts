/* Sunset Cover Studio — entrypoint.
   Copies app/ and screenshots/ from this repository into the output
   directory and writes /output/dossier.json with buildDossier from the
   kit library at vendor/makefun-app.ts. Node 22 standard library only.
   Run: MAKEFUN_OUTPUT_DIR=out node main.ts (defaults to /output). */

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

/* Start from an empty output directory so both runs write identical bytes.
   Only the entries inside are removed; the directory itself is never
   deleted, since in the grader it may be a mounted volume. */
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'app'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outDir, 'dossier.json'), { force: true });

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000
  })
);
