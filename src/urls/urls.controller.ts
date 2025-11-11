import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  async create(@Body() createUrlDto: CreateUrlDto): Promise<UrlResponseDto> {
    const url = await this.urlsService.create(createUrlDto);
    const baseUrl = process.env.BASE_URL || 'http://short.ly';
    
    return {
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  }

  @Get()
  findAll() {
    return this.urlsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const numericId = Number.parseInt(id, 10);
    if (Number.isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.urlsService.findOne(numericId);
  }

  @Get('redirect/:shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ) {
    // Validate shortCode is not empty
    if (!shortCode || shortCode.trim() === '') {
      throw new BadRequestException('Short code cannot be empty');
    }
    
    const url = await this.urlsService.findByShortCode(shortCode.trim());
    return res.redirect(url.originalUrl);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUrlDto: UpdateUrlDto) {
    const numericId = Number.parseInt(id, 10);
    if (Number.isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.urlsService.update(numericId, updateUrlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const numericId = Number.parseInt(id, 10);
    if (Number.isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.urlsService.remove(numericId);
  }
}
