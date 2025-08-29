import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Mot de passe actuel (temporaire ou ancien)', 
    example: 'TempPass123!' 
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    description: 'Nouveau mot de passe', 
    example: 'NewSecurePass123!',
    minLength: 8
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  )
  newPassword: string;

  @ApiProperty({ 
    description: 'Confirmation du nouveau mot de passe', 
    example: 'NewSecurePass123!' 
  })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
