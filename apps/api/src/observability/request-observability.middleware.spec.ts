import type { NextFunction, Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { RequestObservabilityMiddleware } from './request-observability.middleware';

describe('RequestObservabilityMiddleware', () => {
  const createResponse = () => {
    const response = new EventEmitter() as EventEmitter &
      Pick<Response, 'setHeader' | 'statusCode'>;
    response.statusCode = 200;
    response.setHeader = jest.fn();
    return response;
  };

  it('preserves a valid incoming request id and exposes it in the response', () => {
    const middleware = new RequestObservabilityMiddleware();
    const request = {
      header: jest.fn().mockReturnValue('request-123'),
      method: 'GET',
      path: '/health/live',
    } as unknown as Request;
    const response = createResponse();
    const next = jest.fn() as NextFunction;

    middleware.use(request, response as unknown as Response, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'request-123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request id when the incoming value is unusable', () => {
    const middleware = new RequestObservabilityMiddleware();
    const request = {
      header: jest.fn().mockReturnValue('x'.repeat(129)),
      method: 'GET',
      path: '/health/ready',
    } as unknown as Request;
    const response = createResponse();

    middleware.use(
      request,
      response as unknown as Response,
      jest.fn() as NextFunction,
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    );
  });
});
