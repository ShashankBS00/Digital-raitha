import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import agroIntelService from '../services/agroIntelService';

const FeedbackForm = ({ predictionId, onClose }) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState({
    accuracy_rating: 0,
    yield_actual: '',
    roi_actual: '',
    comments: '',
    would_recommend: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const feedbackData = {
        ...feedback,
        yield_actual: feedback.yield_actual ? parseFloat(feedback.yield_actual) : null,
        roi_actual: feedback.roi_actual ? parseFloat(feedback.roi_actual) : null,
        timestamp: new Date().toISOString()
      };
      
      await agroIntelService.submitFeedback(predictionId, feedbackData);
      setSubmitted(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(t('feedbackSubmissionError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIconWrapper}>
          <svg style={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={styles.successTitle}>{t('feedbackSubmitted')}</h3>
        <p style={styles.successMessage}>{t('thankYouForFeedback')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Accuracy Rating */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          {t('accuracyRating')}
        </label>
        <div style={styles.starsRow}>
          <div style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const isActive = rating <= (hoveredStar || feedback.accuracy_rating);
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, accuracy_rating: rating }))}
                  onMouseEnter={() => setHoveredStar(rating)}
                  onMouseLeave={() => setHoveredStar(0)}
                  style={{
                    ...styles.starButton,
                    color: isActive ? '#f59e0b' : '#d1d5db',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={`Rate ${rating} out of 5`}
                >
                  ★
                </button>
              );
            })}
          </div>
          <span style={styles.ratingText}>
            {feedback.accuracy_rating > 0 ? `${feedback.accuracy_rating}/5` : t('outOf5')}
          </span>
        </div>
      </div>

      {/* Actual Yield & ROI side by side */}
      <div style={styles.twoColumnRow}>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="feedback-yield">
            {t('actualYield')}
          </label>
          <div style={styles.inputWrapper}>
            <input
              id="feedback-yield"
              type="number"
              name="yield_actual"
              value={feedback.yield_actual}
              onChange={handleInputChange}
              placeholder={t('enterActualYield')}
              step="0.1"
              min="0"
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <span style={styles.inputSuffix}>kg/acre</span>
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="feedback-roi">
            {t('actualROI')}
          </label>
          <div style={styles.inputWrapper}>
            <input
              id="feedback-roi"
              type="number"
              name="roi_actual"
              value={feedback.roi_actual}
              onChange={handleInputChange}
              placeholder={t('enterActualROI')}
              step="0.1"
              min="0"
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <span style={styles.inputSuffix}>×</span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="feedback-comments">
          {t('additionalComments')}
        </label>
        <textarea
          id="feedback-comments"
          name="comments"
          value={feedback.comments}
          onChange={handleInputChange}
          placeholder={t('enterComments')}
          rows="3"
          style={styles.textarea}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Would Recommend */}
      <div style={styles.checkboxRow}>
        <label style={styles.toggleContainer} htmlFor="feedback-recommend">
          <input
            id="feedback-recommend"
            type="checkbox"
            name="would_recommend"
            checked={feedback.would_recommend}
            onChange={handleInputChange}
            style={styles.hiddenCheckbox}
          />
          <div style={{
            ...styles.toggleTrack,
            backgroundColor: feedback.would_recommend ? '#16a34a' : '#d1d5db',
          }}>
            <div style={{
              ...styles.toggleThumb,
              transform: feedback.would_recommend ? 'translateX(20px)' : 'translateX(2px)',
            }} />
          </div>
          <span style={styles.toggleLabel}>
            {t('wouldRecommend')}
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonsRow}>
        <button
          type="button"
          onClick={onClose}
          style={styles.cancelButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            ...styles.submitButton,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!submitting) e.target.style.backgroundColor = '#15803d'; }}
          onMouseLeave={(e) => { if (!submitting) e.target.style.backgroundColor = '#16a34a'; }}
        >
          {submitting ? (
            <span style={styles.spinnerRow}>
              <svg style={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('submitting')}
            </span>
          ) : (
            <>✓ {t('submitFeedback')}</>
          )}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  starsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  starsContainer: {
    display: 'flex',
    gap: '4px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '2px 4px',
    transition: 'color 0.15s ease, transform 0.15s ease',
    lineHeight: 1,
  },
  ratingText: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
    minWidth: '32px',
  },
  twoColumnRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    paddingRight: '60px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  },
  inputSuffix: {
    position: 'absolute',
    right: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '80px',
    boxSizing: 'border-box',
  },
  checkboxRow: {
    paddingTop: '4px',
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  toggleTrack: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    transition: 'background-color 0.2s ease',
    position: 'relative',
    flexShrink: 0,
  },
  toggleThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    position: 'absolute',
    top: '2px',
    transition: 'transform 0.2s ease',
  },
  toggleLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
  buttonsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  spinnerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    animation: 'spin 1s linear infinite',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    textAlign: 'center',
  },
  successIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  successIcon: {
    width: '28px',
    height: '28px',
    color: '#16a34a',
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#166534',
    margin: '0 0 6px 0',
  },
  successMessage: {
    fontSize: '14px',
    color: '#4ade80',
    margin: 0,
  },
};

export default FeedbackForm;