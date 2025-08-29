import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Générer un ID unique pour chaque requête
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}
