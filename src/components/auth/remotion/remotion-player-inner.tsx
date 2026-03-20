'use client';

import { Player } from '@remotion/player';
import { GuitarScene } from './guitar-scene';

const COMPOSITION_FPS = 30;
const COMPOSITION_DURATION_IN_FRAMES = 300;
const COMPOSITION_WIDTH = 1080;
const COMPOSITION_HEIGHT = 1080;

export default function RemotionPlayerInner() {
  return (
    <Player
      component={GuitarScene}
      compositionWidth={COMPOSITION_WIDTH}
      compositionHeight={COMPOSITION_HEIGHT}
      durationInFrames={COMPOSITION_DURATION_IN_FRAMES}
      fps={COMPOSITION_FPS}
      loop
      autoPlay
      controls={false}
      clickToPlay={false}
      acknowledgeRemotionLicense
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
      renderLoading={() => (
        <div style={{ width: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    />
  );
}
