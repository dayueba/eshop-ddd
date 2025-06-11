import { Repository } from '@shared/infrastructure/Repository';
import { User, UserId } from '../entities/User';
import { Email } from '../value-objects/Email';

export interface UserRepository extends Repository<User, UserId> {
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  findAll(): Promise<User[]>;
} 