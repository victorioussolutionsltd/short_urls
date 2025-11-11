import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
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
    return this.urlsService.findOne(+id);
  }

  @Get('redirect/:shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ) {
    const url = await this.urlsService.findByShortCode(shortCode);
    return res.redirect(url.originalUrl);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUrlDto: UpdateUrlDto) {
    return this.urlsService.update(+id, updateUrlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.urlsService.remove(+id);
  }
}
