import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const token = params.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg(lang === 'kz' ? 'Токен жоқ' : 'Токен отсутствует');
      return;
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      })
      .catch((e) => {
        setStatus('error');
        setErrorMsg(e.response?.data?.error || (lang === 'kz' ? 'Растау сәтсіз аяқталды' : 'Не удалось подтвердить email'));
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-text-secondary text-sm">
              {lang === 'kz' ? 'Расталуда…' : 'Подтверждаем…'}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="check_circle" size={36} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {lang === 'kz' ? 'Email расталды!' : 'Email подтверждён!'}
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              {lang === 'kz'
                ? 'Бірнеше секундта бетке өтесіз…'
                : 'Сейчас перенаправим вас…'}
            </p>
            <Link to="/" className="block w-full py-3 bg-primary text-white rounded-2xl font-bold text-center">
              {lang === 'kz' ? 'Басты бет' : 'На главную'}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="error" size={36} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {lang === 'kz' ? 'Растау сәтсіз' : 'Ошибка подтверждения'}
            </h1>
            <p className="text-text-secondary text-sm mb-6">{errorMsg}</p>
            <Link to="/" className="block w-full py-3 bg-primary text-white rounded-2xl font-bold text-center">
              {lang === 'kz' ? 'Басты бет' : 'На главную'}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
