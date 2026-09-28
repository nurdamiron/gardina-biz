import React from 'react';
import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { BRAND, FPS } from '../data';
import { CTA_TEXT, Lang, Scene, Script } from './scripts';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin', 'cyrillic', 'cyrillic-ext'] });

export const W = 1080;
export const H = 1920;
const DARK = BRAND.primaryDark;
const PAIN = '#fca5a5';

export const scriptFrames = (s: Script) => s.scenes.reduce((n, sc) => n + Math.round(sc.sec * FPS), 0);

/** "*word*" -> highlighted span. */
const Rich: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <>
    {text.split('*').map((part, i) => (i % 2 ? <span key={i} style={{ color }}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>))}
  </>
);

const useAppear = (delay = 0, dur = 16) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });
  return { op: p, y: interpolate(p, [0, 1], [40, 0]) };
};

const FadeOut: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

const Badge: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div style={{
    position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center',
  }}>
    <div style={{
      padding: '16px 34px', borderRadius: 999, fontSize: 34, fontWeight: 700,
      background: dark ? 'rgba(116,198,157,0.18)' : BRAND.primary, color: dark ? BRAND.accent : '#fff',
      border: dark ? `1px solid ${BRAND.accent}66` : 'none',
    }}>{text}</div>
  </div>
);

// ---------- scenes ----------

const Chat: React.FC<{ s: Extract<Scene, { kind: 'chat' }>; lang: Lang }> = ({ s, lang }) => {
  const head = useAppear(0);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #13261d 0%, ${DARK} 100%)`, padding: '300px 70px 0' }}>
      <div style={{ opacity: head.op, color: 'rgba(255,255,255,0.6)', fontSize: 34, fontWeight: 600, marginBottom: 50, textAlign: 'center' }}>
        {s.title[lang]}
      </div>
      {s.msgs.map((m, i) => {
        const d = 10 + i * 24;
        const p = spring({ frame: frame - d, fps: FPS, config: { damping: 18, mass: 0.6 } });
        const out = m.side !== 'in';
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start', marginBottom: 34,
            opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.92, 1])})`,
          }}>
            <div style={{
              maxWidth: 780, padding: '24px 32px', borderRadius: 34,
              borderBottomRightRadius: out ? 8 : 34, borderBottomLeftRadius: out ? 34 : 8,
              background: out ? '#1f4d3a' : '#ffffff', color: out ? '#fff' : BRAND.textMain,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: out ? BRAND.accent : BRAND.primary, marginBottom: 8 }}>{m.who[lang]}</div>
              <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.25 }}>{m.text[lang]}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Pain: React.FC<{ s: Extract<Scene, { kind: 'pain' }>; lang: Lang }> = ({ s, lang }) => {
  const a = useAppear(0, 18);
  return (
    <AbsoluteFill style={{ background: DARK, justifyContent: 'center', padding: '0 80px' }}>
      <div style={{ opacity: a.op, transform: `translateY(${a.y}px)`, color: '#fff', fontSize: 86, fontWeight: 800, lineHeight: 1.15 }}>
        <Rich text={s.text[lang]} color={PAIN} />
      </div>
    </AbsoluteFill>
  );
};

const PainList: React.FC<{ s: Extract<Scene, { kind: 'painList' }>; lang: Lang }> = ({ s, lang }) => {
  const frame = useCurrentFrame();
  const a = useAppear(0);
  return (
    <AbsoluteFill style={{ background: DARK, padding: '360px 80px 0' }}>
      <div style={{ opacity: a.op, color: BRAND.accent, fontSize: 60, fontWeight: 800, marginBottom: 60 }}>{s.title[lang]}</div>
      {s.items.map((it, i) => {
        const d = 12 + i * 18;
        const p = spring({ frame: frame - d, fps: FPS, config: { damping: 200 }, durationInFrames: 14 });
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 28, marginBottom: 44, opacity: p,
            transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: PAIN, flexShrink: 0 }} />
            <div style={{ color: '#fff', fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>{it[lang]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const LightBg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #ffffff 55%, #e2f1e9 100%)`, ...style }}>
    {children}
  </AbsoluteFill>
);

const Brand: React.FC<{ s: Extract<Scene, { kind: 'brand' }>; lang: Lang }> = ({ s, lang }) => {
  const a = useAppear(0, 20);
  const b = useAppear(10, 20);
  return (
    <LightBg style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
      <Img src={staticFile('logo-header.png')} style={{ width: 560, opacity: a.op, transform: `scale(${interpolate(a.op, [0, 1], [0.9, 1])})`, marginBottom: 70 }} />
      <div style={{ opacity: b.op, transform: `translateY(${b.y}px)`, fontSize: 80, fontWeight: 800, color: BRAND.textMain, textAlign: 'center', lineHeight: 1.15 }}>
        <Rich text={s.text[lang]} color={BRAND.primary} />
      </div>
    </LightBg>
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const a = useAppear(0);
  return (
    <div style={{
      position: 'absolute', top: 96, left: 60, right: 60, opacity: a.op, transform: `translateY(${a.y}px)`,
      fontSize: 58, fontWeight: 800, color: BRAND.textMain, lineHeight: 1.16, textAlign: 'center',
    }}>
      <Rich text={text} color={BRAND.primary} />
    </div>
  );
};

const Phone: React.FC<{ s: Extract<Scene, { kind: 'phone' }>; lang: Lang; frames: number }> = ({ s, lang, frames }) => {
  const frame = useCurrentFrame();
  const a = useAppear(4, 20);
  const pw = 680; // screen width inside the phone; screenshots are 860x1864 (430x932 @2x)
  const ph = Math.round(pw * (1864 / 860));
  const k = pw / 860;
  const z = interpolate(frame, [22, Math.min(frames - 8, 70)], [1, s.zoom ?? 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
  const imgW = pw * z;
  const imgH = 1864 * k * z;
  const fy = (s.focusY ?? 932) * k * z;
  const top = Math.min(0, Math.max(ph - imgH, ph / 2 - fy));
  return (
    <LightBg>
      <Caption text={s.caption[lang]} />
      <div style={{
        position: 'absolute', left: (W - pw - 32) / 2, top: 400, width: pw + 32, height: ph + 32, borderRadius: 70,
        background: '#0f1512', padding: 16, boxShadow: '0 40px 90px rgba(15,41,25,0.35)',
        opacity: a.op, transform: `translateY(${interpolate(a.op, [0, 1], [120, 0])}px)`,
      }}>
        <div style={{ width: pw, height: ph, borderRadius: 56, overflow: 'hidden', background: '#fff', position: 'relative' }}>
          <Img src={staticFile(s.img)} style={{ position: 'absolute', width: imgW, left: (pw - imgW) / 2, top }} />
        </div>
      </div>
    </LightBg>
  );
};

const List: React.FC<{ s: Extract<Scene, { kind: 'list' }>; lang: Lang }> = ({ s, lang }) => {
  const frame = useCurrentFrame();
  const a = useAppear(0);
  return (
    <LightBg style={{ padding: '260px 70px 0' }}>
      <div style={{ opacity: a.op, fontSize: 72, fontWeight: 800, color: BRAND.textMain, marginBottom: 60 }}>{s.title[lang]}</div>
      {s.items.map((it, i) => {
        const p = spring({ frame: frame - (10 + i * 14), fps: FPS, config: { damping: 200 }, durationInFrames: 14 });
        return (
          <div key={i} style={{
            opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`, marginBottom: 30,
            background: '#fff', borderRadius: 30, padding: '30px 36px', boxShadow: '0 12px 30px rgba(15,41,25,0.08)',
            border: `1px solid ${BRAND.accent}44`,
          }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: BRAND.primary }}>{it.who[lang]}</div>
            <div style={{ fontSize: 42, fontWeight: 600, color: BRAND.textSecondary, marginTop: 6 }}>{it.what[lang]}</div>
          </div>
        );
      })}
    </LightBg>
  );
};

const Result: React.FC<{ s: Extract<Scene, { kind: 'result' }>; lang: Lang }> = ({ s, lang }) => {
  const a = useAppear(0, 18);
  const c = useAppear(6, 18);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${BRAND.primary} 0%, ${DARK} 100%)`, justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
      <div style={{
        width: 170, height: 170, borderRadius: 999, background: BRAND.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${a.op})`, marginBottom: 70,
      }}>
        <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
      </div>
      <div style={{ opacity: c.op, transform: `translateY(${c.y}px)`, fontSize: 78, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.18 }}>
        <Rich text={s.text[lang]} color={BRAND.accent} />
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ lang: Lang }> = ({ lang }) => {
  const c = CTA_TEXT[lang];
  const a = useAppear(0, 20);
  const b = useAppear(10, 20);
  return (
    <LightBg style={{ justifyContent: 'center', alignItems: 'center', padding: '0 70px', textAlign: 'center' }}>
      <Img src={staticFile('logo-header.png')} style={{ width: 480, opacity: a.op, marginBottom: 40 }} />
      <div style={{ opacity: a.op, fontSize: 52, fontWeight: 800, color: BRAND.textMain, lineHeight: 1.2, marginBottom: 60 }}>{c.title}</div>
      <div style={{ opacity: b.op, transform: `translateY(${b.y}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
        <div style={{ padding: '26px 46px', borderRadius: 999, background: BRAND.primary, color: '#fff', fontSize: 50, fontWeight: 800 }}>{c.offer}</div>
        <div style={{ fontSize: 44, fontWeight: 600, color: BRAND.textSecondary }}>{c.price}</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: BRAND.primary, marginTop: 30 }}>{c.site}</div>
        <div style={{ fontSize: 44, fontWeight: 700, color: BRAND.textMain }}>{c.wa}</div>
      </div>
    </LightBg>
  );
};

// ---------- composition ----------

export const Promo: React.FC<{ script: Script; lang: Lang }> = ({ script, lang }) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: '#000', fontFamily }}>
      {script.scenes.map((s, i) => {
        const frames = Math.round(s.sec * FPS);
        const start = from;
        from += frames;
        const dark = s.kind === 'chat' || s.kind === 'pain' || s.kind === 'painList' || s.kind === 'result';
        return (
          <Sequence key={i} from={start} durationInFrames={frames}>
            <FadeOut frames={frames}>
              {s.kind === 'chat' && <Chat s={s} lang={lang} />}
              {s.kind === 'pain' && <Pain s={s} lang={lang} />}
              {s.kind === 'painList' && <PainList s={s} lang={lang} />}
              {s.kind === 'brand' && <Brand s={s} lang={lang} />}
              {s.kind === 'phone' && <Phone s={s} lang={lang} frames={frames} />}
              {s.kind === 'list' && <List s={s} lang={lang} />}
              {s.kind === 'result' && <Result s={s} lang={lang} />}
              {s.kind === 'cta' && <Cta lang={lang} />}
              {i === 0 && script.badge && <Badge text={script.badge[lang]} dark={dark} />}
            </FadeOut>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
