import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { BRAND, FPS, INTRO_SEC, OUTRO_SEC, RoleConfig } from './data';

const introFrames = Math.round(INTRO_SEC * FPS);
const outroFrames = Math.round(OUTRO_SEC * FPS);

/** Intro / outro branded card on a light background. */
const Card: React.FC<{ role: RoleConfig; kind: 'intro' | 'outro' }> = ({ role, kind }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const y = interpolate(appear, [0, 1], [28, 0]);
  const op = interpolate(appear, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${BRAND.bg} 0%, #ffffff 55%, ${BRAND.accent}22 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ transform: `translateY(${y}px)`, opacity: op, textAlign: 'center', maxWidth: 1300 }}>
        <Img src={staticFile('logo-header.png')} style={{ width: 360, height: 'auto', marginBottom: 44 }} />
        {kind === 'intro' ? (
          <>
            <div
              style={{
                display: 'inline-block',
                padding: '10px 26px',
                borderRadius: 999,
                background: BRAND.primary,
                color: '#fff',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 26,
              }}
            >
              {role.role}
            </div>
            <div style={{ fontSize: 58, fontWeight: 800, color: BRAND.textMain, lineHeight: 1.15 }}>
              {role.tagline}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 52, fontWeight: 800, color: BRAND.primary, marginBottom: 18 }}>
              CRM для салонов штор и ателье
            </div>
            <div style={{ fontSize: 30, fontWeight: 500, color: BRAND.textSecondary }}>
              Замеры · сделки · производство · аналитика — в одном месте
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Subtitle pill synced to evenly-spaced segments across the screen recording. */
const Captions: React.FC<{ captions: string[]; videoFrames: number }> = ({ captions, videoFrames }) => {
  const frame = useCurrentFrame();
  const seg = videoFrames / captions.length;
  const idx = Math.min(captions.length - 1, Math.floor(frame / seg));
  const local = frame - idx * seg;
  const fadeIn = interpolate(local, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [seg - 12, seg], [1, 0], { extrapolateLeft: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);
  const y = interpolate(fadeIn, [0, 1], [18, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70 }}>
      <div
        style={{
          opacity: op,
          transform: `translateY(${y}px)`,
          maxWidth: 1500,
          padding: '20px 40px',
          borderRadius: 20,
          background: 'rgba(15, 41, 25, 0.86)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          fontSize: 38,
          fontWeight: 700,
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          border: `1px solid ${BRAND.accent}55`,
        }}
      >
        {captions[idx]}
      </div>
    </AbsoluteFill>
  );
};

export const RoleDemo: React.FC<{ role: RoleConfig; videoDurationInFrames: number }> = ({
  role,
  videoDurationInFrames,
}) => {
  const videoFrames = videoDurationInFrames;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence durationInFrames={introFrames}>
        <Card role={role} kind="intro" />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={videoFrames}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(role.video)} />
          <Captions captions={role.captions} videoFrames={videoFrames} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={introFrames + videoFrames} durationInFrames={outroFrames}>
        <Card role={role} kind="outro" />
      </Sequence>
    </AbsoluteFill>
  );
};

export { introFrames, outroFrames };
