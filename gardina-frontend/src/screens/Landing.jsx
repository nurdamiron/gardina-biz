import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import Icon from '../components/common/Icon';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useI18n } from '../contexts/I18nContext';

// ─── Animation primitives ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// ─── Header with scroll-triggered styling ───────────────────────────────────
function LandingHeader() {
  const { t } = useI18n();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 24));
  }, [scrollY]);

  const links = [
    { href: '#problems', label: t('landing.nav.problems') },
    { href: '#features', label: t('landing.nav.features') },
    { href: '#modules', label: t('landing.nav.modules') },
    { href: '#compare', label: t('landing.nav.compare') },
    { href: '#pricing', label: t('landing.nav.pricing') },
    { href: '#faq', label: t('landing.nav.faq') },
  ];

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/85 backdrop-blur-md shadow-sm border-b border-border-light/60' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/images/logo-header.png" alt="Gardina" className="h-9 sm:h-10 w-auto" />
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            {t('landing.nav.login')}
          </Link>
          <a
            href="https://wa.me/77715373201"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-lg transition-colors shadow-lg shadow-primary/20"
          >
            {t('landing.nav.whatsapp')}
          </a>
        </div>
      </div>
    </motion.header>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  const { t } = useI18n();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const mockY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const mockOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);

  return (
    <section ref={heroRef} className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-20 -left-20 size-[420px] rounded-full bg-primary/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -top-10 right-0 size-[480px] rounded-full bg-accent/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center lg:text-left">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <Icon name="install_mobile" size={16} />
            {t('landing.hero.badge')}
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-main leading-[1.05] tracking-tight">
            {t('landing.hero.title1')}{' '}
            <span className="bg-gradient-to-br from-primary via-primary-light to-accent bg-clip-text text-transparent">
              {t('landing.hero.title2')}
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t('landing.hero.description')}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a
              href="https://cal.com/nurdaulet/gardina?overlayCalendar=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-base hover:brightness-110 active:scale-[0.99] shadow-xl shadow-primary/25 transition-all"
            >
              <Icon name="arrow_forward" size={20} />
              {t('landing.hero.ctaPrimary')}
            </a>
            <a
              href="https://wa.me/77715373201"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-primary/20 text-primary font-bold text-base hover:bg-primary/5 transition-all"
            >
              <Icon name="chat" size={20} />
              {t('landing.hero.ctaSecondary')}
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            {[
              { value: t('landing.hero.statsClients'), label: t('landing.hero.statsClientsHint') },
              { value: t('landing.hero.statsProposals'), label: t('landing.hero.statsProposalsHint') },
              { value: t('landing.hero.statsControl'), label: t('landing.hero.statsControlHint') },
            ].map((s) => (
              <div key={s.value} className="text-center lg:text-left">
                <div className="text-sm font-bold text-primary">{s.value}</div>
                <div className="text-xs text-text-secondary mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: mockY, opacity: mockOpacity }}
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light p-2 shadow-2xl shadow-primary/30">
            <div className="rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-400" />
                  <span className="size-2.5 rounded-full bg-yellow-400" />
                  <span className="size-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[11px] font-bold text-text-secondary">{t('landing.hero.mockTitle')}</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { type: 'line', w: 'w-full' },
                  { type: 'line', w: 'w-3/4' },
                  { type: 'accent', text: t('landing.hero.mockAccent') },
                  { type: 'line', w: 'w-5/6' },
                  { type: 'line', w: 'w-2/3' },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className={
                      row.type === 'accent'
                        ? 'px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary'
                        : `h-3 rounded-md bg-border-light ${row.w}`
                    }
                  >
                    {row.type === 'accent' ? row.text : null}
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  t('landing.hero.mockLabelLeads'),
                  t('landing.hero.mockLabelProposals'),
                  t('landing.hero.mockLabelDone'),
                ].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                    className="text-center px-2 py-2.5 rounded-lg bg-background-light"
                  >
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">{label}</div>
                    <div className="text-lg font-black text-primary mt-0.5">{[24, 11, 7][i]}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5, ease: 'easeOut' }}
            className="absolute -right-4 sm:-right-8 top-12 bg-white rounded-2xl shadow-2xl p-3 border border-border-light max-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-text-secondary">{t('landing.hero.pushTag')}</span>
            </div>
            <div className="text-xs font-bold text-text-main">{t('landing.hero.pushTitle')}</div>
            <div className="text-[11px] text-text-secondary leading-tight mt-0.5">{t('landing.hero.pushBody')}</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatNumber({ to, suffix = '' }) {
  const { lang } = useI18n();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionValue.set(to);
  }, [inView, motionValue, to]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(Math.round(v)));
  }, [spring]);

  const localeTag = lang === 'kz' ? 'kk-KZ' : 'ru-RU';
  return (
    <span ref={ref}>
      {display.toLocaleString(localeTag)}
      {suffix}
    </span>
  );
}

function StatsBand() {
  const { t } = useI18n();
  const stats = [
    { value: 60, suffix: '+', label: t('landing.stats.badge1') },
    { value: 4, suffix: '', labelOverride: t('landing.stats.label2'), label: t('landing.stats.badge2') },
    { value: 2, suffix: '', labelOverride: t('landing.stats.label3'), label: t('landing.stats.badge3') },
    { value: 100, suffix: '%', label: t('landing.stats.badge4') },
  ];

  return (
    <section className="py-12 sm:py-16 border-y border-border-light/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {s.labelOverride ? (
                s.labelOverride
              ) : (
                <StatNumber to={s.value} suffix={s.suffix} />
              )}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary mt-1.5 font-medium leading-snug">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ badge, badgeIcon, title, subtitle }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={stagger}
      className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
    >
      <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide mb-4">
        {badgeIcon && <Icon name={badgeIcon} size={14} />}
        {badge}
      </motion.div>
      <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-main tracking-tight">
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

function Problems() {
  const { t } = useI18n();
  const items = [
    { keyId: 'item1', icon: 'person_search' },
    { keyId: 'item2', icon: 'groups' },
    { keyId: 'item3', icon: 'payments' },
  ];

  return (
    <section id="problems" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.problems.badge')}
          badgeIcon="error"
          title={t('landing.problems.title')}
          subtitle={t('landing.problems.subtitle')}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {items.map((it) => (
            <motion.article
              key={it.keyId}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="rounded-3xl bg-white p-7 border border-border-light/80 shadow-card hover:shadow-lg"
            >
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <Icon name={it.icon} size={24} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-1.5">
                {t('landing.problems.labelProblem')}
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2 leading-tight">
                {t(`landing.problems.${it.keyId}Problem`)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                {t(`landing.problems.${it.keyId}Pain`)}
              </p>
              <div className="text-[10px] font-black uppercase tracking-wider text-primary mb-1.5">
                {t('landing.problems.labelSolution')}
              </div>
              <p className="text-sm text-text-main leading-relaxed font-medium">
                {t(`landing.problems.${it.keyId}Solution`)}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PhoneDemo() {
  const { t } = useI18n();
  const screens = [
    {
      time: '09:42',
      title: t('landing.phoneDemo.step1Title'),
      step: t('landing.phoneDemo.step1Body'),
      cards: [
        {
          tag: t('landing.phoneDemo.s1Card1Tag'),
          when: t('landing.phoneDemo.s1Card1Time'),
          heading: t('landing.phoneDemo.s1Card1Heading'),
          body: t('landing.phoneDemo.s1Card1Body'),
        },
        {
          tag: t('landing.phoneDemo.s1Card2Tag'),
          when: t('landing.phoneDemo.s1Card2Time'),
          body: t('landing.phoneDemo.s1Card2Body'),
          muted: true,
        },
      ],
    },
    {
      time: '11:10',
      title: t('landing.phoneDemo.step2Title'),
      step: t('landing.phoneDemo.step2Body'),
      cards: [
        {
          tag: t('landing.phoneDemo.s2Card1Tag'),
          when: t('landing.phoneDemo.s2Card1Time'),
          heading: t('landing.phoneDemo.s2Card1Heading'),
          body: t('landing.phoneDemo.s2Card1Body'),
        },
        {
          tag: t('landing.phoneDemo.s2Card2Tag'),
          when: t('landing.phoneDemo.s2Card2Time'),
          body: t('landing.phoneDemo.s2Card2Body'),
          muted: true,
        },
      ],
    },
    {
      time: '17:26',
      title: t('landing.phoneDemo.step3Title'),
      step: t('landing.phoneDemo.step3Body'),
      cards: [
        {
          tag: t('landing.phoneDemo.s3Card1Tag'),
          when: t('landing.phoneDemo.s3Card1Time'),
          heading: t('landing.phoneDemo.s3Card1Heading'),
          body: t('landing.phoneDemo.s3Card1Body'),
        },
        {
          tag: t('landing.phoneDemo.s3Card2Tag'),
          when: t('landing.phoneDemo.s3Card2Time'),
          body: t('landing.phoneDemo.s3Card2Body'),
          muted: true,
        },
      ],
    },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % screens.length), 4500);
    return () => clearInterval(id);
  }, [screens.length]);

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-background-light to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.phoneDemo.badge')}
          badgeIcon="install_mobile"
          title={t('landing.phoneDemo.title')}
          subtitle={t('landing.phoneDemo.subtitle')}
        />

        <div className="grid lg:grid-cols-[auto_1fr] gap-12 items-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto"
          >
            <div className="relative w-[280px] h-[560px] rounded-[3rem] bg-gradient-to-b from-gray-900 to-black p-3 shadow-2xl shadow-primary/20">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
              <div className="relative w-full h-full rounded-[2.4rem] bg-white overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0 px-4 pt-10 pb-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <strong className="text-sm font-bold text-text-main">
                        {t('landing.phoneDemo.todayHeading')}
                      </strong>
                      <span className="text-xs text-text-secondary">{screens[active].time}</span>
                    </div>
                    <div className="space-y-3">
                      {screens[active].cards.map((c, i) => (
                        <motion.article
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.1 }}
                          className={`p-3 rounded-2xl border ${
                            c.muted ? 'bg-background-light border-border-light/70' : 'bg-white border-primary/30 shadow-sm shadow-primary/10'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-1">
                            <span>{c.tag}</span>
                            <span>{c.when}</span>
                          </div>
                          {c.heading && <h4 className="text-sm font-bold text-text-main mb-1">{c.heading}</h4>}
                          <p className="text-xs text-text-secondary leading-snug">{c.body}</p>
                        </motion.article>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3">
            {screens.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  active === i ? 'bg-primary text-white border-primary shadow-xl shadow-primary/25' : 'bg-white border-border-light/80 hover:border-primary/30'
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className={`text-xs font-black tabular-nums ${active === i ? 'text-white/70' : 'text-primary/60'}`}>
                    0{i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-bold mb-1 ${active === i ? 'text-white' : 'text-text-main'}`}>{s.title}</h3>
                    <p className={`text-sm leading-relaxed ${active === i ? 'text-white/85' : 'text-text-secondary'}`}>{s.step}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  const items = [
    { icon: 'groups', keyId: 'f1' },
    { icon: 'straighten', keyId: 'f2' },
    { icon: 'receipt_long', keyId: 'f3' },
    { icon: 'precision_manufacturing', keyId: 'f4' },
    { icon: 'payments', keyId: 'f5' },
    { icon: 'badge', keyId: 'f6' },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.features.badge')}
          badgeIcon="check_circle"
          title={t('landing.features.title')}
          subtitle={t('landing.features.subtitle')}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {items.map((f) => (
            <motion.div
              key={f.keyId}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-4">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="font-bold text-text-main mb-1.5">{t(`landing.features.${f.keyId}Title`)}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{t(`landing.features.${f.keyId}Body`)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Modules() {
  const { t } = useI18n();
  const items = [
    { icon: 'person_search', keyId: 'm1' },
    { icon: 'photo_camera', keyId: 'm2' },
    { icon: 'inventory', keyId: 'm3' },
    { icon: 'notifications', keyId: 'm4' },
    { icon: 'analytics', keyId: 'm5' },
    { icon: 'lock', keyId: 'm6' },
  ];

  return (
    <section id="modules" className="py-20 sm:py-28 bg-gradient-to-b from-white to-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.modules.badge')}
          badgeIcon="dashboard"
          title={t('landing.modules.title')}
          subtitle={t('landing.modules.subtitle')}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {items.map((m) => (
            <motion.div
              key={m.keyId}
              variants={fadeUp}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white p-6 border border-border-light/80 flex gap-4 items-start"
            >
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name={m.icon} size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-main mb-1">{t(`landing.modules.${m.keyId}Title`)}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{t(`landing.modules.${m.keyId}Body`)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Comparison() {
  const { t } = useI18n();
  const rows = [
    { keyId: 'rowVertical', gardina: true, amocrm: false, bitrix: false },
    { keyId: 'rowFabric', gardina: true, amocrm: false, bitrix: false },
    { keyId: 'rowPhotos', gardina: true, amocrm: false, bitrix: 'partial' },
    { keyId: 'rowRoles', gardina: true, amocrm: 'partial', bitrix: true },
    { keyId: 'rowKzUi', gardina: true, amocrm: 'partial', bitrix: 'partial' },
    { keyId: 'rowPwa', gardina: true, amocrm: true, bitrix: true },
    { keyId: 'rowPrice', gardina: '15 000 ₸', amocrm: '36 000 ₸', bitrix: '22 700 ₸' },
  ];

  const cellIcon = (v) => {
    if (v === true) return <Icon name="check_circle" size={20} className="text-primary mx-auto" />;
    if (v === false) return <Icon name="close" size={20} className="text-text-secondary/40 mx-auto" />;
    if (v === 'partial')
      return <span className="inline-block size-4 rounded-full bg-amber-400 mx-auto" title={t('landing.compare.valuePartial')} />;
    return <span className="text-sm font-bold text-text-main">{v}</span>;
  };

  return (
    <section id="compare" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.compare.badge')}
          badgeIcon="bar_chart"
          title={t('landing.compare.title')}
          subtitle={t('landing.compare.subtitle')}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-white border border-border-light/70 overflow-hidden shadow-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light/70 bg-background-light">
                  <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">
                    {t('landing.compare.colFeature')}
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider">
                    <span className="text-primary">Gardina</span>
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">AmoCRM</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">Битрикс24</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.keyId}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="border-b border-border-light/40 last:border-0"
                  >
                    <td className="px-5 py-4 text-sm text-text-main font-medium">{t(`landing.compare.${r.keyId}`)}</td>
                    <td className="px-5 py-4 text-center bg-primary/5">{cellIcon(r.gardina)}</td>
                    <td className="px-5 py-4 text-center">{cellIcon(r.amocrm)}</td>
                    <td className="px-5 py-4 text-center">{cellIcon(r.bitrix)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="text-center text-xs text-text-secondary mt-4">{t('landing.compare.note')}</p>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useI18n();
  const items = [0, 1, 2, 3].map((i) => ({
    name: t(`landing.testimonials.items.${i}.name`),
    role: t(`landing.testimonials.items.${i}.role`),
    quote: t(`landing.testimonials.items.${i}.quote`),
  }));
  const doubled = [...items, ...items];

  return (
    <section className="py-20 sm:py-24 overflow-hidden bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.testimonials.badge')}
          badgeIcon="star"
          title={t('landing.testimonials.title')}
          subtitle={t('landing.testimonials.subtitle')}
        />
      </div>

      <motion.div
        className="flex gap-5"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((tItem, i) => (
          <article
            key={i}
            className="shrink-0 w-[320px] sm:w-[380px] rounded-2xl bg-white p-6 border border-border-light/70 shadow-card"
          >
            <div className="flex items-center gap-1 mb-3 text-amber-400">
              {[...Array(5)].map((_, k) => (
                <Icon key={k} name="star" size={16} />
              ))}
            </div>
            <p className="text-sm text-text-main leading-relaxed mb-5">{tItem.quote}</p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {tItem.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-text-main">{tItem.name}</div>
                <div className="text-xs text-text-secondary">{tItem.role}</div>
              </div>
            </div>
          </article>
        ))}
      </motion.div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      keyId: 'start',
      monthly: '15 000',
      yearly: '150 000',
      featuresCount: 4,
      highlighted: false,
    },
    {
      keyId: 'pro',
      monthly: '35 000',
      yearly: '350 000',
      featuresCount: 5,
      highlighted: true,
    },
    {
      keyId: 'network',
      monthly: '60 000',
      yearly: '600 000',
      featuresCount: 4,
      suffix: ' +',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.pricing.badge')}
          badgeIcon="store"
          title={t('landing.pricing.title')}
          subtitle={t('landing.pricing.subtitle')}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          className="flex justify-center mb-10"
        >
          <div className="relative inline-flex items-center bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setYearly(false)}
              className={`relative z-10 px-5 py-2 text-sm font-bold rounded-xl transition-colors ${!yearly ? 'text-primary' : 'text-text-secondary'}`}
            >
              {t('landing.pricing.monthly')}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`relative z-10 px-5 py-2 text-sm font-bold rounded-xl transition-colors ${yearly ? 'text-primary' : 'text-text-secondary'}`}
            >
              {t('landing.pricing.yearly')}
            </button>
            <motion.span
              className="absolute top-1 bottom-1 bg-white rounded-xl shadow ring-1 ring-black/5"
              animate={{ left: yearly ? 'calc(50% + 4px)' : '4px', width: 'calc(50% - 8px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </div>
          {yearly && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-3 self-center text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full"
            >
              {t('landing.pricing.bonus')}
            </motion.span>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {plans.map((p) => (
            <motion.article
              key={p.keyId}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-7 border ${
                p.highlighted
                  ? 'bg-gradient-to-br from-primary to-primary-light text-white border-primary shadow-2xl shadow-primary/30 md:-mt-3 md:mb-3'
                  : 'bg-white border-border-light/80 shadow-card'
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-primary-dark text-[10px] font-black uppercase tracking-wider">
                  {t('landing.pricing.recommended')}
                </div>
              )}
              <h3 className={`text-xl font-bold ${p.highlighted ? 'text-white' : 'text-text-main'}`}>
                {t(`landing.pricing.plans.${p.keyId}.name`)}
              </h3>
              <p className={`text-sm mt-1 ${p.highlighted ? 'text-white/80' : 'text-text-secondary'}`}>
                {t(`landing.pricing.plans.${p.keyId}.audience`)}
              </p>

              <div className="mt-6 mb-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={yearly ? 'y' : 'm'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`text-3xl sm:text-4xl font-black ${p.highlighted ? 'text-white' : 'text-text-main'}`}
                  >
                    {(yearly ? p.yearly : p.monthly)}
                    {p.suffix || ''} ₸
                  </motion.span>
                </AnimatePresence>
                <span className={`text-sm ml-1 ${p.highlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                  {yearly ? t('landing.pricing.period_year') : t('landing.pricing.period_month')}
                </span>
              </div>

              <ul className="mt-6 space-y-2.5">
                {Array.from({ length: p.featuresCount }, (_, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <Icon
                      name="check_circle"
                      size={18}
                      className={`shrink-0 mt-0.5 ${p.highlighted ? 'text-accent' : 'text-primary'}`}
                    />
                    <span className={`text-sm leading-relaxed ${p.highlighted ? 'text-white/95' : 'text-text-main'}`}>
                      {t(`landing.pricing.plans.${p.keyId}.f${i + 1}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="https://cal.com/nurdaulet/gardina?overlayCalendar=true"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-7 block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                  p.highlighted
                    ? 'bg-white text-primary hover:bg-accent'
                    : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {t(`landing.pricing.plans.${p.keyId}.cta`)}
              </a>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useI18n();
  const ids = [0, 1, 2, 3, 4, 5];
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-gradient-to-b from-background-light to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.faq.badge')}
          badgeIcon="help"
          title={t('landing.faq.title')}
          subtitle={t('landing.faq.subtitle')}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="space-y-3"
        >
          {ids.map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-2xl bg-white border border-border-light/70 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-background-light transition-colors"
              >
                <span className="font-bold text-text-main">{t(`landing.faq.items.${i}.q`)}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`size-8 rounded-full flex items-center justify-center ${open === i ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
                >
                  <Icon name="add" size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                      {t(`landing.faq.items.${i}.a`)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Process() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.process.badge')}
          badgeIcon="arrow_forward"
          title={t('landing.process.title')}
          subtitle={t('landing.process.subtitle')}
        />

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {steps.map((n, i) => (
            <motion.li key={n} variants={fadeUp} className="relative">
              <div className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card h-full">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-black text-lg mb-4">
                  {n}
                </div>
                <h3 className="font-bold text-text-main mb-1.5">{t(`landing.process.s${n}Title`)}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{t(`landing.process.s${n}Body`)}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 z-10 text-primary/40">
                  <Icon name="arrow_forward" size={24} />
                </div>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light p-10 sm:p-14 text-center overflow-hidden"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 size-72 bg-accent/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-24 -left-24 size-72 bg-white/10 rounded-full blur-3xl"
          />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto">
              {t('landing.cta.subtitle')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://cal.com/nurdaulet/gardina?overlayCalendar=true"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-accent transition-all"
              >
                <Icon name="arrow_forward" size={20} />
                {t('landing.cta.primary')}
              </a>
              <a
                href="https://wa.me/77715373201"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Icon name="chat" size={20} />
                {t('landing.cta.whatsapp')}
              </a>
              <a
                href="tel:+77715373201"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white/90 font-bold hover:text-white transition-all"
              >
                <Icon name="phone" size={20} />
                {t('landing.cta.phone')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-primary-dark text-white/85 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <img src="/images/logo-header.png" alt="Gardina" className="h-30 w-auto mb-4 brightness-0 invert" />
          <p className="text-sm leading-relaxed text-white/70">{t('landing.footer.description')}</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">{t('landing.footer.nav')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#problems" className="hover:text-white">{t('landing.nav.problems')}</a></li>
            <li><a href="#features" className="hover:text-white">{t('landing.nav.features')}</a></li>
            <li><a href="#modules" className="hover:text-white">{t('landing.nav.modules')}</a></li>
            <li><a href="#pricing" className="hover:text-white">{t('landing.nav.pricing')}</a></li>
            <li><a href="#faq" className="hover:text-white">{t('landing.nav.faq')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">{t('landing.footer.extra')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">{t('landing.footer.login')}</Link></li>
            <li><a href="mailto:info@gardina.kz" className="hover:text-white">{t('landing.footer.helpEmail')}</a></li>
            <li><a href="https://wa.me/77715373201" target="_blank" rel="noreferrer" className="hover:text-white">{t('landing.footer.whatsapp')}</a></li>
            <li><a href="/terms.html" className="hover:text-white">{t('landing.footer.terms')}</a></li>
            <li><a href="/privacy.html" className="hover:text-white">{t('landing.footer.privacy')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">{t('landing.footer.contact')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="tel:+77715373201" className="hover:text-white">+7 771 537 3201</a></li>
            <li><a href="mailto:info@gardina.kz" className="hover:text-white">info@gardina.kz</a></li>
            <li>{t('landing.footer.address')}</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between text-xs text-white/60 gap-2">
        <span>{t('landing.footer.copy')}</span>
        <span>{t('landing.footer.by')}<a href="https://aqulas.me" className="hover:text-white">Aqulas</a></span>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  return (
    <motion.a
      href="https://wa.me/77715373201"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="WhatsApp"
      className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/40"
    >
      <Icon name="chat" size={26} />
    </motion.a>
  );
}

export default function Landing() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="bg-background-light text-text-main overflow-x-hidden">
      <LandingHeader />
      <main>
        <Hero />
        <StatsBand />
        <Problems />
        <PhoneDemo />
        <Features />
        <Modules />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Process />
        <CTA />
      </main>
      <LandingFooter />
      <FloatingWhatsApp />
    </div>
  );
}
