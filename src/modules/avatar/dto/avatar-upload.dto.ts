import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file (JPG/PNG, max 5MB)',
  })
  avatar: Express.Multer.File;
}

export class AvatarUploadResponseDto {
  @ApiProperty({
    description: 'URL of the uploaded avatar',
    example: '/uploads/avatars/avatar_123e4567-e89b-12d3-a456-426614174000_1640995200000.jpg',
  })
  avatarUrl: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Avatar uploaded successfully',
  })
  message: string;
}
