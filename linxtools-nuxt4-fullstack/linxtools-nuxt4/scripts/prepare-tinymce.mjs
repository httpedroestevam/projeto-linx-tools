import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = [
  {
    source: resolve(
      projectRoot,
      "node_modules/tinymce/plugins/help/js/i18n/keynav/en.js",
    ),
    destination: resolve(
      projectRoot,
      "public/tinymce/plugins/help/js/i18n/keynav/en.js",
    ),
  },
  {
    source: resolve(
      projectRoot,
      "node_modules/tinymce/plugins/help/js/i18n/keynav/pt-BR.js",
    ),
    destination: resolve(
      projectRoot,
      "public/tinymce/plugins/help/js/i18n/keynav/pt-BR.js",
    ),
  },
  {
    source: resolve(projectRoot, "node_modules/tinymce-i18n/langs8/pt-BR.js"),
    destination: resolve(projectRoot, "public/tinymce/langs/pt-BR.js"),
  },
];

for (const asset of assets) {
  await mkdir(dirname(asset.destination), { recursive: true });
  await copyFile(asset.source, asset.destination);
}
