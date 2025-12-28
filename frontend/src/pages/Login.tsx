import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ERROR_MESSAGES, mapErrorMessage } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';

type Step = 'phone' | 'code';

export function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      navigate('/');
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[var(--text-primary)] rounded flex items-center justify-center">
              <span className="text-white font-semibold text-lg">T</span>
            </div>
            <span className="font-medium text-lg text-[var(--text-primary)]">TDrive</span>
          </div>

          <h1 className="text-base font-medium text-center mb-6 text-[var(--text-primary)]">
            {step === 'phone' ? 'Sign in with Telegram' : 'Enter verification code'}
          </h1>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode}>
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className={cn(
                    'w-full px-3 py-2 rounded',
                    'border border-[var(--border-color)]',
                    'focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25',
                    'text-sm placeholder:text-[var(--text-placeholder)]',
                    'transition-shadow'
                  )}
                />
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
                disabled={!phone || isLoading}
                className={cn(
                  'w-full py-2 rounded',
                  'bg-[var(--text-primary)] text-white font-medium text-sm',
                  'hover:opacity-85 disabled:opacity-40',
                  'transition-opacity'
                )}
              >
                {isLoading ? 'Sending...' : 'Send Code'}
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
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="12345"
                  autoFocus
                  className={cn(
                    'w-full px-3 py-2 rounded text-center text-lg tracking-widest',
                    'border border-[var(--border-color)]',
                    'focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25',
                    'placeholder:text-[var(--text-placeholder)]',
                    'transition-shadow'
                  )}
                />
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
                  'w-full py-2 rounded',
                  'bg-[var(--text-primary)] text-white font-medium text-sm',
                  'hover:opacity-85 disabled:opacity-40',
                  'transition-opacity'
                )}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                className="w-full mt-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Use different number
              </button>
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
