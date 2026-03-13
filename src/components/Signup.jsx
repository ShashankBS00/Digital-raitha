import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const Signup = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation helpers
  const validateName = (value) => {
    if (!value.trim()) return t('nameRequired') || 'Full name is required';
    if (value.trim().length < 2) return t('nameTooShort') || 'Name must be at least 2 characters';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return t('phoneRequired') || 'Phone number is required';
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) return t('invalidPhone') || 'Please enter a valid 10-digit Indian mobile number';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return t('emailRequired') || 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('enterValidEmail') || 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return t('passwordRequired') || 'Password is required';
    if (value.length < 8) return t('passwordMin8') || 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return t('passwordUppercase') || 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return t('passwordLowercase') || 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return t('passwordDigit') || 'Password must contain at least one digit';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return t('passwordSpecial') || 'Password must contain at least one special character';
    return '';
  };

  const validateConfirmPassword = (value, pass = password) => {
    if (!value) return t('confirmPasswordRequired') || 'Please confirm your password';
    if (value !== pass) return t('passwordsDontMatch') || "Passwords don't match";
    return '';
  };

  const getPasswordStrength = (value) => {
    if (!value) return { level: 0, label: '', color: '' };
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) score++;

    if (score <= 1) return { level: 1, label: t('weak') || 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: t('fair') || 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { level: 3, label: t('good') || 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 4, label: t('strong') || 'Strong', color: 'bg-green-500' };
    return { level: 5, label: t('veryStrong') || 'Very Strong', color: 'bg-green-600' };
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let err = '';
    switch (field) {
      case 'fullName': err = validateName(fullName); break;
      case 'phone': err = validatePhone(phone); break;
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
        case 'phone': err = validatePhone(value); break;
        case 'email': err = validateEmail(value); break;
        case 'password':
          err = validatePassword(value);
          // Also re-validate confirm password if it's been touched
          if (touched.confirmPassword) {
            const cpErr = validateConfirmPassword(confirmPassword, value);
            setFieldErrors(prev => ({ ...prev, confirmPassword: cpErr }));
          }
          break;
        case 'confirmPassword': err = validateConfirmPassword(value); break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {
      fullName: validateName(fullName),
      phone: validatePhone(phone),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };
    setFieldErrors(errors);
    setTouched({ fullName: true, phone: true, email: true, password: true, confirmPassword: true });

    // Check if any errors
    if (Object.values(errors).some(err => err !== '')) return;

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });
      console.log('User signed up successfully');
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = '';
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = t('emailInUse') || 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = t('invalidEmail') || 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = t('weakPassword') || 'Password is too weak';
          break;
        default:
          errorMessage = t('signupFailed') || 'Failed to create account. Please try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const inputBaseClass = "w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:ring-2 focus:outline-none";
  const inputNormalClass = `${inputBaseClass} border-gray-300 focus:ring-green-500 focus:border-green-500`;
  const inputErrorClass = `${inputBaseClass} border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50`;

  const renderFieldError = (field) => {
    if (!fieldErrors[field] || !touched[field]) return null;
    return (
      <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fieldErrors[field]}
      </p>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {t('signup')}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} noValidate>
        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="signup-name" className="block text-gray-700 mb-1.5 text-sm font-medium">
            {t('fullName') || 'Full Name'}
          </label>
          <input
            type="text"
            id="signup-name"
            value={fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value, setFullName)}
            onBlur={() => handleBlur('fullName')}
            className={fieldErrors.fullName && touched.fullName ? inputErrorClass : inputNormalClass}
            placeholder={t('enterFullName') || 'Enter your full name'}
            disabled={loading}
          />
          {renderFieldError('fullName')}
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label htmlFor="signup-phone" className="block text-gray-700 mb-1.5 text-sm font-medium">
            {t('phoneNumber') || 'Phone Number'}
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border border-r-0 border-gray-300 rounded-l-lg text-sm font-medium">
              +91
            </span>
            <input
              type="tel"
              id="signup-phone"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleFieldChange('phone', val, setPhone);
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
          {renderFieldError('phone')}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="signup-email" className="block text-gray-700 mb-1.5 text-sm font-medium">
            {t('email')}
          </label>
          <input
            type="email"
            id="signup-email"
            value={email}
            onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
            onBlur={() => handleBlur('email')}
            className={fieldErrors.email && touched.email ? inputErrorClass : inputNormalClass}
            placeholder={t('enterEmail') || 'Enter your email address'}
            disabled={loading}
          />
          {renderFieldError('email')}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="signup-password" className="block text-gray-700 mb-1.5 text-sm font-medium">
            {t('password')}
          </label>
          <input
            type="password"
            id="signup-password"
            value={password}
            onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
            onBlur={() => handleBlur('password')}
            className={fieldErrors.password && touched.password ? inputErrorClass : inputNormalClass}
            placeholder={t('enterPassword') || 'Create a strong password'}
            disabled={loading}
          />
          {renderFieldError('password')}

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                passwordStrength.level <= 1 ? 'text-red-500' :
                passwordStrength.level <= 2 ? 'text-orange-500' :
                passwordStrength.level <= 3 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {t('passwordStrength') || 'Password strength'}: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label htmlFor="signup-confirm-password" className="block text-gray-700 mb-1.5 text-sm font-medium">
            {t('confirmPassword')}
          </label>
          <input
            type="password"
            id="signup-confirm-password"
            value={confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
            onBlur={() => handleBlur('confirmPassword')}
            className={fieldErrors.confirmPassword && touched.confirmPassword ? inputErrorClass : inputNormalClass}
            placeholder={t('reenterPassword') || 'Re-enter your password'}
            disabled={loading}
          />
          {renderFieldError('confirmPassword')}
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
              {t('creatingAccount') || 'Creating account...'}
            </span>
          ) : t('signup')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {t('alreadyHaveAccount')}{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-green-600 hover:text-green-700 font-medium"
            disabled={loading}
          >
            {t('login')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;