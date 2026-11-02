import fs from 'fs';
import path from 'path';

const isReset = process.argv.includes('--reset');
const outPath = path.join(process.cwd(), 'src/game/offlineBundle.ts');

function makeTsContent(base64Str) {
  return `// Auto-generated standalone offline bundle
export const OFFLINE_HTML_BASE64 = "${base64Str}";

export function downloadOfflineGame(filename = "tiny-realm.html") {
  try {
    let blob: Blob;
    if (OFFLINE_HTML_BASE64 && OFFLINE_HTML_BASE64.length > 0) {
      const binaryStr = atob(OFFLINE_HTML_BASE64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: "text/html;charset=utf-8" });
    } else {
      const fullHtml = "<!doctype html>\\n" + document.documentElement.outerHTML;
      blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (err) {
    console.error("Failed to download offline bundle:", err);
  }
}
`;
}

if (isReset) {
  fs.writeFileSync(outPath, makeTsContent(""), 'utf-8');
  console.log('Reset src/game/offlineBundle.ts for clean singlefile build');
  process.exit(0);
}

const htmlPath = path.join(process.cwd(), 'dist-singlefile/index.html');
if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const base64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
  fs.writeFileSync(outPath, makeTsContent(base64), 'utf-8');
  console.log('Successfully generated src/game/offlineBundle.ts');
} else {
  console.error('dist-singlefile/index.html not found');
}
