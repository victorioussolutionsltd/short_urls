import { IsNotEmpty, IsUrl, IsOptional, IsString } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @IsOptional()
  @IsString()
  shortCode?: string;
}
