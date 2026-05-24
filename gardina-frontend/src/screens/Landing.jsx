import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
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

const BookingCtx = createContext(null);

// ─── Request Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', phone: '', salon: '', comment: '' };

function RequestModal({ open, onClose }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); setErrors({}); setSubmitted(false); setTab('form'); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = t('landing.booking.required');
    if (!form.phone.trim()) errs.phone = t('landing.booking.required');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const lines = [
      '🌿 Новая заявка с сайта Gardina!',
      `Имя: ${form.name}`,
      `Телефон: ${form.phone}`,
      form.salon ? `Салон: ${form.salon}` : null,
      form.comment ? `Комментарий: ${form.comment}` : null,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/77079429827?text=${encodeURIComponent(lines)}`, '_blank');
    setSubmitted(true);
  };

  const inputCls = (key) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
      errors[key]
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
        : 'border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white'
    }`;

  const isCalTab = tab === 'calendar';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isCalTab ? 'max-w-2xl' : 'max-w-lg'}`}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors z-10"
            >
              <Icon name="close" size={18} className="text-white" />
            </button>

            <div className="bg-gradient-to-br from-primary-dark via-primary to-primary-light px-7 pt-7 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4">
                <Icon name="edit_note" size={14} />
                Gardina
              </div>

              <div className="flex gap-1 bg-white/10 rounded-2xl p-1">
                <button
                  onClick={() => setTab('form')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    tab === 'form' ? 'bg-white text-primary shadow' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Icon name="edit_note" size={16} />
                  {t('landing.booking.tabForm')}
                </button>
                <button
                  onClick={() => setTab('calendar')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    tab === 'calendar' ? 'bg-white text-primary shadow' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Icon name="calendar_month" size={16} />
                  {t('landing.booking.tabCalendar')}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="px-7 py-6"
                >
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center text-center py-6 gap-4"
                    >
                      <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                        <Icon name="check_circle" size={32} className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-text-main text-lg">{t('landing.booking.successTitle')}</p>
                        <p className="text-sm text-text-secondary mt-1">{t('landing.booking.successBody')}</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all"
                      >
                        OK
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1.5">
                            {t('landing.booking.name')} <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={form.name}
                            onChange={set('name')}
                            placeholder={t('landing.booking.namePlaceholder')}
                            className={inputCls('name')}
                          />
                          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1.5">
                            {t('landing.booking.phone')} <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={form.phone}
                            onChange={set('phone')}
                            placeholder={t('landing.booking.phonePlaceholder')}
                            type="tel"
                            className={inputCls('phone')}
                          />
                          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">
                          {t('landing.booking.salon')}
                        </label>
                        <input
                          value={form.salon}
                          onChange={set('salon')}
                          placeholder={t('landing.booking.salonPlaceholder')}
                          className={inputCls('salon')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">
                          {t('landing.booking.comment')}
                        </label>
                        <textarea
                          value={form.comment}
                          onChange={set('comment')}
                          placeholder={t('landing.booking.commentPlaceholder')}
                          rows={3}
                          className={`${inputCls('comment')} resize-none`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                      >
                        <Icon name="send" size={18} />
                        {t('landing.booking.submit')}
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <iframe
                    src="https://cal.com/nurdaulet/gardina?embed=true&layout=month_view"
                    title={t('landing.booking.calTitle')}
                    className="w-full border-0"
                    style={{ height: '620px' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
          <img src="/images/logo-header.png" alt="Gardina" className="h-18 sm:h-20 w-auto" />
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
            href="https://wa.me/77079429827"
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
  const openBooking = useContext(BookingCtx);
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
            <button
              onClick={openBooking}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-base hover:brightness-110 active:scale-[0.99] shadow-xl shadow-primary/25 transition-all"
            >
              <Icon name="edit_note" size={20} />
              {t('landing.hero.ctaPrimary')}
            </button>
            <a
              href="https://wa.me/77079429827"
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

  const problemDemos = [
    // item1 — leads getting lost
    <div key="d1" className="mt-5 space-y-2">
      <div className="rounded-xl bg-red-50 border border-red-100 p-3">
        <p className="text-[9px] font-black uppercase text-red-400 mb-2 tracking-wider">Сейчас</p>
        {['Алмас — звонил, не записан', 'Айгуль — что-то хотела...', 'Неизвестный клиент ❓'].map((l, i) => (
          <p key={i} className="text-[10px] text-red-600 flex items-center gap-1.5 mb-1">
            <span className="size-3.5 rounded bg-red-200 flex items-center justify-center shrink-0 text-[8px] text-red-500 font-bold">?</span>
            {l}
          </p>
        ))}
      </div>
      <div className="rounded-xl bg-green-50 border border-green-100 p-3">
        <p className="text-[9px] font-black uppercase text-green-600 mb-2 tracking-wider">С Gardina</p>
        {[
          { init: 'АК', name: 'Айгуль К.', status: 'Замер', cls: 'bg-amber-100 text-amber-700' },
          { init: 'ДО', name: 'Дамир О.', status: 'В пошиве', cls: 'bg-blue-100 text-blue-700' },
          { init: 'АС', name: 'Аружан С.', status: 'Монтаж', cls: 'bg-orange-100 text-orange-700' },
        ].map((c) => (
          <div key={c.init} className="flex items-center gap-1.5 mb-1">
            <div className="size-5 rounded bg-primary/15 text-primary text-[8px] font-black flex items-center justify-center shrink-0">{c.init}</div>
            <span className="text-[10px] text-text-main font-medium flex-1">{c.name}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${c.cls}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>,

    // item2 — information scattered
    <div key="d2" className="mt-5 space-y-2">
      <div className="rounded-xl bg-red-50 border border-red-100 p-3">
        <p className="text-[9px] font-black uppercase text-red-400 mb-2 tracking-wider">Сейчас</p>
        <div className="flex gap-1.5">
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-2">
            <p className="text-[8px] font-bold text-amber-700 mb-0.5">WhatsApp</p>
            <p className="text-[9px] text-amber-600">"2.4м × 3 окна"</p>
          </div>
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-[8px] font-bold text-blue-700 mb-0.5">Блокнот</p>
            <p className="text-[9px] text-blue-600">"Портьера"</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-green-50 border border-green-100 p-3">
        <p className="text-[9px] font-black uppercase text-green-600 mb-2 tracking-wider">С Gardina</p>
        <div className="bg-white rounded-lg p-2.5 border border-green-100 shadow-sm">
          <p className="text-[10px] font-bold text-text-main mb-1.5">Заказ #142 · Айгуль К.</p>
          <div className="flex gap-2 text-[9px] text-text-secondary">
            <span className="flex items-center gap-0.5"><Icon name="straighten" size={9} />2.4м × 3</span>
            <span className="flex items-center gap-0.5"><Icon name="texture" size={9} />Портьера</span>
            <span className="flex items-center gap-0.5"><Icon name="photo_camera" size={9} />2 фото</span>
          </div>
        </div>
      </div>
    </div>,

    // item3 — payments unclear
    <div key="d3" className="mt-5 space-y-2">
      <div className="rounded-xl bg-red-50 border border-red-100 p-3">
        <p className="text-[9px] font-black uppercase text-red-400 mb-2 tracking-wider">Сейчас</p>
        <p className="text-[10px] text-red-600 flex items-center gap-1.5 mb-1">
          <Icon name="help" size={11} className="text-red-400 shrink-0" />Кто оплатил полностью?
        </p>
        <p className="text-[10px] text-red-500 flex items-center gap-1.5">
          <Icon name="help" size={11} className="text-red-300 shrink-0" />Кто задолжал аванс?
        </p>
      </div>
      <div className="rounded-xl bg-green-50 border border-green-100 p-3">
        <p className="text-[9px] font-black uppercase text-green-600 mb-2 tracking-wider">С Gardina</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary">Итого</span><span className="font-bold text-text-main">75 000 ₸</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary">Оплачено</span>
            <span className="font-bold text-green-600 flex items-center gap-0.5"><Icon name="check" size={9} />45 000 ₸</span>
          </div>
          <div className="h-1 rounded-full bg-gray-200 overflow-hidden mt-1">
            <motion.div initial={{ width: 0 }} whileInView={{ width: '60%' }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} className="h-full bg-green-500 rounded-full" />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary">Остаток</span><span className="font-bold text-amber-600">30 000 ₸</span>
          </div>
        </div>
      </div>
    </div>,
  ];

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
          {items.map((it, idx) => (
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
              <p className="text-sm text-text-secondary leading-relaxed">
                {t(`landing.problems.${it.keyId}Pain`)}
              </p>
              {problemDemos[idx]}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PhoneDemo() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  const steps = [
    { title: t('landing.phoneDemo.step1Title'), body: t('landing.phoneDemo.step1Body') },
    { title: t('landing.phoneDemo.step2Title'), body: t('landing.phoneDemo.step2Body') },
    { title: t('landing.phoneDemo.step3Title'), body: t('landing.phoneDemo.step3Body') },
  ];

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 4500);
    return () => clearInterval(id);
  }, [steps.length]);

  const PIPELINE = ['Заявка', 'Замер', 'КП', 'Пошив', 'Монтаж'];

  const StatusBar = ({ time }) => (
    <div className="flex justify-between px-5 pt-3 pb-1">
      <span className="text-[9px] font-bold text-text-secondary">{time}</span>
      <div className="flex gap-1 items-center">
        <Icon name="signal_cellular_alt" size={10} className="text-text-secondary" />
        <Icon name="battery_full" size={10} className="text-text-secondary" />
      </div>
    </div>
  );

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
              <div className="relative w-full h-full rounded-[2.4rem] bg-background-light overflow-hidden">
                <AnimatePresence mode="wait">
                  {active === 0 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                      <StatusBar time="09:42" />
                      <div className="flex items-center gap-2 px-4 pb-3">
                        <Icon name="arrow_back_ios" size={14} className="text-primary" />
                        <span className="text-sm font-bold text-text-main">Новая заявка</span>
                        <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Новый</span>
                      </div>
                      <div className="px-4 space-y-2.5">
                        <div className="bg-white rounded-2xl border border-border-light/80 p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary">АК</div>
                            <div>
                              <p className="text-sm font-bold text-text-main">Айгуль К.</p>
                              <p className="text-xs text-text-secondary">+7 701 234 56 78</p>
                            </div>
                            <div className="size-8 rounded-xl bg-green-100 flex items-center justify-center ml-auto">
                              <Icon name="chat" size={14} className="text-green-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                          <p className="text-[11px] text-primary font-bold flex items-center gap-1.5">
                            <Icon name="input" size={12} />
                            Источник: WhatsApp
                          </p>
                          <p className="text-[11px] text-text-secondary mt-0.5">"Интересует портьера для гостиной"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1">
                            <Icon name="calendar_month" size={12} />
                            Назначить замер
                          </button>
                          <button className="py-2.5 rounded-xl bg-gray-100 text-text-secondary text-[11px] font-bold flex items-center justify-center gap-1">
                            <Icon name="call" size={12} />
                            Позвонить
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {active === 1 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                      <StatusBar time="11:10" />
                      <div className="flex items-center gap-2 px-4 pb-2">
                        <Icon name="arrow_back_ios" size={14} className="text-primary" />
                        <div>
                          <p className="text-sm font-bold text-text-main">Заказ #142</p>
                          <p className="text-[10px] text-text-secondary">Айгуль К. · Замер</p>
                        </div>
                      </div>
                      <div className="px-4 space-y-2.5">
                        <div className="bg-white rounded-2xl border border-border-light/80 p-3 shadow-sm">
                          <p className="text-[10px] font-bold text-text-secondary mb-2">Этапы заказа</p>
                          <div className="flex items-center">
                            {PIPELINE.map((s, i) => (
                              <React.Fragment key={s}>
                                <div className="flex flex-col items-center">
                                  <div className={`size-5 rounded-full flex items-center justify-center ${i < 2 ? 'bg-primary text-white' : i === 2 ? 'bg-primary/20 text-primary border border-primary' : 'bg-gray-100 text-gray-400'}`}>
                                    {i < 2 ? <Icon name="check" size={10} /> : <span className="text-[8px] font-bold">{i + 1}</span>}
                                  </div>
                                  <span className="text-[8px] text-text-secondary mt-0.5 text-center leading-tight w-9">{s}</span>
                                </div>
                                {i < PIPELINE.length - 1 && (
                                  <div className={`flex-1 h-0.5 mb-3 ${i < 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-border-light/80 p-3 shadow-sm">
                          <p className="text-[10px] font-bold text-text-secondary mb-2">Замер</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-text-secondary">Комната 1</span>
                              <span className="font-bold text-text-main">2 окна</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-text-secondary">Ткань</span>
                              <span className="font-bold text-text-main">Портьера 12м</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100 flex items-center gap-2">
                          <Icon name="photo_camera" size={14} className="text-blue-500 shrink-0" />
                          <span className="text-[11px] text-blue-700 font-bold">3 фото прикреплено</span>
                        </div>
                        <button className="w-full py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                          <Icon name="description" size={13} />
                          Отправить КП клиенту
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {active === 2 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                      <StatusBar time="17:26" />
                      <div className="flex items-center gap-2 px-4 pb-2">
                        <Icon name="arrow_back_ios" size={14} className="text-primary" />
                        <div>
                          <p className="text-sm font-bold text-text-main">Заказ #142</p>
                          <p className="text-[10px] text-text-secondary">Айгуль К. · Финал</p>
                        </div>
                      </div>
                      <div className="px-4 space-y-2.5">
                        <div className="bg-green-50 rounded-xl p-2.5 border border-green-100 flex items-center gap-2">
                          <Icon name="check_circle" size={16} className="text-green-500 shrink-0" />
                          <span className="text-[11px] text-green-700 font-bold">Пошив готов · монтаж назначен</span>
                        </div>
                        <div className="bg-white rounded-2xl border border-border-light/80 p-3.5 shadow-sm space-y-2">
                          <p className="text-[10px] font-bold text-text-secondary">Оплата</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary">Итого</span>
                            <span className="text-sm font-black text-text-main">75 000 ₸</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary">Аванс оплачен</span>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                              <Icon name="check" size={10} />
                              45 000 ₸
                            </span>
                          </div>
                          <div className="h-px bg-border-light" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-text-main">Остаток</span>
                            <span className="text-sm font-black text-amber-600">30 000 ₸</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <motion.div
                              className="h-full bg-green-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: '60%' }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                        <button className="w-full py-2.5 rounded-xl bg-green-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                          <Icon name="chat" size={13} />
                          Напомнить об остатке
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3">
            {steps.map((s, i) => (
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
                    <p className={`text-sm leading-relaxed ${active === i ? 'text-white/85' : 'text-text-secondary'}`}>{s.body}</p>
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

// ─── Dashboard Demo ──────────────────────────────────────────────────────────
function DashboardDemo() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const timerRef = useRef(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, amount: 0.3 });

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActiveTab((prev) => (prev + 1) % 3), 4000);
  };

  useEffect(() => {
    if (inView) resetTimer();
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [inView]);

  const TABS = [
    { icon: 'receipt_long', label: t('landing.dashboardDemo.tab0') },
    { icon: 'people', label: t('landing.dashboardDemo.tab1') },
    { icon: 'bar_chart', label: t('landing.dashboardDemo.tab2') },
  ];

  const ORDERS = [
    { id: 142, client: 'Айгуль К.', addr: 'ул. Абая, 45', fabric: 'Портьера 12м', status: 'В пошиве', sc: 'blue', pct: 75, paid: 45000, total: 75000 },
    { id: 141, client: 'Дамир О.', addr: 'ул. Тауелсіздік, 8', fabric: 'Тюль 8м', status: 'Замер', sc: 'amber', pct: 20, paid: 10000, total: 32000 },
    { id: 140, client: 'Аружан С.', addr: 'пр. Достык, 112', fabric: 'Рим. шторы', status: 'Монтаж', sc: 'orange', pct: 95, paid: 85000, total: 85000 },
    { id: 139, client: 'Ерлан М.', addr: 'мкр. Алатау, 23', fabric: 'Затемняющие', status: 'Новый', sc: 'gray', pct: 5, paid: 0, total: 0 },
  ];

  const CLIENTS = [
    { initials: 'АК', name: 'Айгуль К.', city: 'Алматы', orders: 3, last: '2 дня назад', tag: 'Постоянный', tc: 'green' },
    { initials: 'ДО', name: 'Дамир О.', city: 'Астана', orders: 1, last: 'Сегодня', tag: 'Новый', tc: 'gray' },
    { initials: 'АС', name: 'Аружан С.', city: 'Алматы', orders: 5, last: 'Неделю назад', tag: 'VIP', tc: 'yellow' },
    { initials: 'ЕМ', name: 'Ерлан М.', city: 'Шымкент', orders: 2, last: '3 дня назад', tag: 'Активен', tc: 'blue' },
  ];

  const BARS = [
    { month: 'Янв', val: 420 }, { month: 'Фев', val: 580 }, { month: 'Мар', val: 510 },
    { month: 'Апр', val: 720 }, { month: 'Май', val: 650 }, { month: 'Июн', val: 890 },
    { month: 'Июл', val: 1050 },
  ];

  const STATS = [
    { icon: 'payments', label: 'Выручка (июль)', value: '1 050 000 ₸', up: true },
    { icon: 'receipt_long', label: 'Заказов', value: '47', up: true },
    { icon: 'trending_up', label: 'Средний чек', value: '22 340 ₸', up: false },
    { icon: 'percent', label: 'Конверсия', value: '68%', up: true },
  ];

  const statusCls = {
    gray: 'bg-gray-100 text-gray-600', amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700', orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700', yellow: 'bg-yellow-100 text-yellow-700',
  };

  const progressCls = {
    gray: 'bg-gray-300', amber: 'bg-amber-400', blue: 'bg-blue-500',
    orange: 'bg-orange-500', green: 'bg-green-500',
  };

  const sideNav = [
    { icon: 'receipt_long', label: 'Заказы', idx: 0 },
    { icon: 'people', label: 'Клиенты', idx: 1 },
    { icon: 'straighten', label: 'Замеры', idx: -1 },
    { icon: 'texture', label: 'Ткани', idx: -1 },
    { icon: 'bar_chart', label: 'Аналитика', idx: 2 },
    { icon: 'settings', label: 'Настройки', idx: -1 },
  ];

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-gradient-to-b from-white to-background-light overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.dashboardDemo.badge')}
          badgeIcon="desktop_windows"
          title={t('landing.dashboardDemo.title')}
          subtitle={t('landing.dashboardDemo.subtitle')}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          className="flex justify-center gap-2 mb-3"
        >
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); resetTimer(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === i
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white border border-border-light text-text-secondary hover:border-primary/30 hover:text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-center text-sm text-text-secondary mb-8 max-w-md mx-auto"
          >
            {t(`landing.dashboardDemo.step${activeTab}Body`)}
          </motion.p>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border-light/60 ring-1 ring-black/5"
        >
          {/* Browser chrome */}
          <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-yellow-400" />
              <div className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono flex items-center gap-1.5 max-w-xs mx-auto">
              <Icon name="lock" size={10} className="text-green-500 shrink-0" />
              app.gardina.kz
            </div>
          </div>

          {/* App shell */}
          <div className="flex bg-white" style={{ height: '420px' }}>
            {/* Sidebar */}
            <div className="w-36 bg-primary-dark flex flex-col py-4 shrink-0">
              <div className="px-4 mb-5">
                <span className="text-white font-black text-base tracking-tight">🌿 Gardina</span>
              </div>
              {sideNav.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl transition-colors ${
                    activeTab === item.idx ? 'bg-white/20 text-white' : 'text-white/50'
                  }`}
                >
                  <Icon name={item.icon} size={16} />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
              ))}
              <div className="mt-auto px-4 flex items-center gap-2">
                <div className="size-7 rounded-full bg-accent/40 flex items-center justify-center text-[10px] font-black text-white">АК</div>
                <span className="text-[10px] text-white/60">admin</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-light/80 bg-white">
                <div className="flex items-center gap-2 bg-gray-50 border border-border-light rounded-lg px-3 py-1.5 w-56">
                  <Icon name="search" size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {activeTab === 0 ? 'Поиск заказов...' : activeTab === 1 ? 'Поиск клиентов...' : 'Аналитика за июль'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Icon name="notifications" size={18} className="text-text-secondary" />
                    <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-primary rounded-full text-[8px] text-white flex items-center justify-center font-bold">3</span>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">
                    <Icon name="add" size={14} />
                    {activeTab === 0 ? 'Новый заказ' : activeTab === 1 ? 'Добавить' : 'Экспорт'}
                  </button>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden relative bg-gray-50/50">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && (
                    <motion.div key="orders" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} className="absolute inset-0 overflow-y-auto p-4 space-y-2.5">
                      {ORDERS.map((o, i) => (
                        <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white rounded-xl border border-border-light/80 p-3.5 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-primary/60">#{o.id}</span>
                                <span className="text-sm font-bold text-text-main">{o.client}</span>
                              </div>
                              <p className="text-xs text-text-secondary mt-0.5">{o.fabric} · {o.addr}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusCls[o.sc]}`}>{o.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <motion.div className={`h-full rounded-full ${progressCls[o.sc]}`} initial={{ width: 0 }} animate={{ width: `${o.pct}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }} />
                            </div>
                            <span className="text-[10px] text-text-secondary tabular-nums w-7 text-right">{o.pct}%</span>
                            <span className="text-[10px] font-bold text-text-main tabular-nums">{o.paid.toLocaleString()} / {o.total.toLocaleString()} ₸</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 1 && (
                    <motion.div key="clients" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} className="absolute inset-0 overflow-y-auto p-4 space-y-2">
                      {CLIENTS.map((c, i) => (
                        <motion.div key={c.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white rounded-xl border border-border-light/80 p-3.5 flex items-center gap-3 shadow-sm">
                          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">{c.initials}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-text-main">{c.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusCls[c.tc]}`}>{c.tag}</span>
                            </div>
                            <p className="text-xs text-text-secondary">{c.city} · Заказов: {c.orders} · {c.last}</p>
                          </div>
                          <Icon name="chevron_right" size={16} className="text-gray-300 shrink-0" />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 2 && (
                    <motion.div key="analytics" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} className="absolute inset-0 overflow-y-auto p-4">
                      <div className="bg-white rounded-xl border border-border-light/80 p-4 shadow-sm mb-3">
                        <p className="text-xs font-bold text-text-secondary mb-4">Выручка, тыс. ₸ · 2026</p>
                        <div className="flex items-end gap-3 h-28">
                          {BARS.map((b, i) => (
                            <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[9px] text-text-secondary font-bold tabular-nums">{b.val}</span>
                              <motion.div
                                className={`w-full rounded-t-md ${i === BARS.length - 1 ? 'bg-primary' : 'bg-primary/30'}`}
                                initial={{ height: 0 }}
                                animate={{ height: `${(b.val / 1050) * 80}px` }}
                                transition={{ duration: 0.6, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                              />
                              <span className="text-[9px] text-gray-400">{b.month}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {STATS.map((s, i) => (
                          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }} className="bg-white rounded-xl border border-border-light/80 p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon name={s.icon} size={14} className="text-primary/60" />
                              <span className="text-[10px] text-text-secondary font-bold">{s.label}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-text-main">{s.value}</span>
                              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-amber-600'}`}>
                                <Icon name={s.up ? 'arrow_upward' : 'arrow_downward'} size={10} />
                                {s.up ? '+12%' : '-3%'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const { t, lang } = useI18n();

  const featureDemos = [
    // f1 — Client list
    <div className="mt-4 space-y-2">
      {[
        { name: lang === 'kz' ? 'Айгүл Сейітова' : 'Айгуль Сейтова', tag: lang === 'kz' ? 'Тұрақты' : 'Постоянный', color: 'bg-green-100 text-green-700', delay: 0 },
        { name: lang === 'kz' ? 'Марат Жақсыбеков' : 'Марат Джаксыбеков', tag: lang === 'kz' ? 'Жаңа' : 'Новый', color: 'bg-blue-100 text-blue-700', delay: 0.1 },
        { name: lang === 'kz' ? 'Дина Нұрланова' : 'Дина Нурланова', tag: 'VIP', color: 'bg-purple-100 text-purple-700', delay: 0.2 },
      ].map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: c.delay, duration: 0.3 }}
          className="flex items-center justify-between bg-background-light rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{c.name[0]}</div>
            <span className="text-xs font-medium text-text-main">{c.name}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>{c.tag}</span>
        </motion.div>
      ))}
    </div>,
    // f2 — Measurements
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {['🪟', '📐', '🖼️'].map((em, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="aspect-square bg-background-light rounded-xl flex items-center justify-center text-xl">{em}</motion.div>
        ))}
      </div>
      <div className="bg-background-light rounded-xl px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-text-secondary">{lang === 'kz' ? 'Ен × Биіктік' : 'Ширина × Высота'}</p>
          <p className="text-sm font-black text-text-main">3.2 × 2.8 м</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text-secondary">{lang === 'kz' ? 'Бөлме' : 'Комната'}</p>
          <p className="text-xs font-bold text-text-main">{lang === 'kz' ? 'Зал' : 'Гостиная'}</p>
        </div>
      </div>
    </div>,
    // f3 — Proposals / КП
    <div className="mt-4 space-y-2">
      {[
        { label: lang === 'kz' ? '#КП-88 · Айгүл' : '#КП-88 · Айгуль', price: '185 000 ₸', status: lang === 'kz' ? 'Қаралды' : 'Просмотрено', dot: 'bg-green-500' },
        { label: lang === 'kz' ? '#КП-87 · Марат' : '#КП-87 · Марат', price: '240 000 ₸', status: lang === 'kz' ? 'Жіберілді' : 'Отправлено', dot: 'bg-blue-500' },
      ].map((kp, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
          className="bg-background-light rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-main">{kp.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`size-1.5 rounded-full ${kp.dot}`} />
              <p className="text-[10px] text-text-secondary">{kp.status}</p>
            </div>
          </div>
          <p className="text-xs font-black text-primary">{kp.price}</p>
        </motion.div>
      ))}
    </div>,
    // f4 — Production pipeline
    <div className="mt-4">
      <div className="flex gap-1 mb-3">
        {(lang === 'kz' ? ['Тігу', 'Тексеру', 'Монтаж'] : ['Пошив', 'Проверка', 'Монтаж']).map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.3 }} style={{ transformOrigin: 'left' }}
            className={`flex-1 rounded-lg py-1.5 text-center text-[10px] font-bold ${i === 1 ? 'bg-primary text-white' : 'bg-background-light text-text-secondary'}`}>
            {step}
          </motion.div>
        ))}
      </div>
      <div className="bg-background-light rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="size-7 rounded-full bg-yellow-100 flex items-center justify-center">
          <Icon name="sewing_kit" size={14} className="text-yellow-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-text-main">{lang === 'kz' ? 'Тігіс цехы · 3 тапсырыс' : 'Цех пошива · 3 заказа'}</p>
          <p className="text-[10px] text-text-secondary">{lang === 'kz' ? 'Аяқтау мерзімі: 28 мамыр' : 'Срок готовности: 28 мая'}</p>
        </div>
      </div>
    </div>,
    // f5 — Payments
    <div className="mt-4">
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-[10px] text-text-secondary">{lang === 'kz' ? 'Төлем' : 'Оплата'}</span>
        <span className="text-xs font-black text-primary">75 000 / 120 000 ₸</span>
      </div>
      <div className="h-2 bg-background-light rounded-full overflow-hidden mb-3">
        <motion.div initial={{ width: 0 }} whileInView={{ width: '62%' }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
      </div>
      <div className="space-y-1.5">
        {[
          { label: lang === 'kz' ? 'Аванс (50%)' : 'Аванс (50%)', amt: '60 000 ₸', ok: true },
          { label: lang === 'kz' ? 'Орта (25%)' : 'Средний (25%)', amt: '15 000 ₸', ok: true },
          { label: lang === 'kz' ? 'Соңғы (25%)' : 'Остаток (25%)', amt: '45 000 ₸', ok: false },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">{row.label}</span>
            <span className={`text-[10px] font-bold ${row.ok ? 'text-green-600' : 'text-text-secondary'}`}>{row.amt}</span>
          </div>
        ))}
      </div>
    </div>,
    // f6 — Team roles
    <div className="mt-4 space-y-2">
      {[
        { role: lang === 'kz' ? 'Дизайнер' : 'Дизайнер', perms: lang === 'kz' ? 'Замерлер, КП' : 'Замеры, КП', color: 'bg-purple-100 text-purple-700', delay: 0 },
        { role: lang === 'kz' ? 'Менеджер' : 'Менеджер', perms: lang === 'kz' ? 'Клиенттер, Тапсырыстар' : 'Клиенты, Заказы', color: 'bg-blue-100 text-blue-700', delay: 0.1 },
        { role: lang === 'kz' ? 'Өндіріс' : 'Производство', perms: lang === 'kz' ? 'Тек өндіріс' : 'Только пошив', color: 'bg-orange-100 text-orange-700', delay: 0.2 },
      ].map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: r.delay }}
          className="flex items-center justify-between bg-background-light rounded-xl px-3 py-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.role}</span>
          <span className="text-[10px] text-text-secondary">{r.perms}</span>
        </motion.div>
      ))}
    </div>,
  ];

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
          {items.map((f, idx) => (
            <motion.div
              key={f.keyId}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
                  <Icon name={f.icon} size={18} />
                </div>
                <h3 className="font-bold text-text-main">{t(`landing.features.${f.keyId}Title`)}</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{t(`landing.features.${f.keyId}Body`)}</p>
              {featureDemos[idx]}
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
  const openBooking = useContext(BookingCtx);
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      keyId: 'start',
      monthly: '15 000',
      monthlyNum: 15000,
      yearly: '150 000',
      yearlyNum: 150000,
      featuresCount: 4,
      highlighted: false,
    },
    {
      keyId: 'pro',
      monthly: '35 000',
      monthlyNum: 35000,
      yearly: '350 000',
      yearlyNum: 350000,
      featuresCount: 5,
      highlighted: true,
    },
    {
      keyId: 'network',
      monthly: '60 000',
      monthlyNum: 60000,
      yearly: '600 000',
      yearlyNum: 600000,
      featuresCount: 4,
      suffix: ' +',
      highlighted: false,
    },
  ].map((p) => ({
    ...p,
    savingPct: Math.round((1 - p.yearlyNum / (p.monthlyNum * 12)) * 100),
  }));

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
                <AnimatePresence>
                  {yearly && (
                    <motion.div
                      key="saving-badge"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mb-2"
                    >
                      <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
                        p.highlighted ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                      }`}>
                        <Icon name="arrow_downward" size={11} />
                        Экономия {p.savingPct}% · 2 месяца в подарок
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-baseline gap-2">
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
                  <span className={`text-sm ${p.highlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                    {yearly ? t('landing.pricing.period_year') : t('landing.pricing.period_month')}
                  </span>
                </div>
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

              <button
                onClick={openBooking}
                className={`mt-7 block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                  p.highlighted
                    ? 'bg-white text-primary hover:bg-accent'
                    : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {t(`landing.pricing.plans.${p.keyId}.cta`)}
              </button>
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
  const lineRef = useRef(null);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.8', 'end 0.6'] });
  const lineScale = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 80, damping: 20 });

  const stepIcons = ['chat', 'tune', 'school', 'check_circle'];
  const stepColors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-orange-50 text-orange-600', 'bg-green-50 text-green-600'];
  const steps = [1, 2, 3, 4];

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-gradient-to-b from-background-light to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('landing.process.badge')}
          badgeIcon="arrow_forward"
          title={t('landing.process.title')}
          subtitle={t('landing.process.subtitle')}
        />

        {/* Timeline line (desktop only) */}
        <div className="relative hidden lg:block mb-10">
          <div className="absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-border-light" />
          <motion.div
            ref={lineRef}
            style={{ scaleX: lineScale, transformOrigin: 'left' }}
            className="absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary to-accent origin-left"
          />
          <div className="grid grid-cols-4 gap-5">
            {steps.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                  className={`size-14 rounded-2xl ${stepColors[i]} flex items-center justify-center mb-4 relative z-10`}
                >
                  <Icon name={stepIcons[i]} size={24} />
                  <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    {n}
                  </span>
                </motion.div>
                <div className="text-center">
                  <h3 className="font-bold text-text-main mb-1.5 text-sm">{t(`landing.process.s${n}Title`)}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{t(`landing.process.s${n}Body`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="lg:hidden grid sm:grid-cols-2 gap-4"
        >
          {steps.map((n, i) => (
            <motion.li key={n} variants={fadeUp}>
              <div className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card h-full flex gap-4">
                <div className={`size-11 rounded-xl ${stepColors[i]} flex items-center justify-center shrink-0 relative`}>
                  <Icon name={stepIcons[i]} size={20} />
                  <span className="absolute -top-1.5 -right-1.5 size-4.5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">{n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main mb-1">{t(`landing.process.s${n}Title`)}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{t(`landing.process.s${n}Body`)}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  const openBooking = useContext(BookingCtx);
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
              <button
                onClick={openBooking}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-accent transition-all"
              >
                <Icon name="edit_note" size={20} />
                {t('landing.cta.primary')}
              </button>
              <a
                href="https://wa.me/77079429827"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Icon name="chat" size={20} />
                {t('landing.cta.whatsapp')}
              </a>
              <a
                href="tel:+77079429827"
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
            <li><a href="https://wa.me/77079429827" target="_blank" rel="noreferrer" className="hover:text-white">{t('landing.footer.whatsapp')}</a></li>
            <li><a href="/terms.html" className="hover:text-white">{t('landing.footer.terms')}</a></li>
            <li><a href="/privacy.html" className="hover:text-white">{t('landing.footer.privacy')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">{t('landing.footer.contact')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="tel:+77079429827" className="hover:text-white">+7 707 942 9827</a></li>
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
      href="https://wa.me/77079429827"
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
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);

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
    <BookingCtx.Provider value={openBooking}>
      <div className="bg-background-light text-text-main overflow-x-hidden">
        <LandingHeader />
        <main>
          <Hero />
          <StatsBand />
          <Problems />
          <PhoneDemo />
          <DashboardDemo />
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
        <RequestModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
      </div>
    </BookingCtx.Provider>
  );
}
