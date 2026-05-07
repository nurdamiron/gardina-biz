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

const cardHover = {
  rest: { y: 0, boxShadow: '0 4px 12px -2px rgba(27, 94, 69, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.04)' },
  hover: { y: -6, boxShadow: '0 24px 40px -12px rgba(27, 94, 69, 0.18), 0 8px 16px -4px rgba(0, 0, 0, 0.08)', transition: { duration: 0.25 } },
};

// ─── Header with scroll-triggered styling ───────────────────────────────────
function LandingHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 24));
  }, [scrollY]);

  const links = [
    { href: '#problems', label: 'Мәселе → шешім' },
    { href: '#features', label: 'Артықшылық' },
    { href: '#modules', label: 'Бөлімдер' },
    { href: '#compare', label: 'Салыстыру' },
    { href: '#pricing', label: 'Тарифтер' },
    { href: '#faq', label: 'Сұрақтар' },
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
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            Кіру
          </Link>
          <a
            href="https://wa.me/77715373201"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-lg transition-colors shadow-lg shadow-primary/20"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </motion.header>
  );
}

// ─── Hero with parallax mockup ──────────────────────────────────────────────
function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const mockY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const mockOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);

  return (
    <section ref={heroRef} className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
      {/* Background blobs */}
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
            Кез келген жерден ашылады · командаға ыңғайлы
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-main leading-[1.05] tracking-tight">
            Перде бизнесіңізді{' '}
            <span className="bg-gradient-to-br from-primary via-primary-light to-accent bg-clip-text text-transparent">
              бір жүйеден басқарыңыз
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
            Gardina — перде салоныңызға арналған жұмыс құралы. Клиент, ұсыныс, өлшем, тігу
            және төлем бойынша барлық мәлімет бір жерде. Ештеңе жоғалмайды.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-base hover:brightness-110 active:scale-[0.99] shadow-xl shadow-primary/25 transition-all"
            >
              <Icon name="arrow_forward" size={20} />
              7 күн тегін бастау
            </Link>
            <a
              href="https://wa.me/77715373201"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-primary/20 text-primary font-bold text-base hover:bg-primary/5 transition-all"
            >
              <Icon name="chat" size={20} />
              Демо сұрау
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            {[
              { value: 'Клиенттер', label: 'Барлығы бір тізімде' },
              { value: 'Ұсыныс', label: 'Жіберу және бақылау' },
              { value: 'Бақылау', label: 'Күн сайын анық' },
            ].map((s) => (
              <div key={s.value} className="text-center lg:text-left">
                <div className="text-sm font-bold text-primary">{s.value}</div>
                <div className="text-xs text-text-secondary mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mockup */}
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
                <span className="text-[11px] font-bold text-text-secondary">Gardina · бүгінгі тапсырыстар</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { type: 'line', w: 'w-full' },
                  { type: 'line', w: 'w-3/4' },
                  { type: 'accent', text: 'Жаңа келісім · өлшем жоспарланды' },
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
                {['Лидтер', 'Ұсыныс', 'Аяқталған'].map((label, i) => (
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

          {/* Floating notification */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5, ease: 'easeOut' }}
            className="absolute -right-4 sm:-right-8 top-12 bg-white rounded-2xl shadow-2xl p-3 border border-border-light max-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-text-secondary">Push хабарлама</span>
            </div>
            <div className="text-xs font-bold text-text-main">Жаңа лид</div>
            <div className="text-[11px] text-text-secondary leading-tight mt-0.5">WhatsApp арқылы өтінім түсті</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Animated stat counter ──────────────────────────────────────────────────
function StatNumber({ to, suffix = '' }) {
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

  return (
    <span ref={ref}>
      {display.toLocaleString('kk-KZ')}
      {suffix}
    </span>
  );
}

function StatsBand() {
  const stats = [
    { value: 60, suffix: '+', label: 'Перде салондары әлеуетте' },
    { value: 4, suffix: ' роль', label: 'Дизайнер, менеджер, өндіріс, әкімші' },
    { value: 2, suffix: ' тіл', label: 'Қазақша және орысша' },
    { value: 100, suffix: '%', label: 'Бұлт · кез келген құрылғыдан' },
  ];

  return (
    <section className="py-12 sm:py-16 border-y border-border-light/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              <StatNumber to={s.value} suffix={s.suffix} />
            </div>
            <div className="text-xs sm:text-sm text-text-secondary mt-1.5 font-medium leading-snug">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section heading helper ─────────────────────────────────────────────────
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

// ─── Problem → Solution cards ───────────────────────────────────────────────
function Problems() {
  const items = [
    {
      problem: '«Клиент қайда, тапсырыс қай күйде?»',
      pain: 'Телефон, WhatsApp, дәптер, Excel — бәрі бөлек. Тапсырыс іздеу үшін 5 минут үзілесіз.',
      solution: 'Бір жерде: клиент, тапсырыс күйі, келесі қадам — бәрі бірден көрінеді.',
      icon: 'person_search',
    },
    {
      problem: '«Дизайнер білді, менеджер білмеді»',
      pain: 'Командада ақпарат дұрыс жетпейді. Терезе өлшемі немесе түсі қайда сақталғанын сұрайсыз.',
      solution: 'Өлшем, фото, ұсыныс бір тапсырысқа жиналады. Әр қызметкер өзіне керегін көреді.',
      icon: 'groups',
    },
    {
      problem: '«Төлем аз, кешіккен жоқ па?»',
      pain: 'Алдын ала төлем қанша, қалғаны қанша — еске түсірмей қойсаңыз, шот жіберіп аласыз.',
      solution: 'Төлем күйі анық, қай клиентпен қайта байланысу керек екені бірден көрінеді.',
      icon: 'payments',
    },
  ];

  return (
    <section id="problems" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Нені шешеміз"
          badgeIcon="error"
          title="Күнделікті қиындықтар түсінікті тілде"
          subtitle="Көп салондарда бірдей сурет: деректер шашыраған, кім не істеп жатқаны бұлыңғыр, төлем мен мерзім ұмытылады."
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
              key={it.problem}
              variants={fadeUp}
              initial="rest"
              whileHover="hover"
              animate="rest"
              className="rounded-3xl bg-white p-7 border border-border-light/80"
            >
              <motion.div variants={cardHover} className="contents">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <Icon name={it.icon} size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-1.5">Мәселе</div>
                <h3 className="text-lg font-bold text-text-main mb-2 leading-tight">{it.problem}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">{it.pain}</p>
                <div className="text-[10px] font-black uppercase tracking-wider text-primary mb-1.5">Шешім</div>
                <p className="text-sm text-text-main leading-relaxed font-medium">{it.solution}</p>
              </motion.div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Phone demo with rotating screens ───────────────────────────────────────
function PhoneDemo() {
  const screens = [
    {
      time: '09:42',
      title: 'Лид қабылдау',
      step: 'Жаңа клиент өтінішін тіркеп, келесі әрекетті бірден қоясыз.',
      cards: [
        { tag: 'Gardina', when: 'Қазір', heading: 'Жаңа лид', body: 'WhatsApp арқылы өтініш түсті. Клиент карточкасы ашылды.' },
        { tag: 'Клиенттер', when: '09:38', body: 'Бүгін 3 жаңа өтінім тіркелді.', muted: true },
      ],
    },
    {
      time: '11:10',
      title: 'Замер және ұсыныс',
      step: 'Өлшем, фото, ұсыныс бір тапсырыс ішінде қалады.',
      cards: [
        { tag: 'Замер', when: 'Қазір', heading: 'Өлшем бекітілді', body: 'Өлшем, фото және ескертпе тапсырысқа тіркелді.' },
        { tag: 'Ұсыныс', when: '11:05', body: 'Клиентке коммерциялық ұсыныс жіберілді.', muted: true },
      ],
    },
    {
      time: '17:26',
      title: 'Тігу, монтаж, төлем',
      step: 'Орындау кезеңдері мен төлем күйін командамен бірге бақылайсыз.',
      cards: [
        { tag: 'Монтаж', when: 'Қазір', heading: 'Монтажға дайын', body: 'Пошив аяқталды, монтаж уақыты қойылды, төлем жаңарды.' },
        { tag: 'Төлем', when: '17:20', body: 'Қалған сома бойынша клиентке еске салу жіберілді.', muted: true },
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
          badge="Қалай жұмыс істейді"
          badgeIcon="install_mobile"
          title="Телефондағыдай көріңіз"
          subtitle="Клиенттен төлемге дейінгі процесс бір экранда қалай жүретінін төмендегі демодан көріңіз."
        />

        <div className="grid lg:grid-cols-[auto_1fr] gap-12 items-center max-w-5xl mx-auto">
          {/* Phone frame */}
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
                      <strong className="text-sm font-bold text-text-main">Бүгінгі оқиғалар</strong>
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

          {/* Steps */}
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

// ─── Features grid ──────────────────────────────────────────────────────────
function Features() {
  const items = [
    { icon: 'groups', title: 'Клиенттер бір тізімде', body: 'Кім қоңырау шалды, қай тапсырыс қай кезеңде — бәрі бір жерде.' },
    { icon: 'straighten', title: 'Өлшем мен фото', body: 'Әр терезе, өлшем, түсірілген фото бір тапсырысқа бекітіледі.' },
    { icon: 'receipt_long', title: 'Ұсыныс және келісім', body: 'Клиентке КП жібересіз, оның жауабын бірден көресіз.' },
    { icon: 'precision_manufacturing', title: 'Өндіріс пен тігу', body: 'Тапсырыс цехқа өтті ме, тігу бітті ме — әр кезең бірден көрінеді.' },
    { icon: 'payments', title: 'Төлемдер анық', body: 'Алдын ала төлем, қалғаны, төленбеген сома — көрініп тұрады.' },
    { icon: 'badge', title: 'Қызметкерлерге ыңғайлы', body: 'Дизайнер, менеджер, өндіріс — әркім өз жұмысына керек бөлікті көреді.' },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Неге Gardina"
          badgeIcon="check_circle"
          title="Бизнесіңізге нақты пайда"
          subtitle="Тапсырысты бақылаңыз, жұмысты бөлісіңіз, клиентті күттірмеңіз."
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
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-4">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="font-bold text-text-main mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Modules grid ───────────────────────────────────────────────────────────
function Modules() {
  const items = [
    { icon: 'person_search', title: 'Клиенттер мен тапсырыстар', body: 'Жаңа өтініштен бастап дайын орнатуға дейінгі жол нақты көрінеді.' },
    { icon: 'photo_camera', title: 'Өлшем және суреттер', body: 'Бөлме, терезе, фото және ескертпелер тапсырыспен бірге сақталады.' },
    { icon: 'inventory', title: 'Маталар мен есеп', body: 'Қай мата таңдалды, қанша қажет, қанша қалды — анық көрінеді.' },
    { icon: 'notifications', title: 'Хабарламалар', body: 'Маңызды жаңалықты өткізіп алмайсыз: тапсырыс, төлем, мерзім.' },
    { icon: 'analytics', title: 'Нәтиже мен шолу', body: 'Не сатылды, қай тапсырыс кідіріп тұр, қай жерде назар керек.' },
    { icon: 'lock', title: 'Қауіпсіз сақталады', body: 'Клиент пен тапсырыс мәліметі сенімді сақталады, тек сіздің команда көреді.' },
  ];

  return (
    <section id="modules" className="py-20 sm:py-28 bg-gradient-to-b from-white to-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Жүйеде не бар"
          badgeIcon="dashboard"
          title="Негізгі бөлімдер"
          subtitle="Күнделікті жұмысыңызға керекті бөлімдер. Барлығы түсінікті және ретімен."
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
              key={m.title}
              variants={fadeUp}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white p-6 border border-border-light/80 flex gap-4 items-start"
            >
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name={m.icon} size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-main mb-1">{m.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{m.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Comparison vs competitors ─────────────────────────────────────────────
function Comparison() {
  const rows = [
    { feature: 'Перде салонына арналған дизайн', gardina: true, amocrm: false, bitrix: false },
    { feature: 'Тіндер мен метраж есебі', gardina: true, amocrm: false, bitrix: false },
    { feature: 'Өлшем фото-карточкалары', gardina: true, amocrm: false, bitrix: 'partial' },
    { feature: 'Дизайнер/менеджер/цех рөлдері', gardina: true, amocrm: 'partial', bitrix: true },
    { feature: 'KZ тілінде интерфейс', gardina: true, amocrm: 'partial', bitrix: 'partial' },
    { feature: 'Мобильге PWA офлайн', gardina: true, amocrm: true, bitrix: true },
    { feature: 'Бастапқы баға (1-3 қол)', gardina: '15 000 ₸', amocrm: '36 000 ₸', bitrix: '22 700 ₸' },
  ];

  const cellIcon = (v) => {
    if (v === true) return <Icon name="check_circle" size={20} className="text-primary mx-auto" />;
    if (v === false) return <Icon name="close" size={20} className="text-text-secondary/40 mx-auto" />;
    if (v === 'partial') return <span className="inline-block size-4 rounded-full bg-amber-400 mx-auto" title="Ішінара" />;
    return <span className="text-sm font-bold text-text-main">{v}</span>;
  };

  return (
    <section id="compare" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Бәсекеге салыстыру"
          badgeIcon="bar_chart"
          title="Gardina vs AmoCRM vs Битрикс24"
          subtitle="Жалпы CRM-дермен салыстырғанда Gardina перде бизнесіне тікелей жасалған. Барлық деректер сол үшін бапталған."
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
                  <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">Мүмкіндік</th>
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
                    key={r.feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="border-b border-border-light/40 last:border-0"
                  >
                    <td className="px-5 py-4 text-sm text-text-main font-medium">{r.feature}</td>
                    <td className="px-5 py-4 text-center bg-primary/5">{cellIcon(r.gardina)}</td>
                    <td className="px-5 py-4 text-center">{cellIcon(r.amocrm)}</td>
                    <td className="px-5 py-4 text-center">{cellIcon(r.bitrix)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="text-center text-xs text-text-secondary mt-4">
          AmoCRM «Базовый» 1 пайдаланушыға, Битрикс24 «Стандартный» (барлығы), 2026 жылдың бастапқы бағасы.
        </p>
      </div>
    </section>
  );
}

// ─── Testimonials marquee (placeholder data) ─────────────────────────────────
function Testimonials() {
  const items = [
    { name: 'Айгүл К.', role: 'Перде салоны иесі', quote: '«Бұрын тапсырысты Excel-де іздейтінбіз, қазір бір экранда. Команда тез үйренді».' },
    { name: 'Ерлан М.', role: 'Студия әкімшісі', quote: '«Өлшемге барған дизайнер фотоны бірден бекітеді. Менеджер сол сәтте КП жіберіп үлгереді».' },
    { name: 'Аружан С.', role: 'Сатылым бөлімі', quote: '«Төленбеген қалдықты ұмытып қалмаймыз. Жүйе өзі еске салады».' },
    { name: 'Дамир О.', role: 'Желі менеджері', quote: '«2 нүкте жұмысын бір жерден көру керек еді — Network тарифімен мәселе шешілді».' },
  ];

  // Duplicate for infinite marquee
  const doubled = [...items, ...items];

  return (
    <section className="py-20 sm:py-24 overflow-hidden bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Команда айтады"
          badgeIcon="star"
          title="Бірінші клиенттеріміздің сөздері"
          subtitle="Бұл — early-access кезеңіндегі Gardina пайдаланушыларының пікірлері."
        />
      </div>

      <motion.div
        className="flex gap-5"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((t, i) => (
          <article
            key={i}
            className="shrink-0 w-[320px] sm:w-[380px] rounded-2xl bg-white p-6 border border-border-light/70 shadow-card"
          >
            <div className="flex items-center gap-1 mb-3 text-amber-400">
              {[...Array(5)].map((_, k) => (
                <Icon key={k} name="star" size={16} />
              ))}
            </div>
            <p className="text-sm text-text-main leading-relaxed mb-5">{t.quote}</p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-text-main">{t.name}</div>
                <div className="text-xs text-text-secondary">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </motion.div>
    </section>
  );
}

// ─── Pricing ────────────────────────────────────────────────────────────────
function Pricing() {
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: 'Start',
      audience: 'Кіші салондарға',
      monthly: '15 000',
      yearly: '150 000',
      features: [
        '1 салон, 3 пайдаланушыға дейін',
        'Клиенттер, өтінімдер, воронка',
        'Кездесу мен өлшем күнтізбесі',
        'Негізгі аналитика',
      ],
      cta: 'Start таңдау',
      highlighted: false,
    },
    {
      name: 'Pro',
      audience: 'Негізгі жұмыс тарифі',
      monthly: '35 000',
      yearly: '350 000',
      features: [
        '1 салон, 8 пайдаланушыға дейін',
        'Толық цикл: өтінімнен монтажға',
        'Өндіріс/монтаж этаптары',
        'Тіндер мен қалдық есебі',
        '7 күн тегін Pro trial',
      ],
      cta: '7 күн тегін көру',
      highlighted: true,
    },
    {
      name: 'Network',
      audience: 'Бірнеше салонға',
      monthly: '60 000 бастап',
      yearly: '600 000 бастап',
      features: [
        '2+ салон, рөлдер және рұқсаттар',
        'Барлығы Pro тарифінен',
        'Салондар бойынша жиынтық аналитика',
        'Баға салон санына қарай',
      ],
      cta: 'Кеңес алу',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Тарифтер"
          badgeIcon="store"
          title="Өзіңізге ыңғайлы тарифті таңдаңыз"
          subtitle="Үш деңгей: Start, Pro, Network. Pro тарифінде 7 күн тегін сынап көріңіз."
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
              Айлық
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`relative z-10 px-5 py-2 text-sm font-bold rounded-xl transition-colors ${yearly ? 'text-primary' : 'text-text-secondary'}`}
            >
              Жылдық
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
              2 ай сыйлық
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
              key={p.name}
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
                  Ұсынылады
                </div>
              )}
              <h3 className={`text-xl font-bold ${p.highlighted ? 'text-white' : 'text-text-main'}`}>{p.name}</h3>
              <p className={`text-sm mt-1 ${p.highlighted ? 'text-white/80' : 'text-text-secondary'}`}>{p.audience}</p>

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
                    {yearly ? p.yearly : p.monthly} ₸
                  </motion.span>
                </AnimatePresence>
                <span className={`text-sm ml-1 ${p.highlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                  / {yearly ? 'жыл' : 'ай'}
                </span>
              </div>

              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <Icon
                      name="check_circle"
                      size={18}
                      className={`shrink-0 mt-0.5 ${p.highlighted ? 'text-accent' : 'text-primary'}`}
                    />
                    <span className={`text-sm leading-relaxed ${p.highlighted ? 'text-white/95' : 'text-text-main'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`mt-7 block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                  p.highlighted
                    ? 'bg-white text-primary hover:bg-accent'
                    : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {p.cta}
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── FAQ accordion ──────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      q: 'Картаны қажет ете ме сынау үшін?',
      a: 'Жоқ, 7 күн Pro trial толықтай тегін, картасыз. Сынау аяқталғанда автоматты түрде Start тарифіне ауысады, ешбір төлем алынбайды.',
    },
    {
      q: 'Қандай құрылғыдан жұмыс істей аламын?',
      a: 'Кез келген: телефон, планшет, ноутбук, компьютер. Gardina — браузерде ашылатын PWA. Орнату қажет емес.',
    },
    {
      q: 'Деректерім қаншалықты қауіпсіз?',
      a: 'Барлық трафик HTTPS арқылы шифрланған. Әр салонның деректері басқалардан толық оқшауланған. Қол жеткізу журналы 1 жыл бойы сақталады.',
    },
    {
      q: 'Бар Excel-деректерімді жүктей аламын ба?',
      a: 'Иә. Кеңес сатысында сіздің бастапқы базаңызды (клиенттер, тапсырыстар) импорттауға көмектесеміз.',
    },
    {
      q: 'Команда қанша адам болады?',
      a: 'Start — 3 пайдаланушыға дейін, Pro — 8, Network — шектеусіз (бірнеше салон бойынша).',
    },
    {
      q: 'Тарифтен қалай шығу керек?',
      a: 'Кез келген уақытта: әкімші панелінен төмен тарифке ауысыңыз немесе аккаунтты белсенді емес ете аласыз. Деректер сақталады.',
    },
  ];

  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-gradient-to-b from-background-light to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Жиі қойылатын сұрақтар"
          badgeIcon="help"
          title="Сұрақтар бар ма?"
          subtitle="Көп нәрсе осы жерде шешіледі. Қалғаны үшін WhatsApp-ке жазыңыз — біздің команда жауап береді."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="space-y-3"
        >
          {items.map((it, i) => (
            <motion.div
              key={it.q}
              variants={fadeUp}
              className="rounded-2xl bg-white border border-border-light/70 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-background-light transition-colors"
              >
                <span className="font-bold text-text-main">{it.q}</span>
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
                    <div className="px-5 sm:px-6 pb-5 text-sm text-text-secondary leading-relaxed">{it.a}</div>
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

// ─── Process steps ──────────────────────────────────────────────────────────
function Process() {
  const steps = [
    { n: '1', title: 'Кеңес', body: 'WhatsApp немесе хат арқылы сөйлесеміз. Салоныңызға не керек екенін бірге анықтаймыз.' },
    { n: '2', title: 'Қосу', body: 'Компанияңызды қосып береміз. Қызметкерлерге қолжетімділікті өзіміз реттеп береміз.' },
    { n: '3', title: 'Оқыту', body: 'Командаға қысқа әрі түсінікті нұсқаулық береміз: күнделікті жұмысты қалай жүргізу.' },
    { n: '4', title: 'Жұмыс', body: 'Күнделікті жұмысты бір жерден жүргізесіз. Қажет кезде бізге бірден жаза аласыз.' },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge="Қалай бастайсыз"
          badgeIcon="arrow_forward"
          title="Төрт қарапайым қадам"
          subtitle="Сізге түсінікті, қарапайым жолмен бастаймыз."
        />

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {steps.map((s, i) => (
            <motion.li key={s.n} variants={fadeUp} className="relative">
              <div className="rounded-2xl bg-white p-6 border border-border-light/80 shadow-card h-full">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-black text-lg mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-text-main mb-1.5">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
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

// ─── Final CTA ──────────────────────────────────────────────────────────────
function CTA() {
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
              Gardina сізге сай ма?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto">
              Қысқа сұхбатта түсінеміз. Кейін жүйеге кіру немесе толық демо — сіздің таңдауыңыз.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-accent transition-all"
              >
                <Icon name="arrow_forward" size={20} />
                Тегін бастау
              </Link>
              <a
                href="https://wa.me/77715373201"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Icon name="chat" size={20} />
                WhatsApp
              </a>
              <a
                href="tel:+77715373201"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white/90 font-bold hover:text-white transition-all"
              >
                <Icon name="phone" size={20} />
                +7 771 537 3201
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="bg-primary-dark text-white/85 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <img src="/images/logo-header.png" alt="Gardina" className="h-10 w-auto mb-4 brightness-0 invert" />
          <p className="text-sm leading-relaxed text-white/70">
            Перде салондары мен ательелерге арналған жүйе: клиенттер, тапсырыс, өлшеу, ұсыныс, өндіріс және төлемдер бір жерде.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Навигация</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#problems" className="hover:text-white">Мәселе → шешім</a></li>
            <li><a href="#features" className="hover:text-white">Артықшылық</a></li>
            <li><a href="#modules" className="hover:text-white">Бөлімдер</a></li>
            <li><a href="#pricing" className="hover:text-white">Тарифтер</a></li>
            <li><a href="#faq" className="hover:text-white">Сұрақтар</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Қосымша</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">Жүйеге кіру</Link></li>
            <li><a href="mailto:info@gardina.kz" className="hover:text-white">info@gardina.kz</a></li>
            <li><a href="https://wa.me/77715373201" target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a></li>
            <li><a href="/terms.html" className="hover:text-white">Қызмет көрсету шарты</a></li>
            <li><a href="/privacy.html" className="hover:text-white">Құпиялылық саясаты</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Байланыс</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="tel:+77715373201" className="hover:text-white">+7 771 537 3201</a></li>
            <li><a href="mailto:info@gardina.kz" className="hover:text-white">info@gardina.kz</a></li>
            <li>Қазақстан</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between text-xs text-white/60 gap-2">
        <span>© 2026 Gardina. Барлық құқықтар қорғалған.</span>
        <span>Жасаған: <a href="https://aqulas.me" className="hover:text-white">Aqulas</a></span>
      </div>
    </footer>
  );
}

// ─── Floating WhatsApp button ────────────────────────────────────────────────
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

// ─── Main export ────────────────────────────────────────────────────────────
export default function Landing() {
  // Smooth-scroll for in-page anchors
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
