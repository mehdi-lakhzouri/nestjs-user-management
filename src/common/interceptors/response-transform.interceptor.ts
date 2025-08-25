import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // Skip transformation for certain routes (like Swagger docs)
        const request = context.switchToHttp().getRequest();
        const isApiDoc = request.url.includes('/api/docs');
        const isSwaggerResource = request.url.includes('swagger');
        
        if (isApiDoc || isSwaggerResource) {
          return data;
        }

        // Skip transformation if data is already in the correct format
        if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
          return data;
        }

        // Transform response
        return {
          statusCode: response.statusCode,
          message: this.getSuccessMessage(response.statusCode),
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return 'Success';
      case 201:
        return 'Created successfully';
      case 202:
        return 'Accepted';
      case 204:
        return 'No content';
      default:
        return 'Success';
    }
  }
}
