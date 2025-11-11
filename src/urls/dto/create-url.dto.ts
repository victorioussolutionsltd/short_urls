import { IsNotEmpty, IsUrl, IsString, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'URL is required' })
  @IsString({ message: 'URL must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUrl(
    {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
    },
    { message: 'Please provide a valid URL with http:// or https:// protocol' }
  )
  @MaxLength(2048, { message: 'URL is too long (maximum 2048 characters)' })
  originalUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Expiry time must be an integer' })
  @Min(1, { message: 'Expiry time must be at least 1 minute' })
  @Max(525600, { message: 'Expiry time must not exceed 525600 minutes (1 year)' })
  expiresInMinutes?: number;
}
