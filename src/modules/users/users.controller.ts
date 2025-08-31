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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { AppLoggerService } from '../../common/logger';
import { UserRole } from '../../database/schemas/user.schema';
import { AvatarService } from '../avatar/avatar.service';
import { AvatarUploadResponseDto } from '../avatar/dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description:
      'User created successfully. If no password provided, temporary password sent by email.',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    try {
      const result = await this.usersService.create(
        createUserDto,
        currentUser.fullname,
      );

      this.logger.info('User created by admin', {
        module: 'UsersController',
        createdUserId: result.user.id,
        createdUserEmail: result.user.email,
        adminId: currentUser.id,
        adminEmail: currentUser.email,
        temporaryPasswordGenerated: !!result.temporaryPassword,
      });

      // Retourner différentes réponses selon si un mot de passe temporaire a été généré
      if (result.temporaryPassword) {
        return {
          message:
            'Utilisateur créé avec succès. Un mot de passe temporaire a été envoyé par email.',
          user: {
            id: result.user.id,
            fullname: result.user.fullname,
            email: result.user.email,
            role: result.user.role,
            isActive: result.user.isActive,
            mustChangePassword: true,
          },
          temporaryPassword: result.temporaryPassword,
          emailSent: true,
        };
      } else {
        return {
          message: 'Utilisateur créé avec succès avec le mot de passe fourni.',
          user: {
            id: result.user.id,
            fullname: result.user.fullname,
            email: result.user.email,
            role: result.user.role,
            isActive: result.user.isActive,
            mustChangePassword: false,
          },
        };
      }
    } catch (createError) {
      this.logger.error('Failed to create user', createError, {
        module: 'UsersController',
        createUserDto,
        adminId: currentUser.id,
      });
      throw createError;
    }
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
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

  @Post(':id/avatar')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload avatar for specific user (Admin/Moderator only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully for user',
    type: AvatarUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async uploadAvatarForUser(
    @Param('id') userId: string,
    @CurrentUser() currentUser: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AvatarUploadResponseDto> {
    this.logger.info('Avatar upload for user initiated by admin/moderator', {
      module: 'UsersController',
      method: 'uploadAvatarForUser',
      targetUserId: userId,
      adminId: currentUser.id,
      adminRole: currentUser.role,
      fileName: file?.originalname,
      fileSize: file?.size,
    });

    // Vérifier que l'utilisateur cible existe
    const targetUser = await this.usersService.findById(userId);

    // Upload du fichier
    const avatarUrl = await this.avatarService.saveFile(file);

    // Récupération de l'ancien avatar pour le supprimer
    const oldAvatarUrl = targetUser.avatar;

    // Mise à jour de l'utilisateur avec la nouvelle URL d'avatar
    await this.usersService.update(userId, { avatar: avatarUrl });

    // Suppression de l'ancien avatar s'il existe et qu'il est différent
    if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
      try {
        await this.avatarService.deleteAvatar(oldAvatarUrl);
        this.logger.info('Old avatar deleted successfully for user', {
          module: 'UsersController',
          method: 'uploadAvatarForUser',
          targetUserId: userId,
          adminId: currentUser.id,
          oldAvatarUrl,
        });
      } catch (deleteError) {
        this.logger.warn('Failed to delete old avatar for user', {
          module: 'UsersController',
          method: 'uploadAvatarForUser',
          targetUserId: userId,
          adminId: currentUser.id,
          oldAvatarUrl,
          error: deleteError.message,
        });
      }
    }

    this.logger.info(
      'Avatar uploaded successfully for user by admin/moderator',
      {
        module: 'UsersController',
        method: 'uploadAvatarForUser',
        targetUserId: userId,
        adminId: currentUser.id,
        avatarUrl,
      },
    );

    return {
      avatarUrl,
      message: `Avatar uploaded successfully for user ${targetUser.fullname}`,
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

  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.logger.info('Profile update initiated', {
      module: 'UsersController',
      method: 'updateProfile',
      userId: user.id,
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size,
      updateFields: Object.keys(updateUserDto),
    });

    try {
      // Récupérer l'utilisateur actuel pour connaître l'ancien avatar
      const currentUser = await this.usersService.findById(user.id);
      const oldAvatarUrl = currentUser.avatar;

      // Préparer les données de mise à jour
      const updateData: Partial<UpdateUserDto> = {
        fullname: updateUserDto.fullname,
        email: updateUserDto.email,
        age: Number(updateUserDto.age),
        gender: updateUserDto.gender,
      };

      // Si un fichier avatar est fourni, le traiter
      if (file) {
        this.logger.info('Processing avatar file', {
          module: 'UsersController',
          method: 'updateProfile',
          userId: user.id,
          fileName: file.originalname,
          fileSize: file.size,
        });

        // Valider et uploader le nouvel avatar
        const avatarUrl = await this.avatarService.saveFile(file);
        this.logger.info('Avatar saved successfully', {
          module: 'UsersController',
          method: 'updateProfile',
          userId: user.id,
          avatarUrl,
        });

        // Ajouter l'URL du nouvel avatar aux données à mettre à jour
        updateData.avatar = avatarUrl;

        // Mettre à jour l'utilisateur avec le nouvel avatar
        const updatedUser = await this.usersService.update(user.id, updateData);

        // Supprimer l'ancien avatar s'il existe (après la mise à jour réussie)
        if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
          try {
            await this.avatarService.deleteAvatar(oldAvatarUrl);
            this.logger.info('Old avatar deleted successfully', {
              module: 'UsersController',
              method: 'updateProfile',
              userId: user.id,
              oldAvatarUrl,
            });
          } catch (deleteError) {
            this.logger.warn('Failed to delete old avatar', {
              module: 'UsersController',
              method: 'updateProfile',
              userId: user.id,
              oldAvatarUrl,
              error: deleteError.message,
            });
          }
        }

        this.logger.info('Profile updated successfully with avatar', {
          module: 'UsersController',
          method: 'updateProfile',
          userId: user.id,
          updatedFields: Object.keys(updateData),
        });
        return updatedUser;
      } else {
        // Pas de fichier, mise à jour des données utilisateur seulement
        this.logger.info('Updating profile without avatar file', {
          module: 'UsersController',
          method: 'updateProfile',
          userId: user.id,
          updateFields: Object.keys(updateData),
        });
        const updatedUser = await this.usersService.update(user.id, updateData);
        this.logger.info('Profile updated successfully', {
          module: 'UsersController',
          method: 'updateProfile',
          userId: user.id,
          updatedFields: Object.keys(updateData),
        });
        return updatedUser;
      }
    } catch (error) {
      this.logger.error('Failed to update profile', error, {
        module: 'UsersController',
        method: 'updateProfile',
        userId: user.id,
      });
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
