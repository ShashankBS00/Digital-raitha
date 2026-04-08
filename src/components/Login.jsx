import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onSwitchToSignup }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateEmail = (value) => {
    if (!value.trim()) return t('emailRequired') || 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('enterValidEmail') || 'Please enter a valid email';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return t('passwordRequired') || 'Password is required';
    if (value.length < 6) return t('passwordTooShort') || 'At least 6 characters required';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let err = '';
    if (field === 'email') err = validateEmail(email);
    if (field === 'password') err = validatePassword(password);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      let err = '';
      if (field === 'email') err = validateEmail(value);
      if (field === 'password') err = validatePassword(value);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setFieldErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });
    if (emailErr || passErr) return;

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let msg = '';
      switch (err.code) {
        case 'auth/invalid-email': msg = t('invalidEmail') || 'Invalid email address'; break;
        case 'auth/user-disabled': msg = t('userDisabled') || 'Account has been disabled'; break;
        case 'auth/user-not-found': msg = t('userNotFound') || 'No user found with this email'; break;
        case 'auth/wrong-password': msg = t('wrongPassword') || 'Incorrect password'; break;
        case 'auth/invalid-credential': msg = t('invalidCredential') || 'Invalid email or password'; break;
        default: msg = t('loginFailed') || 'Login failed. Please try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      padding: '36px 32px',
    },
    heading: {
      fontSize: 26,
      fontWeight: 700,
      color: '#ffffff',
      textAlign: 'center',
      margin: '0 0 4px',
      fontFamily: "'Inter', sans-serif",
    },
    subheading: {
      textAlign: 'center',
      color: 'rgba(187,247,208,0.8)',
      fontSize: 14,
      marginBottom: 28,
      fontFamily: "'Inter', sans-serif",
    },
    errorBox: {
      background: 'rgba(220,38,38,0.15)',
      border: '1px solid rgba(220,38,38,0.35)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#fca5a5',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18,
      fontFamily: "'Inter', sans-serif",
    },
    label: {
      display: 'block',
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 7,
      fontFamily: "'Inter', sans-serif",
      letterSpacing: '0.3px',
    },
    inputWrap: {
      position: 'relative',
      marginBottom: 18,
    },
    input: {
      width: '100%',
      padding: '13px 16px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 12,
      color: '#ffffff',
      fontSize: 15,
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: "'Inter', sans-serif",
      backdropFilter: 'blur(4px)',
      boxSizing: 'border-box',
    },
    inputError: {
      border: '1px solid rgba(248,113,113,0.6)',
      background: 'rgba(220,38,38,0.1)',
    },
    inputPlaceholder: {
      color: 'rgba(255,255,255,0.4)',
    },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'rgba(255,255,255,0.5)',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    },
    fieldError: {
      color: '#fca5a5',
      fontSize: 12,
      marginTop: -12,
      marginBottom: 14,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      borderRadius: 12,
      border: 'none',
      background: loading
        ? 'rgba(34,197,94,0.5)'
        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#fff',
      fontSize: 16,
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: "'Inter', sans-serif",
      letterSpacing: '0.3px',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.4)',
      transition: 'all 0.2s',
      marginTop: 4,
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '20px 0',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      background: 'rgba(255,255,255,0.12)',
    },
    dividerText: {
      color: 'rgba(255,255,255,0.35)',
      fontSize: 12,
      fontFamily: "'Inter', sans-serif",
    },
    switchText: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      fontFamily: "'Inter', sans-serif",
    },
    switchBtn: {
      background: 'none',
      border: 'none',
      color: '#4ade80',
      fontWeight: 700,
      cursor: 'pointer',
      fontSize: 14,
      fontFamily: "'Inter', sans-serif",
      padding: 0,
      marginLeft: 4,
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(20,80,40,0.8) inset !important;
          -webkit-text-fill-color: #fff !important;
          border-radius: 12px !important;
        }
        .login-input:focus {
          border-color: rgba(74,222,128,0.6) !important;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.12) !important;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(34,197,94,0.5) !important;
        }
        .login-switch:hover { color: #86efac !important; }
      `}</style>

      <h2 style={styles.heading}>Welcome Back 👋</h2>
      <p style={styles.subheading}>Log in to your account</p>

      {error && (
        <div style={styles.errorBox}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" style={styles.label}>{t('email') || 'Email'}</label>
          <div style={styles.inputWrap}>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
              onBlur={() => handleBlur('email')}
              placeholder={t('enterEmail') || 'Enter your email'}
              disabled={loading}
              className="login-input"
              style={{
                ...styles.input,
                ...(fieldErrors.email && touched.email ? styles.inputError : {}),
              }}
            />
          </div>
          {fieldErrors.email && touched.email && (
            <p style={styles.fieldError}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" style={styles.label}>{t('password') || 'Password'}</label>
          <div style={{ ...styles.inputWrap, marginBottom: 6 }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
              onBlur={() => handleBlur('password')}
              placeholder={t('enterPassword') || 'Enter your password'}
              disabled={loading}
              className="login-input"
              style={{
                ...styles.input,
                paddingRight: 46,
                ...(fieldErrors.password && touched.password ? styles.inputError : {}),
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              style={styles.eyeBtn}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && touched.password && (
            <p style={{ ...styles.fieldError, marginBottom: 10 }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: 20, marginTop: 2 }}>
          <button type="button" style={{ ...styles.switchBtn, fontSize: 13 }} className="login-switch">
            Forgot password?
          </button>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="login-submit"
          style={styles.submitBtn}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('loggingIn') || 'Signing in...'}
            </span>
          ) : (t('login') || 'Login')}
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine} />
      </div>

      <p style={styles.switchText}>
        {t('noAccount') || "Don't have an account?"}
        <button
          onClick={onSwitchToSignup}
          disabled={loading}
          style={styles.switchBtn}
          className="login-switch"
        >
          {t('signup') || 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default Login;