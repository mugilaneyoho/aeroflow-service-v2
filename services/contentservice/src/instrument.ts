import * as dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/nestjs';

// This file must be the FIRST import in main.ts
// It initializes Sentry before NestJS boots up

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set the environment (development / production)
  environment: process.env.NODE_ENV || 'development',

  // Captures 100% of transactions for performance tracing
  // Lower this (e.g. 0.1) in production to save quota
  tracesSampleRate: 1.0,

  // Captures 100% of sessions
  profilesSampleRate: 1.0,
});


Sentry.setTag('service', 'contentservice');

