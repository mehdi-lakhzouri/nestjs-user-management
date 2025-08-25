import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../database/schemas/user.schema';
import { AvatarService } from '../avatar/avatar.service';
import { AvatarUploadDto, AvatarUploadResponseDto } from '../avatar/dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar uploaded successfully',
    type: AvatarUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AvatarUploadResponseDto> {
    // Upload du fichier
    const avatarUrl = await this.avatarService.saveFile(file);
    
    // Récupération de l'ancien avatar pour le supprimer
    const currentUser = await this.usersService.findById(user.id);
    const oldAvatarUrl = currentUser.avatar;
    
    // Mise à jour de l'utilisateur avec la nouvelle URL d'avatar
    await this.usersService.update(user.id, { avatar: avatarUrl });
    
    // Suppression de l'ancien avatar s'il existe
    if (oldAvatarUrl) {
      await this.avatarService.deleteAvatar(oldAvatarUrl);
    }
    
    return {
      avatarUrl,
      message: 'Avatar uploaded successfully',
    };
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 204, description: 'Avatar deleted successfully' })
  async deleteAvatar(@CurrentUser() user: any): Promise<void> {
    const currentUser = await this.usersService.findById(user.id);
    
    if (currentUser.avatar) {
      // Suppression du fichier
      await this.avatarService.deleteAvatar(currentUser.avatar);
      
      // Mise à jour de l'utilisateur pour supprimer l'URL d'avatar
      await this.usersService.update(user.id, { avatar: undefined });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: any, 
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('Données reçues dans updateProfile:', {
      updateUserDto,
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size,
      userId: user.id
    });
    
    try {
      // Récupérer l'utilisateur actuel pour connaître l'ancien avatar
      const currentUser = await this.usersService.findById(user.id);
      const oldAvatarUrl = currentUser.avatar;
      
      // Préparer les données de mise à jour
      const updateData: Partial<UpdateUserDto> = {
        fullname: updateUserDto.fullname,
        email: updateUserDto.email,
        age: Number(updateUserDto.age), // S'assurer que c'est un nombre
        gender: updateUserDto.gender,
      };
      
      // Si un fichier avatar est fourni, le traiter
      if (file) {
        console.log('Traitement du fichier avatar:', file.originalname);
        
        // Valider et uploader le nouvel avatar
        const avatarUrl = await this.avatarService.saveFile(file);
        console.log('Avatar sauvegardé à l\'URL:', avatarUrl);
        
        // Ajouter l'URL du nouvel avatar aux données à mettre à jour
        updateData.avatar = avatarUrl;
        
        // Mettre à jour l'utilisateur avec le nouvel avatar
        const updatedUser = await this.usersService.update(user.id, updateData);
        
        // Supprimer l'ancien avatar s'il existe (après la mise à jour réussie)
        if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
          try {
            await this.avatarService.deleteAvatar(oldAvatarUrl);
            console.log('Ancien avatar supprimé:', oldAvatarUrl);
          } catch (deleteError) {
            console.warn('Erreur lors de la suppression de l\'ancien avatar:', deleteError);
            // Ne pas faire échouer la requête pour cette erreur
          }
        }
        
        console.log('Profil mis à jour avec avatar:', updatedUser);
        return updatedUser;
      } else {
        // Pas de fichier, mise à jour des données utilisateur seulement
        console.log('Mise à jour du profil sans fichier');
        const updatedUser = await this.usersService.update(user.id, updateData);
        console.log('Profil mis à jour:', updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Update user by ID (Admin/Moderator only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
