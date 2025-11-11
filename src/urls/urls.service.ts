import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Url } from './entities/url.entity';

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url)
    private urlsRepository: Repository<Url>,
  ) {}

  async create(createUrlDto: CreateUrlDto): Promise<Url> {
    // Check if short code already exists
    const existingUrl = await this.urlsRepository.findOne({
      where: { shortCode: createUrlDto.shortCode },
    });

    if (existingUrl) {
      throw new ConflictException('Short code already exists');
    }

    const url = this.urlsRepository.create(createUrlDto);
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
    const url = await this.urlsRepository.findOne({ where: { shortCode } });
    if (!url) {
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
    
    // Increment click counter
    url.clicks += 1;
    await this.urlsRepository.save(url);
    
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
