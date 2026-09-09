import { mkdir, writeFile } from "node:fs/promises";

const directory = new URL("../public/fonts/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const [family, name] of [["Manrope:wght@400;500;600;700;800", "manrope"], ["Noto+Sans+Thai:wght@400;500;600;700", "noto-thai"]]) {
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
  const css = await response.text();
  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!url) throw new Error(`Missing font for ${family}`);
  const font = await fetch(url);
  if (!font.ok) throw new Error(`Font: ${font.status}`);
  await writeFile(new URL(`${name}.ttf`, directory), Buffer.from(await font.arrayBuffer()));
  console.log(`Saved ${name}.ttf`);
}
