import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    this.logger.info('HTTP Request started', {
      module: 'LoggingInterceptor',
      method: 'intercept',
      httpMethod: method,
      url,
      userAgent,
      ip,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.logAPICall(
            method,
            url,
            response.statusCode,
            duration,
            'LoggingInterceptor',
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error('HTTP Request failed', error, {
            module: 'LoggingInterceptor',
            method: 'intercept',
            httpMethod: method,
            url,
            duration: `${duration}ms`,
            statusCode: response.statusCode,
            userId,
          });
        },
      }),
    );
  }
}
