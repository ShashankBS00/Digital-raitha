import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onSwitchToSignup }) => {
  const { t } = useTranslation();
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const recaptchaVerifierRef = useRef(null);

  // Setup reCAPTCHA when phone mode is selected
  useEffect(() => {
    if (loginMode === 'phone') {
      // Small delay to ensure DOM element exists
      const timer = setTimeout(() => {
        if (!recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {
                console.log('reCAPTCHA solved');
              },
              'expired-callback': () => {
                setError(t('recaptchaExpired') || 'reCAPTCHA expired. Please try again.');
                recaptchaVerifierRef.current = null;
              }
            });
            recaptchaVerifierRef.current.render().then((widgetId) => {
              console.log('reCAPTCHA rendered, widget ID:', widgetId);
            }).catch((err) => {
              console.error('reCAPTCHA render error:', err);
            });
          } catch (err) {
            console.error('reCAPTCHA setup error:', err);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, [loginMode]);

  // Validation helpers
  const validateEmail = (value) => {
    if (!value.trim()) return t('emailRequired') || 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('enterValidEmail') || 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return t('passwordRequired') || 'Password is required';
    if (value.length < 6) return t('passwordTooShort') || 'Password should be at least 6 characters';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return t('phoneRequired') || 'Phone number is required';
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) return t('invalidPhone') || 'Please enter a valid 10-digit Indian mobile number';
    return '';
  };

  const validateOtp = (value) => {
    if (!value.trim()) return t('otpRequired') || 'OTP is required';
    if (value.length !== 6 || !/^\d{6}$/.test(value)) return t('invalidOtp') || 'Please enter a valid 6-digit OTP';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let err = '';
    switch (field) {
      case 'email': err = validateEmail(email); break;
      case 'password': err = validatePassword(password); break;
      case 'phone': err = validatePhone(phoneNumber); break;
      case 'otp': err = validateOtp(otp); break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      let err = '';
      switch (field) {
        case 'email': err = validateEmail(value); break;
        case 'password': err = validatePassword(value); break;
        case 'phone': err = validatePhone(value); break;
        case 'otp': err = validateOtp(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  // Email login handler
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
      console.log('User logged in successfully');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = '';
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = t('invalidEmail') || 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = t('userDisabled') || 'User account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = t('userNotFound') || 'No user found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = t('wrongPassword') || 'Incorrect password';
          break;
        case 'auth/invalid-credential':
          errorMessage = t('invalidCredential') || 'Invalid email or password';
          break;
        default:
          errorMessage = t('loginFailed') || 'Failed to login. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(phoneNumber);
    setFieldErrors({ phone: phoneErr });
    setTouched({ phone: true });

    if (phoneErr) return;

    setLoading(true);
    setError('');

    try {
      // Re-create reCAPTCHA if it was cleared (e.g. after a failed attempt)
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            setError(t('recaptchaExpired') || 'reCAPTCHA expired. Please try again.');
            recaptchaVerifierRef.current = null;
          }
        });
        await recaptchaVerifierRef.current.render();
      }

      const fullPhoneNumber = `+91${phoneNumber.replace(/\s/g, '')}`;
      console.log('Sending OTP to:', fullPhoneNumber);
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setOtpSent(true);
      setError('');
    } catch (err) {
      console.error('OTP send error:', err.code, err.message);
      // Clear reCAPTCHA so it gets recreated on next attempt
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }
      let errorMessage = '';
      switch (err.code) {
        case 'auth/invalid-phone-number':
          errorMessage = t('invalidMobileNumber') || 'Invalid phone number';
          break;
        case 'auth/too-many-requests':
          errorMessage = t('tooManyRequests') || 'Too many requests. Please try again later.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = t('quotaExceeded') || 'SMS quota exceeded. Please try again later.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Phone authentication is not enabled. Please enable it in Firebase Console.';
          break;
        case 'auth/missing-phone-number':
          errorMessage = t('phoneRequired') || 'Phone number is required';
          break;
        default:
          errorMessage = (t('otpSendFailed') || 'Failed to send OTP.') + ` (${err.code || err.message})`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpErr = validateOtp(otp);
    setFieldErrors({ otp: otpErr });
    setTouched({ otp: true });

    if (otpErr) return;

    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(otp);
      console.log('User logged in with phone successfully');
    } catch (err) {
      console.error('OTP verify error:', err);
      let errorMessage = '';
      switch (err.code) {
        case 'auth/invalid-verification-code':
          errorMessage = t('invalidOtp') || 'Invalid OTP. Please check and try again.';
          break;
        case 'auth/code-expired':
          errorMessage = t('otpExpired') || 'OTP has expired. Please request a new one.';
          break;
        default:
          errorMessage = t('otpVerifyFailed') || 'Failed to verify OTP. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneLogin = () => {
    setOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
    setFieldErrors({});
    setTouched({});
    setError('');
    // Clear reCAPTCHA so it gets recreated
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) { /* ignore */ }
      recaptchaVerifierRef.current = null;
    }
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    setFieldErrors({});
    setTouched({});
    setOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
  };

  const inputBaseClass = "w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 focus:outline-none";
  const inputNormalClass = `${inputBaseClass} border-gray-300 focus:ring-green-500 focus:border-green-500`;
  const inputErrorClass = `${inputBaseClass} border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50`;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {t('login')}
      </h2>

      {/* Login Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => switchMode('email')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            loginMode === 'email'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          {t('loginWithEmail') || 'Email'}
        </button>
        <button
          type="button"
          onClick={() => switchMode('phone')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            loginMode === 'phone'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          {t('loginWithMobile') || 'Mobile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Email Login Form */}
      {loginMode === 'email' && (
        <form onSubmit={handleEmailLogin} noValidate>
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-gray-700 mb-1.5 text-sm font-medium">
              {t('email')}
            </label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
              onBlur={() => handleBlur('email')}
              className={fieldErrors.email && touched.email ? inputErrorClass : inputNormalClass}
              placeholder={t('enterEmail') || 'Enter your email address'}
              disabled={loading}
            />
            {fieldErrors.email && touched.email && (
              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="login-password" className="block text-gray-700 mb-1.5 text-sm font-medium">
              {t('password')}
            </label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
              onBlur={() => handleBlur('password')}
              className={fieldErrors.password && touched.password ? inputErrorClass : inputNormalClass}
              placeholder={t('enterPassword') || 'Enter your password'}
              disabled={loading}
            />
            {fieldErrors.password && touched.password && (
              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loggingIn') || 'Logging in...'}
              </span>
            ) : t('login')}
          </button>
        </form>
      )}

      {/* Phone Login Form */}
      {loginMode === 'phone' && !otpSent && (
        <form onSubmit={handleSendOtp} noValidate>
          <div className="mb-6">
            <label htmlFor="login-phone" className="block text-gray-700 mb-1.5 text-sm font-medium">
              {t('mobileNumber') || 'Mobile Number'}
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border border-r-0 border-gray-300 rounded-l-lg text-sm font-medium">
                +91
              </span>
              <input
                type="tel"
                id="login-phone"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleFieldChange('phone', val, setPhoneNumber);
                }}
                onBlur={() => handleBlur('phone')}
                className={`flex-1 px-4 py-2.5 border rounded-r-lg transition-all duration-200 focus:ring-2 focus:outline-none ${
                  fieldErrors.phone && touched.phone
                    ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder={t('enterMobileNumber') || 'Enter 10-digit mobile number'}
                disabled={loading}
                maxLength={10}
              />
            </div>
            {fieldErrors.phone && touched.phone && (
              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.phone}
              </p>
            )}
            <p className="mt-2 text-gray-400 text-xs">
              {t('otpWillBeSent') || 'An OTP will be sent to this number for verification'}
            </p>
          </div>

          <button
            type="submit"
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('sendingOtp') || 'Sending OTP...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                {t('sendOTP') || 'Send OTP'}
              </span>
            )}
          </button>
        </form>
      )}

      {/* OTP Verification Form */}
      {loginMode === 'phone' && otpSent && (
        <form onSubmit={handleVerifyOtp} noValidate>
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('otpSentTo') || 'OTP sent to'} +91-{phoneNumber}
          </div>

          <div className="mb-6">
            <label htmlFor="login-otp" className="block text-gray-700 mb-1.5 text-sm font-medium">
              {t('enterOTP') || 'Enter OTP'}
            </label>
            <input
              type="text"
              id="login-otp"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                handleFieldChange('otp', val, setOtp);
              }}
              onBlur={() => handleBlur('otp')}
              className={`${fieldErrors.otp && touched.otp ? inputErrorClass : inputNormalClass} text-center text-lg tracking-[0.5em] font-mono`}
              placeholder="● ● ● ● ● ●"
              disabled={loading}
              maxLength={6}
              autoComplete="one-time-code"
            />
            {fieldErrors.otp && touched.otp && (
              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.otp}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('verifyingOtp') || 'Verifying...'}
              </span>
            ) : t('verifyOTP') || 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={resetPhoneLogin}
            className="w-full mt-3 text-green-600 hover:text-green-700 text-sm font-medium py-2 transition duration-200"
            disabled={loading}
          >
            ← {t('changeNumber') || 'Change number / Resend OTP'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {t('noAccount')}{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-green-600 hover:text-green-700 font-medium"
            disabled={loading}
          >
            {t('signup')}
          </button>
        </p>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;