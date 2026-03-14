import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GenericExceptionFilter.name);

    private getSafeExceptionMessage(exception: unknown): string {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();

            if (typeof response === 'string') {
                return response;
            }

            if (
                response &&
                typeof response === 'object' &&
                'message' in response
            ) {
                const message = (response as { message?: unknown }).message;
                if (typeof message === 'string') {
                    return message;
                }
                if (Array.isArray(message)) {
                    return message
                        .filter((item) => typeof item === 'string')
                        .join(', ');
                }
            }

            return exception.message;
        }

        if (exception instanceof Error) {
            return exception.message;
        }

        return 'Unknown error';
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? this.getSafeExceptionMessage(exception)
                : 'Internal server error';

        const exceptionType =
            exception && typeof exception === 'object'
                ? ((exception as { constructor?: { name?: string } })
                      .constructor?.name ?? 'UnknownError')
                : 'UnknownError';

        // Log sanitized metadata only; avoid dumping raw exception objects.
        this.logger.error(
            JSON.stringify({
                event: 'Unhandled exception',
                type: exceptionType,
                status,
                method: request.method,
                path: request.url,
                message: this.getSafeExceptionMessage(exception),
            }),
        );

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: message,
            path: request.url,
        });
    }
}
