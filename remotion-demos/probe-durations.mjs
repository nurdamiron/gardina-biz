import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';
import { writeFileSync } from 'node:fs';

const roles = ['designer', 'manager', 'sales', 'admin'];
const out = {};
for (const r of roles) {
  const res = await parseMedia({
    src: `public/videos/${r}.webm`,
    reader: nodeReader,
    fields: { slowDurationInSeconds: true, durationInSeconds: true },
    acknowledgeRemotionLicense: true,
  });
  const sec = res.durationInSeconds || res.slowDurationInSeconds;
  out[r] = Math.round(sec * 100) / 100;
  console.log(r, out[r]);
}
writeFileSync('src/durations.json', JSON.stringify(out, null, 2) + '\n');
console.log('wrote src/durations.json');
