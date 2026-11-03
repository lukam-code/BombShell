import { ImageResponse } from 'next/og';
import { config } from '@/lib/config';

export const alt = `${config.name} – ${config.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Open Graph slika 1200×630 – generiše se u hodu. Zameni je fotografijom bara kad je imaš. */
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80,
        background: 'radial-gradient(circle at 20% 20%, #0f4a42 0%, #07090d 60%)', color: '#eef3f7' }}>
        <div style={{ fontSize: 28, letterSpacing: 10, color: '#22e6c3', textTransform: 'uppercase' }}>Bar · Koktli · Žurke</div>
        <div style={{ fontSize: 150, fontWeight: 800, marginTop: 20 }}>{config.name.toUpperCase()}</div>
        <div style={{ fontSize: 44, color: '#f4c76b', marginTop: 10 }}>{config.tagline}</div>
      </div>
    ),
    size,
  );
}
