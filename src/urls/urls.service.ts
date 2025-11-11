import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Url } from './entities/url.entity';

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url)
    private readonly urlsRepository: Repository<Url>,
  ) {}

  /**
   * Generate a random short code
   */
  private generateShortCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Generate a unique short code that doesn't exist in the database
   */
  private async generateUniqueShortCode(): Promise<string> {
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = this.generateShortCode();
      const existing = await this.urlsRepository.findOne({
        where: { shortCode },
      });
      
      if (!existing) {
        return shortCode;
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    // If we can't find a unique code after max attempts, use a longer code
    return this.generateShortCode(8);
  }

  /**
   * Validate and normalize URL
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      
      // Additional validation: ensure URL has valid protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException(
          'Invalid URL protocol. Only http and https are allowed'
        );
      }
      
      // Ensure URL has a valid hostname
      if (!parsedUrl.hostname || parsedUrl.hostname === '') {
        throw new BadRequestException('URL must have a valid hostname');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Invalid URL format. Please provide a valid URL'
      );
    }
  }

  async create(createUrlDto: CreateUrlDto): Promise<Url> {
    // Validate the URL format
    this.validateUrl(createUrlDto.originalUrl);
    
    // Always generate a unique short code
    const shortCode = await this.generateUniqueShortCode();

    // Calculate expiration date if expiresInMinutes is provided
    let expiresAt: Date | null = null;
    if (createUrlDto.expiresInMinutes) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + createUrlDto.expiresInMinutes);
    }

    const url = this.urlsRepository.create({
      originalUrl: createUrlDto.originalUrl,
      shortCode,
      expiresAt,
    });
    return this.urlsRepository.save(url);
  }

  async findAll(): Promise<Url[]> {
    return this.urlsRepository.find();
  }

  async findOne(id: number): Promise<Url> {
    const url = await this.urlsRepository.findOne({ where: { id } });
    if (!url) {
      throw new NotFoundException(`URL with ID ${id} not found`);
    }
    return url;
  }

  async findByShortCode(shortCode: string): Promise<Url> {
    // Validate shortCode is not empty
    if (!shortCode || shortCode.trim() === '') {
      throw new BadRequestException('Short code cannot be empty');
    }
    
    const url = await this.urlsRepository.findOne({ where: { shortCode } });
    if (!url) {
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
    
    // Check if URL has expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      throw new BadRequestException('This short URL has expired');
    }
    
    // Increment click counter
    url.clicks += 1;
    await this.urlsRepository.save(url);
    
    return url;
  }

  async findByShortCodeInfo(shortCode: string): Promise<Url> {
    // Validate shortCode is not empty
    if (!shortCode || shortCode.trim() === '') {
      throw new BadRequestException('Short code cannot be empty');
    }
    
    const url = await this.urlsRepository.findOne({ where: { shortCode } });
    if (!url) {
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
    
    // Check if URL has expired (but still return info)
    if (url.expiresAt && new Date() > url.expiresAt) {
      throw new BadRequestException('This short URL has expired');
    }
    
    // Return the URL record without incrementing clicks
    return url;
  }

  async update(id: number, updateUrlDto: UpdateUrlDto): Promise<Url> {
    const url = await this.findOne(id);
    Object.assign(url, updateUrlDto);
    return this.urlsRepository.save(url);
  }

  async remove(id: number): Promise<void> {
    const url = await this.findOne(id);
    await this.urlsRepository.remove(url);
  }
}
