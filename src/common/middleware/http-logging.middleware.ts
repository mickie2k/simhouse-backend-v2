import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_KEYS = new Set([
    'password',
    'newPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'idToken',
    'authorization',
    'cookie',
    'set-cookie',
    'clientSecret',
    'secret',
    'apiKey',
    'apikey',
]);

function redactSensitiveData(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveData(item));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).reduce(
            (acc, [key, val]) => {
                if (SENSITIVE_KEYS.has(key)) {
                    acc[key] = '[REDACTED]';
                    return acc;
                }

                acc[key] = redactSensitiveData(val);
                return acc;
            },
            {} as Record<string, unknown>,
        );
    }

    return value;
}

const logger = new Logger('HttpLogger');

export function httpLoggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const startedAt = Date.now();
    const path = req.originalUrl ?? req.url;

    const safeHeaders = redactSensitiveData({
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        'user-agent': req.headers['user-agent'],
        host: req.headers.host,
        origin: req.headers.origin,
    });

    logger.log(
        JSON.stringify({
            event: 'request',
            method: req.method,
            path,
            ip: req.ip,
            params: redactSensitiveData(req.params),
            query: redactSensitiveData(req.query),
            body: redactSensitiveData(req.body),
            headers: safeHeaders,
        }),
    );

    res.on('finish', () => {
        logger.log(
            JSON.stringify({
                event: 'response',
                method: req.method,
                path,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt,
            }),
        );
    });

    next();
}
