import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
  formatError,
} from '../../lib/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an app error with default status 500', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create an app error with custom status and code', () => {
      const error = new AppError('Test error', 400, 'CUSTOM_ERROR', { field: 'test' });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with status 400', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create a not found error with resource name and id', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with id '123' not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create an unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a forbidden error', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('ExternalServiceError', () => {
    it('should create an external service error', () => {
      const error = new ExternalServiceError('OpenAI', 'API rate limit exceeded');

      expect(error.message).toBe("External service 'OpenAI' error: API rate limit exceeded");
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    });
  });

  describe('formatError', () => {
    it('should format an AppError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const formatted = formatError(error);

      expect(formatted).toEqual({
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: { field: 'email' },
        },
      });
    });

    it('should format a generic Error', () => {
      const error = new Error('Something went wrong');
      const formatted = formatError(error);

      expect(formatted).toEqual({
        success: false,
        error: {
          message: 'Something went wrong',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    });
  });
});
