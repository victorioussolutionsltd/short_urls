export class UrlResponseDto {
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: Date;
  expiresAt?: Date;
}
