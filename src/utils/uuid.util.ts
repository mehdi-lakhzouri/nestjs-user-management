import { v4 as uuidv4 } from 'uuid';

export class UuidUtil {
  static generate(): string {
    return uuidv4();
  }

  static generateShort(): string {
    return uuidv4().replace(/-/g, '').substring(0, 16);
  }
}
