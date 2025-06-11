import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../domain/entities/User';

export interface UserDocument extends Document {
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    addresses: Array<{
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }>;
  };
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, required: true, maxlength: 200 },
  city: { type: String, required: true, maxlength: 50 },
  state: { type: String, required: true, maxlength: 50 },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    maxlength: 254,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: '邮箱格式不正确'
    }
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    phone: { 
      type: String, 
      validate: {
        validator: function(phone: string) {
          return !phone || /^1[3-9]\d{9}$/.test(phone);
        },
        message: '手机号码格式不正确'
      }
    },
    addresses: [AddressSchema],
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'users',
});

// 创建索引
UserSchema.index({ email: 1 });
UserSchema.index({ 'profile.phone': 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema); 