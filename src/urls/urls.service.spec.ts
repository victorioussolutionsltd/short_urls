import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';

describe('UrlsService', () => {
  let service: UrlsService;

  const mockUrl: Url = {
    id: 1,
    originalUrl: 'https://example.com',
    shortCode: 'abc123',
    clicks: 0,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new short URL', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      const result = await service.create(createUrlDto);

      expect(result).toEqual(mockUrl);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createUrlDto.originalUrl,
          shortCode: expect.any(String),
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid URL protocol', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'ftp://example.com',
      };

      await expect(service.create(createUrlDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for URL without hostname', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'http://',
      };

      await expect(service.create(createUrlDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate unique short codes', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      // First call returns existing code, second returns null (unique)
      mockRepository.findOne
        .mockResolvedValueOnce(mockUrl)
        .mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      const result = await service.create(createUrlDto);

      expect(result).toEqual(mockUrl);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should create a URL with expiry when expiresInMinutes is provided', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        expiresInMinutes: 60,
      };

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 60);

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      await service.create(createUrlDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createUrlDto.originalUrl,
          shortCode: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should create a URL without expiry when expiresInMinutes is not provided', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      await service.create(createUrlDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createUrlDto.originalUrl,
          shortCode: expect.any(String),
          expiresAt: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of URLs', async () => {
      const urls = [mockUrl];
      mockRepository.find.mockResolvedValue(urls);

      const result = await service.findAll();

      expect(result).toEqual(urls);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no URLs exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a URL by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUrl);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUrl);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when URL not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'URL with ID 999 not found',
      );
    });
  });

  describe('findByShortCode', () => {
    it('should return URL and increment clicks', async () => {
      const urlWithClicks = { ...mockUrl, clicks: 5 };
      mockRepository.findOne.mockResolvedValue(urlWithClicks);
      mockRepository.save.mockResolvedValue({ ...urlWithClicks, clicks: 6 });

      const result = await service.findByShortCode('abc123');

      expect(result.clicks).toBe(6);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when short code not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByShortCode('invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByShortCode('invalid')).rejects.toThrow(
        'URL with short code invalid not found',
      );
    });

    it('should throw BadRequestException for empty short code', async () => {
      await expect(service.findByShortCode('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByShortCode('   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when URL has expired', async () => {
      const expiredUrl = {
        ...mockUrl,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockRepository.findOne.mockResolvedValue(expiredUrl);

      await expect(service.findByShortCode('abc123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByShortCode('abc123')).rejects.toThrow(
        'This short URL has expired',
      );
    });

    it('should not throw error for non-expired URL', async () => {
      const futureUrl = {
        ...mockUrl,
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      };
      mockRepository.findOne.mockResolvedValue(futureUrl);
      mockRepository.save.mockResolvedValue({ ...futureUrl, clicks: 1 });

      const result = await service.findByShortCode('abc123');

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByShortCodeInfo', () => {
    it('should return URL without incrementing clicks', async () => {
      const urlWithClicks = { ...mockUrl, clicks: 5 };
      mockRepository.findOne.mockResolvedValue(urlWithClicks);

      const result = await service.findByShortCodeInfo('abc123');

      expect(result.clicks).toBe(5);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when short code not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByShortCodeInfo('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for empty short code', async () => {
      await expect(service.findByShortCodeInfo('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when URL has expired', async () => {
      const expiredUrl = {
        ...mockUrl,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockRepository.findOne.mockResolvedValue(expiredUrl);

      await expect(service.findByShortCodeInfo('abc123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByShortCodeInfo('abc123')).rejects.toThrow(
        'This short URL has expired',
      );
    });
  });

  describe('update', () => {
    it('should update a URL', async () => {
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated.com',
      };
      const updatedUrl = { ...mockUrl, ...updateUrlDto };

      mockRepository.findOne.mockResolvedValue(mockUrl);
      mockRepository.save.mockResolvedValue(updatedUrl);

      const result = await service.update(1, updateUrlDto);

      expect(result).toEqual(updatedUrl);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when URL not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { originalUrl: 'https://test.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a URL', async () => {
      mockRepository.findOne.mockResolvedValue(mockUrl);
      mockRepository.remove.mockResolvedValue(mockUrl);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockUrl);
    });

    it('should throw NotFoundException when URL not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
