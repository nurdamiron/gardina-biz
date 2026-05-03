import React, { useState, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/common/Icon';

const MODES = {
  salon: 'salon',
  join: 'join',
};

function slugFromName(name) {
  const ascii = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return ascii.slice(0, 48);
}

const Register = () => {
  const navigate = useNavigate();
  const { register, registerSalon, error: authError, clearError, isAuthenticated, loading: authLoading } =
    useAuth();

  const [mode, setMode] = useState(MODES.salon);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const onOrgNameChange = useCallback(
    (value) => {
      setOrganizationName(value);
      if (mode === MODES.salon && !slugTouched) {
        const s = slugFromName(value);
        if (s) setOrganizationSlug(s);
      }
    },
    [mode, slugTouched]
  );

  const switchMode = (next) => {
    setMode(next);
    setLocalError(null);
    clearError();
    setOrganizationSlug('');
    setSlugTouched(false);
    if (next === MODES.join) {
      setOrganizationName('');
    }
  };

  const validate = () => {
    if (mode === MODES.salon) {
      if (!organizationName.trim()) return 'Салон атауын енгізіңіз';
      if (!organizationSlug.trim() || organizationSlug.trim().length < 2) {
        return 'Сілтеме коды (slug) кемінде 2 таңба, латын және сан';
      }
    } else {
      if (!organizationSlug.trim()) return 'Салон slug-ын енгізіңіз';
    }
    if (!name.trim()) return 'Аты-жөніңізді енгізіңіз';
    if (!phone.trim()) return 'Телефон немесе логин қажет';
    if (!password || password.length < 6) return 'Құпия сөз кемінде 6 таңба';
    if (password !== confirmPassword) return 'Құпия сөздер сәйкес емес';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const v = validate();
    if (v) {
      setLocalError(v);
      return;
    }

    setLoading(true);
    const slug = organizationSlug.trim().toLowerCase();
    let result;

    if (mode === MODES.salon) {
      result = await registerSalon({
        organizationName: organizationName.trim(),
        organizationSlug: slug,
        name: name.trim(),
        phone: phone.trim(),
        password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
    } else {
      result = await register({
        organizationSlug: slug,
        name: name.trim(),
        phone: phone.trim(),
        password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
    }

    setLoading(false);
    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/onboarding/plan', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const displayError = localError || authError;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light via-white to-primary/10 flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/images/logo-header.png" alt="Gardina" className="w-40 h-auto mx-auto mb-3 drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Тіркелу</h1>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">
            Жаңа салон ашыңыз немесе командаға қосылыңыз
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />

          <div className="p-6 sm:p-7">
            <div className="flex p-1 rounded-xl bg-gray-100/90 border border-gray-200/80 mb-6">
              <button
                type="button"
                onClick={() => switchMode(MODES.salon)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === MODES.salon
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <Icon name="storefront" size={18} />
                Жаңа салон
              </button>
              <button
                type="button"
                onClick={() => switchMode(MODES.join)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === MODES.join
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <Icon name="group_add" size={18} />
                Командаға
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="p-4 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3">
                  <Icon name="error" className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 leading-snug">{displayError}</p>
                </div>
              )}

              {mode === MODES.salon && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                      Салон атауы
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="store" size={20} className="text-text-secondary/80" />
                      </div>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => onOrgNameChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                        placeholder="Мысалы: Gardina Алматы"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                      Сілтеме коды (slug)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="link" size={20} className="text-text-secondary/80" />
                      </div>
                      <input
                        type="text"
                        value={organizationSlug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setOrganizationSlug(
                            e.target.value
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9-]/g, '')
                          );
                        }}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow font-mono text-sm"
                        placeholder="gardina-almaty"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Тек латын әріптері, сандар және дефис. Кіру кезінде осы код қажет болуы мүмкін.
                    </p>
                  </div>
                </>
              )}

              {mode === MODES.join && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                    Салон slug-ы
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="business" size={20} className="text-text-secondary/80" />
                    </div>
                    <input
                      type="text"
                      value={organizationSlug}
                      onChange={(e) =>
                        setOrganizationSlug(
                          e.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow font-mono text-sm"
                      placeholder="әкімші берген код"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5">
                    Әкімшіден алған салон идентификаторын енгізіңіз. Қоғамдық тіркелу өшік болса, бұл режим жұмыс істемейді.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  Аты-жөніңіз
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="badge" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="Толық аты"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  Телефон / логин
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="call" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="+7 … немесе логин"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  Email <span className="font-normal normal-case text-text-secondary/70">(қалауыңызша)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="mail" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  Құпия сөз
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="lock" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="Кемінде 6 таңба"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? 'Жасыру' : 'Көрсету'}
                  >
                    <Icon
                      name={showPassword ? 'visibility_off' : 'visibility'}
                      size={20}
                      className="text-text-secondary hover:text-primary"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  Құпия сөзді растаңыз
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="verified_user" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="Қайта енгізіңіз"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary hover:brightness-110 active:scale-[0.99] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Тіркелуде…
                  </>
                ) : (
                  <>
                    {mode === MODES.salon ? 'Салонды тіркеу' : 'Аккаунт құру'}
                    <Icon name="arrow_forward" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
              Аккаунтыңыз бар ма?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Кіру
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary/90 mt-6">
          © 2026 Gardina. Барлық құқықтар қорғалған.
        </p>
      </div>
    </div>
  );
};

export default Register;
