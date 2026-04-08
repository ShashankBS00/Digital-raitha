import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const Signup = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateName = (value) => {
    if (!value.trim()) return t('nameRequired') || 'Full name is required';
    if (value.trim().length < 2) return t('nameTooShort') || 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return t('emailRequired') || 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('enterValidEmail') || 'Please enter a valid email';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return t('passwordRequired') || 'Password is required';
    if (value.length < 8) return t('passwordMin8') || 'At least 8 characters required';
    if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return 'Must contain a digit';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return 'Must contain a special character';
    return '';
  };

  const validateConfirmPassword = (value, pass = password) => {
    if (!value) return 'Please confirm your password';
    if (value !== pass) return "Passwords don't match";
    return '';
  };

  const getPasswordStrength = (value) => {
    if (!value) return { level: 0, label: '', color: '' };
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f97316' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#eab308' };
    if (score <= 4) return { level: 4, label: 'Strong', color: '#22c55e' };
    return { level: 5, label: 'Very Strong', color: '#16a34a' };
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let err = '';
    switch (field) {
      case 'fullName': err = validateName(fullName); break;
      case 'email': err = validateEmail(email); break;
      case 'password': err = validatePassword(password); break;
      case 'confirmPassword': err = validateConfirmPassword(confirmPassword); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      let err = '';
      switch (field) {
        case 'fullName': err = validateName(value); break;
        case 'email': err = validateEmail(value); break;
        case 'password':
          err = validatePassword(value);
          if (touched.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, value) }));
          }
          break;
        case 'confirmPassword': err = validateConfirmPassword(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const errors = {
      fullName: validateName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };
    setFieldErrors(errors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (Object.values(errors).some(err => err !== '')) return;

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
    } catch (err) {
      let msg = '';
      switch (err.code) {
        case 'auth/email-already-in-use': msg = 'Email already in use'; break;
        case 'auth/invalid-email': msg = 'Invalid email address'; break;
        case 'auth/weak-password': msg = 'Password is too weak'; break;
        default: msg = 'Failed to create account. Please try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const s = {
    container: { padding: '28px 32px', fontFamily: "'Inter', sans-serif" },
    heading: { fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 4px' },
    subheading: { textAlign: 'center', color: 'rgba(187,247,208,0.8)', fontSize: 13, marginBottom: 22 },
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
      marginBottom: 16,
    },
    label: { display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, marginBottom: 6, letterSpacing: '0.3px' },
    inputWrap: { position: 'relative', marginBottom: 14 },
    input: {
      width: '100%',
      padding: '11px 16px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 12,
      color: '#ffffff',
      fontSize: 14,
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      backdropFilter: 'blur(4px)',
      boxSizing: 'border-box',
    },
    inputError: { border: '1px solid rgba(248,113,113,0.6)', background: 'rgba(220,38,38,0.1)' },
    eyeBtn: {
      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex',
    },
    fieldError: { color: '#fca5a5', fontSize: 12, marginTop: -8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 },
    submitBtn: {
      width: '100%',
      padding: '13px',
      borderRadius: 12,
      border: 'none',
      background: loading ? 'rgba(34,197,94,0.5)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#fff',
      fontSize: 15,
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.4)',
      transition: 'all 0.2s',
      marginTop: 6,
      fontFamily: "'Inter', sans-serif",
    },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' },
    dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' },
    dividerText: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
    switchText: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    switchBtn: {
      background: 'none', border: 'none', color: '#4ade80', fontWeight: 700,
      cursor: 'pointer', fontSize: 14, padding: 0, marginLeft: 4, fontFamily: "'Inter', sans-serif",
    },
  };

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const renderError = (field) => {
    if (!fieldErrors[field] || !touched[field]) return null;
    return (
      <p style={s.fieldError}>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fieldErrors[field]}
      </p>
    );
  };

  return (
    <div style={s.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(20,80,40,0.8) inset !important;
          -webkit-text-fill-color: #fff !important;
          border-radius: 12px !important;
        }
        .su-input:focus { border-color: rgba(74,222,128,0.6) !important; box-shadow: 0 0 0 3px rgba(74,222,128,0.12) !important; }
        .su-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(34,197,94,0.5) !important; }
        .su-link:hover { color: #86efac !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <h2 style={s.heading}>Create Account 🌱</h2>
      <p style={s.subheading}>Join the Digital Raitha community</p>

      {error && (
        <div style={s.errorBox}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} noValidate>
        {/* Full Name */}
        <div>
          <label htmlFor="signup-name" style={s.label}>{t('fullName') || 'Full Name'}</label>
          <div style={s.inputWrap}>
            <input
              id="signup-name" type="text" value={fullName} disabled={loading}
              onChange={(e) => handleFieldChange('fullName', e.target.value, setFullName)}
              onBlur={() => handleBlur('fullName')}
              placeholder={t('enterFullName') || 'Enter your full name'}
              className="su-input"
              style={{ ...s.input, ...(fieldErrors.fullName && touched.fullName ? s.inputError : {}) }}
            />
          </div>
          {renderError('fullName')}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" style={s.label}>{t('email') || 'Email'}</label>
          <div style={s.inputWrap}>
            <input
              id="signup-email" type="email" value={email} disabled={loading}
              onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
              onBlur={() => handleBlur('email')}
              placeholder={t('enterEmail') || 'Enter your email'}
              className="su-input"
              style={{ ...s.input, ...(fieldErrors.email && touched.email ? s.inputError : {}) }}
            />
          </div>
          {renderError('email')}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" style={s.label}>{t('password') || 'Password'}</label>
          <div style={{ ...s.inputWrap, marginBottom: 4 }}>
            <input
              id="signup-password" type={showPassword ? 'text' : 'password'} value={password} disabled={loading}
              onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
              onBlur={() => handleBlur('password')}
              placeholder="Create a strong password"
              className="su-input"
              style={{ ...s.input, paddingRight: 44, ...(fieldErrors.password && touched.password ? s.inputError : {}) }}
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {renderError('password')}

          {/* Strength bar */}
          {password && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} style={{
                    height: 4, flex: 1, borderRadius: 4,
                    background: level <= passwordStrength.level ? passwordStrength.color : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: passwordStrength.color, margin: 0 }}>
                {t('passwordStrength') || 'Strength'}: <b>{passwordStrength.label}</b>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="signup-confirm" style={s.label}>{t('confirmPassword') || 'Confirm Password'}</label>
          <div style={{ ...s.inputWrap, marginBottom: 4 }}>
            <input
              id="signup-confirm" type={showConfirm ? 'text' : 'password'} value={confirmPassword} disabled={loading}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder={t('reenterPassword') || 'Re-enter your password'}
              className="su-input"
              style={{ ...s.input, paddingRight: 44, ...(fieldErrors.confirmPassword && touched.confirmPassword ? s.inputError : {}) }}
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
          {renderError('confirmPassword')}
        </div>

        <button id="signup-submit" type="submit" disabled={loading} className="su-btn" style={s.submitBtn}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('creatingAccount') || 'Creating account...'}
            </span>
          ) : (t('signup') || 'Create Account')}
        </button>
      </form>

      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>or</span>
        <div style={s.dividerLine} />
      </div>

      <p style={s.switchText}>
        {t('alreadyHaveAccount') || 'Already have an account?'}
        <button onClick={onSwitchToLogin} disabled={loading} style={s.switchBtn} className="su-link">
          {t('login') || 'Log In'}
        </button>
      </p>
    </div>
  );
};

export default Signup;