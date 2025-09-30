import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isActive: boolean;
  // BHV credentials (only for role='user')
  bhvUsername?: string; // encrypted
  bhvPassword?: string; // encrypted
  bhvConnectedAt?: Date;
  bhvStatus?: 'connected' | 'disconnected';
  // Refresh token for session management
  refreshToken?: string;
  refreshTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    validate: {
      validator: function(v: string) {
        // Require at least: 1 uppercase, 1 lowercase, 1 number, 1 special char
        const hasUpperCase = /[A-Z]/.test(v);
        const hasLowerCase = /[a-z]/.test(v);
        const hasNumber = /[0-9]/.test(v);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(v);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // BHV credentials (optional, only for role='user')
  bhvUsername: {
    type: String,
    required: false
  },
  bhvPassword: {
    type: String,
    required: false
  },
  bhvConnectedAt: {
    type: Date,
    required: false
  },
  bhvStatus: {
    type: String,
    enum: ['connected', 'disconnected'],
    required: false
  },
  // Refresh token for authentication
  refreshToken: {
    type: String,
    required: false
  },
  refreshTokenExpiry: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);