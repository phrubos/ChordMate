import type { RecordingLoader } from '@/components/player/player-provider';

/** A few seconds of a soft A-minor arpeggio as a WAV blob — stands in for the server's audio. */
function toneUrl(seconds: number): string {
  const rate = 8000;
  const n = rate * seconds;
  const buf = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o: number, t: string) => [...t].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  buf.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVEfmt ');
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true);
  buf.setUint16(22, 1, true);
  buf.setUint32(24, rate, true);
  buf.setUint32(28, rate * 2, true);
  buf.setUint16(32, 2, true);
  buf.setUint16(34, 16, true);
  str(36, 'data');
  buf.setUint32(40, n * 2, true);
  const notes = [220, 261.63, 329.63, 440];
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const f = notes[Math.floor(t * 2) % notes.length];
    const env = Math.exp(-((t * 2) % 1) * 3);
    buf.setInt16(44 + i * 2, Math.sin(2 * Math.PI * f * t) * env * 6000, true);
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/** Dev showcase: every recording is a generated tone (r2 is short, to try the queue end). */
export const devRecordingLoader: RecordingLoader = async (id) => toneUrl(id === 'r2' ? 12 : 24);
