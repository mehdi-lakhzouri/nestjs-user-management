import { Injectable, LoggerService } from '@nestjs/common';

export interface LogContext {
  module: string;
  method?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface StructuredLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  module: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private formatLog(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: LogContext,
    error?: Error,
  ): string {
    const log: StructuredLog = {
      level,
      timestamp: new Date().toISOString(),
      module: context?.module || 'Unknown',
      message,
      context,
    };

    if (error) {
      log.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return JSON.stringify(log, null, 2);
  }

  info(message: string, context?: LogContext): void {
    process.stdout.write(this.formatLog('info', message, context) + '\n');
  }

  warn(message: string, context?: LogContext): void {
    process.stderr.write(this.formatLog('warn', message, context) + '\n');
  }

  error(message: string, error?: Error, context?: LogContext): void {
    process.stderr.write(
      this.formatLog('error', message, context, error) + '\n',
    );
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      process.stdout.write(this.formatLog('debug', message, context) + '\n');
    }
  }

  // Méthodes compatibles avec NestJS LoggerService
  log(message: string, context?: string): void {
    this.info(message, { module: context || 'Application' });
  }

  verbose(message: string, context?: string): void {
    this.debug(message, { module: context || 'Application' });
  }

  // Méthodes utilitaires pour des logs métier
  logUserAction(
    action: string,
    userId: string,
    module: string,
    details?: any,
  ): void {
    this.info(`User action: ${action}`, {
      module,
      userId,
      action,
      details,
    });
  }

  logAPICall(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    module: string,
  ): void {
    this.info(`API Call completed`, {
      module,
      method,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logDatabaseOperation(
    operation: string,
    collection: string,
    module: string,
    details?: any,
  ): void {
    this.info(`Database operation: ${operation}`, {
      module,
      operation,
      collection,
      details,
    });
  }

  logEmailSent(
    to: string,
    subject: string,
    module: string,
    success: boolean,
  ): void {
    const level = success ? 'info' : 'warn';
    const message = success
      ? 'Email sent successfully'
      : 'Email sending failed';

    if (success) {
      this.info(message, { module, to, subject, emailSent: true });
    } else {
      this.warn(message, { module, to, subject, emailSent: false });
    }
  }

  logAuthEvent(
    event: string,
    email: string,
    module: string,
    success: boolean,
    details?: any,
  ): void {
    const level = success ? 'info' : 'warn';
    const message = `Authentication event: ${event}`;

    if (success) {
      this.info(message, { module, event, email, success, details });
    } else {
      this.warn(message, { module, event, email, success, details });
    }
  }
}
