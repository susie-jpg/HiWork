import { Alert, Button, Checkbox, Divider, Input, Select } from '@arco-design/web-react';
import { Earth, Lock, Right, Shield, User } from '@icon-park/react';
import AppLoader from '@renderer/components/layout/AppLoader';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { changeLanguage } from '@/renderer/services/i18n';
import { useAuth } from '../../hooks/context/AuthContext';
import { getEnterpriseLoginConfig } from './enterpriseConfig';
import styles from './LoginPage.module.css';

type MessageState = { type: 'error' | 'success'; text: string };

const REMEMBER_ME_KEY = 'rememberMe';
const REMEMBERED_USERNAME_KEY = 'rememberedUsername';
const LEGACY_REMEMBERED_PASSWORD_KEY = 'rememberedPassword';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, login } = useAuth();
  const enterpriseConfig = useMemo(getEnterpriseLoginConfig, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [loading, setLoading] = useState(false);
  const messageTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = enterpriseConfig.brandName;
  }, [enterpriseConfig.brandName, i18n.language]);

  useEffect(() => {
    const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (shouldRemember) {
      setUsername(localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? '');
      setRememberMe(true);
    }
    localStorage.removeItem(LEGACY_REMEMBERED_PASSWORD_KEY);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') void navigate('/guid', { replace: true });
  }, [navigate, status]);

  const supportedLanguages = useMemo(
    () => [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'zh-TW', label: '繁體中文' },
      { code: 'ja-JP', label: '日本語' },
      { code: 'ko-KR', label: '한국어' },
      { code: 'tr-TR', label: 'Türkçe' },
      { code: 'uk-UA', label: 'Українська' },
      { code: 'pt-BR', label: 'Português (BR)' },
      { code: 'de-DE', label: 'Deutsch' },
      { code: 'es-ES', label: 'Español' },
      { code: 'fr-FR', label: 'Français' },
      { code: 'fa-IR', label: 'فارسی' },
      { code: 'ru-RU', label: 'Русский' },
      { code: 'en-US', label: 'English' },
    ],
    []
  );

  const showMessage = useCallback((next: MessageState) => {
    setMessage(next);
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    if (next.type === 'error') messageTimer.current = window.setTimeout(() => setMessage(null), 5000);
  }, []);

  const handleLanguageChange = useCallback((nextLanguage: string) => {
    changeLanguage(nextLanguage).catch((error: Error) => console.error('Failed to change language:', error));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmedUsername = username.trim();
      if (!trimmedUsername || !password) {
        showMessage({ type: 'error', text: t('login.errors.empty') });
        return;
      }

      setLoading(true);
      setMessage(null);
      const result = await login({ username: trimmedUsername, password, remember: rememberMe });
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBERED_USERNAME_KEY, trimmedUsername);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBERED_USERNAME_KEY);
        }
        setPassword('');
        showMessage({ type: 'success', text: t('login.success') });
        window.setTimeout(() => {
          void navigate('/guid', { replace: true });
        }, 600);
      } else {
        const errorText = (() => {
          switch (result.code) {
            case 'invalidCredentials':
              return t('login.errors.invalidCredentials');
            case 'tooManyAttempts':
              return t('login.errors.tooManyAttempts');
            case 'networkError':
              return t('login.errors.networkError');
            case 'serverError':
              return t('login.errors.serverError');
            default:
              return result.message ?? t('login.errors.unknown');
          }
        })();
        showMessage({ type: 'error', text: errorText });
      }
      setLoading(false);
    },
    [login, navigate, password, rememberMe, showMessage, t, username]
  );

  if (status === 'checking') return <AppLoader />;
  const hasProviders = enterpriseConfig.authProviders.length > 0;

  return (
    <main className={styles.page}>
      <section className={styles.context} aria-label={t('login.workspaceOverview')}>
        <div className={styles.brandLockup}>
          {enterpriseConfig.logoUrl ? (
            <img src={enterpriseConfig.logoUrl} alt='' className={styles.logo} />
          ) : (
            <span className={styles.logoMark} aria-hidden='true'>
              H
            </span>
          )}
          <span>{enterpriseConfig.brandName}</span>
        </div>
        <div className={styles.contextCopy}>
          <p className={styles.eyebrow}>{t('login.enterpriseWorkspace')}</p>
          <h1>{t('login.workspaceTitle')}</h1>
          <p>{t('login.workspaceDescription')}</p>
        </div>
        <div className={styles.statusPanel}>
          <div>
            <Shield size={18} />
            <span>{t('login.status.identity')}</span>
            <strong>{t('login.status.ready')}</strong>
          </div>
          <div>
            <Earth size={18} />
            <span>{t('login.status.workspace')}</span>
            <strong>{t('login.status.connected')}</strong>
          </div>
        </div>
      </section>

      <section className={styles.access}>
        <div className={styles.accessHeader}>
          <Select
            aria-label={t('login.languageToggle')}
            value={i18n.language}
            onChange={handleLanguageChange}
            className={styles.languageSelect}
          >
            {supportedLanguages.map((language) => (
              <Select.Option key={language.code} value={language.code}>
                {language.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className={styles.formShell}>
          <div className={styles.formHeading}>
            <p className={styles.eyebrow}>{enterpriseConfig.brandName}</p>
            <h2>{t('login.accessTitle')}</h2>
            <p>
              {t(
                hasProviders && !enterpriseConfig.passwordLoginEnabled
                  ? 'login.ssoAccessDescription'
                  : 'login.accessDescription'
              )}
            </p>
          </div>

          {hasProviders && (
            <div className={styles.providerList}>
              {enterpriseConfig.authProviders.map((provider) => (
                <Button
                  key={provider.id}
                  size='large'
                  long
                  icon={<Shield />}
                  onClick={() => window.location.assign(provider.loginUrl)}
                >
                  <span>
                    {provider.label ?? t('login.continueWithProvider', { provider: provider.protocol.toUpperCase() })}
                  </span>
                  <Right className={styles.buttonArrow} />
                </Button>
              ))}
            </div>
          )}

          {hasProviders && enterpriseConfig.passwordLoginEnabled && <Divider>{t('login.orPassword')}</Divider>}

          {enterpriseConfig.passwordLoginEnabled && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor='username'>{t('login.username')}</label>
              <Input
                autoFocus
                id='username'
                name='username'
                size='large'
                prefix={<User />}
                placeholder={t('login.usernamePlaceholder')}
                autoComplete='username'
                value={username}
                onChange={setUsername}
              />
              <label htmlFor='password'>{t('login.password')}</label>
              <Input.Password
                id='password'
                name='password'
                size='large'
                prefix={<Lock />}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete='current-password'
                value={password}
                onChange={setPassword}
              />
              <Checkbox checked={rememberMe} onChange={setRememberMe}>
                {t('login.rememberUsername')}
              </Checkbox>
              <Button type='primary' htmlType='submit' size='large' long loading={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>
          )}

          {!enterpriseConfig.passwordLoginEnabled && !hasProviders && (
            <Alert type='warning' content={t('login.noMethods')} />
          )}
          {message && <Alert className={styles.message} type={message.type} content={message.text} />}
          <p className={styles.securityNote}>
            <Shield size={14} />
            {t('login.securityNote')}
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
