import React from 'react';
import { Composition } from 'remotion';
import { RoleDemo, introFrames, outroFrames } from './RoleDemo';
import { ROLES, FPS } from './data';
import durations from './durations.json';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.values(ROLES).map((role) => {
        const sec = (durations as Record<string, number>)[role.id] ?? 30;
        const videoFrames = Math.round(sec * FPS);
        return (
          <Composition
            key={role.id}
            id={role.id}
            component={RoleDemo as any}
            durationInFrames={introFrames + videoFrames + outroFrames}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{ role, videoDurationInFrames: videoFrames }}
          />
        );
      })}
    </>
  );
};
