import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter — XỬ LÝ LỖI TẬP TRUNG
 *
 * Mọi exception (lỗi validate, 404, 500, lỗi không biết...) đều đi qua đây
 * và được chuyển thành JSON thống nhất:
 *   { statusCode, message, path, timestamp }
 *
 * Vì sao cần: thay vì try-catch rải rác ở từng controller,
 * một filter duy nhất map exception -> HTTP status code phù hợp.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      // Lỗi có HTTP status rõ ràng (do NestJS/controller ném ra)
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const m = (res as { message?: string | string[] }).message;
        message = Array.isArray(m) ? m : (m ?? exception.message);
      }
    } else if (exception instanceof Error) {
      // Lỗi không mong đợi — log ra để biết mà sửa
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
