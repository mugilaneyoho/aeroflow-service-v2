import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import * as Sentry from '@sentry/nestjs';
import { Observable } from 'rxjs';

// Global filter for RabbitMQ microservice: catches ALL exceptions and reports them to Sentry
@Catch()
export class SentryGlobalFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    Sentry.captureException(exception);
    return super.catch(exception, host);
  }
}
