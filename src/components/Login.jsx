import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onSwitchToSignup }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let err = '';
    switch (field) {
      case 'email': err = validateEmail(email); break;
      case 'password': err = validatePassword(password); break;
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

  const inputBaseClass = "w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 focus:outline-none";
  const inputNormalClass = `${inputBaseClass} border-gray-300 focus:ring-green-500 focus:border-green-500`;
  const inputErrorClass = `${inputBaseClass} border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50`;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {t('login')}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

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
    </div>
  );
};

export default Login;