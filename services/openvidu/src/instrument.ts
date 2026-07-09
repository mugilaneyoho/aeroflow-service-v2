import * as dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/nestjs';

// This file MUST be the very first import in main.ts
// Sentry must initialize before NestJS bootstraps

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});


Sentry.setTag('service', 'openvidu');

