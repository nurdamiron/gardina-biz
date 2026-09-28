import React from 'react';
import { Composition } from 'remotion';
import { RoleDemo, introFrames, outroFrames } from './RoleDemo';
import { ROLES, FPS } from './data';
import durations from './durations.json';
import { Promo, scriptFrames, W, H } from './promo/Promo';
import { SCRIPTS } from './promo/scripts';

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
      {SCRIPTS.flatMap((script) =>
        (['ru', 'kz'] as const).map((lang) => (
          <Composition
            key={`${script.id}-${lang}`}
            id={`promo-${script.id}-${lang}`}
            component={Promo as any}
            durationInFrames={scriptFrames(script)}
            fps={FPS}
            width={W}
            height={H}
            defaultProps={{ script, lang }}
          />
        )),
      )}
    </>
  );
};
