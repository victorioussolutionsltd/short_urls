import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { UrlsService } from './urls/urls.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly urlsService: UrlsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get(':shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ) {
    const url = await this.urlsService.findByShortCode(shortCode);
    return res.redirect(301, url.originalUrl);
  }
}
