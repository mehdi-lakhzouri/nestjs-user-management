import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/schemas/user.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
