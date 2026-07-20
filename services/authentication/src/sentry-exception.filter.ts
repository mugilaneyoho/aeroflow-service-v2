import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import * as Sentry from '@sentry/nestjs';
import { Observable } from 'rxjs';

// Global filter: catches ALL unhandled HTTP exceptions and reports them to Sentry
@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}

// Global filter: catches ALL unhandled microservice/gRPC exceptions and reports them to Sentry
@Catch()
export class SentryRpcFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    Sentry.captureException(exception);
    return super.catch(exception, host);
  }
}
