import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUrlDto } from './create-url.dto';

describe('CreateUrlDto', () => {
  it('should validate a valid URL', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL with http protocol', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'http://example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for empty URL', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation for missing URL', async () => {
    const dto = plainToInstance(CreateUrlDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
  });

  it('should fail validation for URL without protocol', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });

  it('should fail validation for URL with invalid protocol', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'ftp://example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
  });

  it('should fail validation for non-string URL', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 12345,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
  });

  it('should fail validation for null URL', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: null,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should trim whitespace from URL', () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: '  https://example.com  ',
    });

    expect(dto.originalUrl).toBe('https://example.com');
  });

  it('should fail validation for URL exceeding max length', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: longUrl,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalUrl');
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('should validate URL with query parameters', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com/path?query=value&foo=bar',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL with hash fragment', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com/path#section',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL with port', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com:8080/path',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL with subdomain', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://subdomain.example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL with optional expiresInMinutes', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: 60,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate URL without expiresInMinutes', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for expiresInMinutes less than 1', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('expiresInMinutes');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation for negative expiresInMinutes', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: -10,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('expiresInMinutes');
  });

  it('should fail validation for expiresInMinutes exceeding maximum', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: 525601, // More than 1 year
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('expiresInMinutes');
    expect(errors[0].constraints).toHaveProperty('max');
  });

  it('should fail validation for non-integer expiresInMinutes', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: 10.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('expiresInMinutes');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('should convert string expiresInMinutes to number', async () => {
    const dto = plainToInstance(CreateUrlDto, {
      originalUrl: 'https://example.com',
      expiresInMinutes: '60',
    });

    expect(typeof dto.expiresInMinutes).toBe('number');
    expect(dto.expiresInMinutes).toBe(60);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
