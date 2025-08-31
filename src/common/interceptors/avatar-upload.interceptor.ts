import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AvatarUploadInterceptor implements NestInterceptor {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Validation du fichier avant traitement
    if (request.file) {
      this.validateFile(request.file);
    }

    return next.handle();
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      return;
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
  }
}

export const multerAvatarConfig: MulterModuleOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Type de fichier non autorisé. Seuls les formats JPG et PNG sont acceptés',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
