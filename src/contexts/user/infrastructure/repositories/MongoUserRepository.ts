import { injectable } from 'inversify';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, UserId, UserRole, UserProfile } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { Address } from '../../domain/value-objects/Address';
import { UserModel, UserDocument } from '../persistence/UserSchema';

@injectable()
export class MongoUserRepository implements UserRepository {
  public async findById(id: UserId): Promise<User | null> {
    const userDoc = await UserModel.findById(id);
    if (!userDoc) {
      return null;
    }
    return this.toDomain(userDoc);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const userDoc = await UserModel.findOne({ email: email.value });
    if (!userDoc) {
      return null;
    }
    return this.toDomain(userDoc);
  }

  public async existsByEmail(email: Email): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.value });
    return count > 0;
  }

  public async findAll(): Promise<User[]> {
    const userDocs = await UserModel.find();
    return userDocs.map(doc => this.toDomain(doc));
  }

  public async save(user: User): Promise<void> {
    const userDoc = await UserModel.findById(user.id);
    
    if (userDoc) {
      // 更新现有用户
      await this.updateDocument(userDoc, user);
    } else {
      // 创建新用户
      await this.createDocument(user);
    }
  }

  public async delete(id: UserId): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }

  private async createDocument(user: User): Promise<void> {
    const userDoc = new UserModel({
      _id: user.id,
      email: user.email.value,
      password: user.password.value,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        addresses: user.profile.addresses.map(addr => addr.toPlainObject()),
      },
      role: user.role,
      isActive: user.isActive,
    });

    await userDoc.save();
  }

  private async updateDocument(userDoc: UserDocument, user: User): Promise<void> {
    userDoc.email = user.email.value;
    userDoc.password = user.password.value;
    userDoc.profile = {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      addresses: user.profile.addresses.map(addr => addr.toPlainObject()),
    };
    userDoc.role = user.role;
    userDoc.isActive = user.isActive;
    userDoc.updatedAt = user.updatedAt;

    await userDoc.save();
  }

  private toDomain(userDoc: UserDocument): User {
    const email = new Email(userDoc.email);
    const password = new Password(userDoc.password);
    
    const addresses = userDoc.profile.addresses.map(addr => 
      new Address({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
      })
    );

    const profile: UserProfile = {
      firstName: userDoc.profile.firstName,
      lastName: userDoc.profile.lastName,
      phone: userDoc.profile.phone,
      addresses,
    };

    return User.reconstitute(
      userDoc._id.toString(),
      email,
      password,
      profile,
      userDoc.role as UserRole,
      userDoc.isActive,
      userDoc.createdAt,
      userDoc.updatedAt
    );
  }
} 