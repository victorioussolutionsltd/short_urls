import { IsNotEmpty, IsUrl, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
