import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ERROR_MESSAGES, mapErrorMessage } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';

import { Logo } from '@/components/Logo';

type Step = 'phone' | 'code';

export function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Validate phone number format
  const validatePhone = (phoneNumber: string): boolean => {
    // Must start with + and have at least 10 digits
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');

    // Validate phone format before sending
    if (!validatePhone(phone)) {
      setPhoneError(ERROR_MESSAGES.INVALID_PHONE);
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await authApi.sendCode(phone);
      setTempToken(data.tempToken);
      setStep('code');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const backendMessage = axiosError.response?.data?.message;

      // Check for network errors
      if (!axiosError.response) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(mapErrorMessage(backendMessage) || ERROR_MESSAGES.SEND_CODE_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await authApi.verify(tempToken, code);
      login(data.accessToken);
      navigate('/drive');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const backendMessage = axiosError.response?.data?.message;

      // Check for network errors
      if (!axiosError.response) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(mapErrorMessage(backendMessage) || ERROR_MESSAGES.INVALID_CODE);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-lg p-6 shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_3px_6px_rgba(15,15,15,0.1),0_9px_24px_rgba(15,15,15,0.2)]">
          <Logo size="lg" className="justify-center mb-6" />

          <h1 className="text-base font-medium text-center mb-6 text-[var(--text-primary)] flex items-center justify-center gap-2">
            {step === 'phone' ? (
              <>
                Sign in with Telegram
                <img src="/telegram_logo.svg" alt="Telegram" className="w-5 h-5" />
              </>
            ) : (
              'Enter verification code'
            )}
          </h1>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode}>
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                  Phone number
                </label>
                <PhoneInput
                  defaultCountry="id"
                  value={phone}
                  onChange={(phone) => {
                    setPhone(phone);
                    setPhoneError('');
                  }}
                  inputClassName={cn(
                    phoneError && 'border-red-500'
                  )}
                  className="phone-input-custom"
                  autoFocus
                />
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Select your country and enter your phone number
                </p>
              </div>

              {error && (
                <Alert
                  variant="error"
                  message={error}
                  onDismiss={() => setError('')}
                  className="mb-4"
                />
              )}

              <button
                type="submit"
                disabled={!phone || isLoading || !validatePhone(phone)}
                className={cn(
                  'w-full py-2 rounded btn-primary',
                  'text-white font-medium text-sm',
                  'hover:opacity-85 disabled:opacity-40',
                  'transition-opacity'
                )}
              >
                {isLoading ? 'Sending Verification Code...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                We sent a code to your Telegram app
              </p>

              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setCode(value);
                    setError('');
                  }}
                  placeholder="12345"
                  maxLength={5}
                  autoComplete="one-time-code"
                  autoFocus
                  className={cn(
                    'w-full px-3 py-2 rounded text-center text-lg tracking-widest',
                    'border border-[var(--border-color)]',
                    'focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25',
                    'placeholder:text-[var(--text-placeholder)]',
                    'transition-shadow'
                  )}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1 text-center">
                  Check your Telegram app for the code
                </p>
              </div>

              {error && (
                <Alert
                  variant="error"
                  message={error}
                  onDismiss={() => setError('')}
                  className="mb-4"
                />
              )}

              <button
                type="submit"
                disabled={!code || isLoading}
                className={cn(
                  'w-full py-2 rounded btn-primary',
                  'text-white font-medium text-sm',
                  'hover:opacity-85 disabled:opacity-40',
                  'transition-opacity'
                )}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setError('');
                  }}
                  className="flex-1 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setIsLoading(true);
                    try {
                      const { data } = await authApi.sendCode(phone);
                      setTempToken(data.tempToken);
                      setCode('');
                    } catch (error) {
                      const axiosError = error as AxiosError<{ message: string }>;
                      const backendMessage = axiosError.response?.data?.message;
                      setError(mapErrorMessage(backendMessage) || ERROR_MESSAGES.SEND_CODE_FAILED);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2 text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 disabled:opacity-40 transition-colors"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-[var(--text-tertiary)] mt-4">
          Your files are stored in your Telegram Saved Messages
        </p>
      </div>
    </div>
  );
}
