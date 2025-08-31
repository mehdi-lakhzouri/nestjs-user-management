import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppLoggerService } from '../../common/logger';

@Injectable()
export class AvatarService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'avatars');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png'];

  constructor(private readonly logger: AppLoggerService) {
    this.ensureUploadDirectoryExists();
  }

  /**
   * Valide le fichier uploadé
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérification de la taille
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `La taille du fichier ne doit pas dépasser ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Vérification du type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non autorisé. Seuls les formats JPG et PNG sont acceptés',
      );
    }

    // Vérification de l'extension
    const fileExtension = extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Extension de fichier non autorisée. Seuls .jpg, .jpeg et .png sont acceptés',
      );
    }
  }

  /**
   * Génère un nom de fichier sécurisé et unique
   */
  generateSecureFilename(originalName: string): string {
    const extension = extname(originalName).toLowerCase();
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    return `avatar_${uniqueId}_${timestamp}${extension}`;
  }

  /**
   * Sauvegarde le fichier et retourne l'URL
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      this.validateFile(file);

      const filename = this.generateSecureFilename(file.originalname);
      const filePath = join(this.uploadPath, filename);

      await fs.writeFile(filePath, file.buffer);

      // Retourne l'URL relative pour accéder au fichier
      return `/uploads/avatars/${filename}`;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la sauvegarde du fichier',
      );
    }
  }

  /**
   * Supprime un avatar existant
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) return;

    try {
      // Extrait le nom de fichier de l'URL
      const filename = avatarUrl.split('/').pop();
      if (!filename) return;

      const filePath = join(this.uploadPath, filename);

      // Vérifie si le fichier existe avant de le supprimer
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        this.logger.info('Avatar file deleted successfully', {
          module: 'AvatarService',
          method: 'deleteAvatar',
          avatarUrl,
        });
      } catch (error) {
        // Le fichier n'existe pas ou ne peut pas être supprimé
        // On continue sans erreur pour éviter de bloquer l'opération
        this.logger.info('Avatar file not found or already deleted', {
          module: 'AvatarService',
          method: 'deleteAvatar',
          avatarUrl,
        });
      }
    } catch (error) {
      this.logger.error('Failed to delete avatar file', error, {
        module: 'AvatarService',
        method: 'deleteAvatar',
        avatarUrl,
      });
      // On ne lance pas d'exception pour ne pas bloquer les autres opérations
    }
  }

  /**
   * S'assure que le dossier d'upload existe
   */
  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch (error) {
      try {
        await fs.mkdir(this.uploadPath, { recursive: true });
        this.logger.info('Upload directory created successfully', {
          module: 'AvatarService',
          method: 'ensureUploadDirectoryExists',
          uploadPath: this.uploadPath,
        });
      } catch (mkdirError) {
        this.logger.error('Failed to create upload directory', mkdirError, {
          module: 'AvatarService',
          method: 'ensureUploadDirectoryExists',
          uploadPath: this.uploadPath,
        });
      }
    }
  }

  /**
   * Nettoie et valide le nom de fichier pour éviter les failles de sécurité
   */
  private sanitizeFilename(filename: string): string {
    // Supprime les caractères dangereux et les espaces
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255); // Limite la longueur
  }

  /**
   * Obtient les informations sur les limites d'upload
   */
  getUploadLimits(): {
    maxFileSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
  } {
    return {
      maxFileSize: this.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes,
      allowedExtensions: this.allowedExtensions,
    };
  }
}
