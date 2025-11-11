import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Url } from './entities/url.entity';

describe('UrlsController', () => {
  let controller: UrlsController;
  let service: UrlsService;

  const mockUrl: Url = {
    id: 1,
    originalUrl: 'https://example.com',
    shortCode: 'abc123',
    clicks: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockUrlsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByShortCode: jest.fn(),
    findByShortCodeInfo: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlsController],
      providers: [
        {
          provide: UrlsService,
          useValue: mockUrlsService,
        },
      ],
    }).compile();

    controller = module.get<UrlsController>(UrlsController);
    service = module.get<UrlsService>(UrlsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new short URL', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      mockUrlsService.create.mockResolvedValue(mockUrl);
      process.env.BASE_URL = 'http://short.ly';

      const result = await controller.create(createUrlDto);

      expect(result).toEqual({
        originalUrl: mockUrl.originalUrl,
        shortUrl: 'http://short.ly/abc123',
        shortCode: mockUrl.shortCode,
        clicks: mockUrl.clicks,
        createdAt: mockUrl.createdAt,
      });
      expect(service.create).toHaveBeenCalledWith(createUrlDto);
    });

    it('should use default BASE_URL if not set', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      mockUrlsService.create.mockResolvedValue(mockUrl);
      delete process.env.BASE_URL;

      const result = await controller.create(createUrlDto);

      expect(result.shortUrl).toBe('http://short.ly/abc123');
    });
  });

  describe('findAll', () => {
    it('should return an array of URLs', async () => {
      const urls = [mockUrl];
      mockUrlsService.findAll.mockResolvedValue(urls);

      const result = await controller.findAll();

      expect(result).toEqual(urls);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByShortCode', () => {
    it('should return URL info by short code', async () => {
      mockUrlsService.findByShortCodeInfo.mockResolvedValue(mockUrl);

      const result = await controller.findByShortCode('abc123');

      expect(result).toEqual(mockUrl);
      expect(service.findByShortCodeInfo).toHaveBeenCalledWith('abc123');
    });

    it('should trim whitespace from short code', async () => {
      mockUrlsService.findByShortCodeInfo.mockResolvedValue(mockUrl);

      await controller.findByShortCode('  abc123  ');

      expect(service.findByShortCodeInfo).toHaveBeenCalledWith('abc123');
    });

    it('should throw BadRequestException for empty short code', async () => {
      await expect(controller.findByShortCode('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.findByShortCode('   ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('redirect', () => {
    it('should redirect to original URL', async () => {
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockUrlsService.findByShortCode.mockResolvedValue(mockUrl);

      await controller.redirect('abc123', mockResponse);

      expect(service.findByShortCode).toHaveBeenCalledWith('abc123');
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://example.com',
      );
    });

    it('should trim whitespace from short code', async () => {
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockUrlsService.findByShortCode.mockResolvedValue(mockUrl);

      await controller.redirect('  abc123  ', mockResponse);

      expect(service.findByShortCode).toHaveBeenCalledWith('abc123');
    });

    it('should throw BadRequestException for empty short code', async () => {
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      await expect(controller.redirect('', mockResponse)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.redirect('   ', mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a URL', async () => {
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated.com',
      };
      const updatedUrl = { ...mockUrl, ...updateUrlDto };

      mockUrlsService.update.mockResolvedValue(updatedUrl);

      const result = await controller.update('1', updateUrlDto);

      expect(result).toEqual(updatedUrl);
      expect(service.update).toHaveBeenCalledWith(1, updateUrlDto);
    });

    it('should throw BadRequestException for invalid ID format', () => {
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated.com',
      };

      expect(() => controller.update('abc', updateUrlDto)).toThrow(
        BadRequestException,
      );
      expect(() => controller.update('abc', updateUrlDto)).toThrow(
        'Invalid ID format',
      );
    });

    it('should throw BadRequestException for negative ID', () => {
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated.com',
      };

      expect(() => controller.update('-1', updateUrlDto)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for zero ID', () => {
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated.com',
      };

      expect(() => controller.update('0', updateUrlDto)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a URL', async () => {
      mockUrlsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid ID format', () => {
      expect(() => controller.remove('abc')).toThrow(BadRequestException);
      expect(() => controller.remove('abc')).toThrow('Invalid ID format');
    });

    it('should throw BadRequestException for negative ID', () => {
      expect(() => controller.remove('-1')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero ID', () => {
      expect(() => controller.remove('0')).toThrow(BadRequestException);
    });
  });
});
