import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes Sentry if not already initialized.
 */
export default function initSentry(): typeof Sentry {
  if (!Sentry.isInitialized()) {
    Sentry.init({
      dsn: process.env.BETTER_STACK_ERROR_DSN!,
      tracesSampleRate: 1.0,
      release: 'esmos-monitor@1.0.0',
    });
  }

  return Sentry;
}
