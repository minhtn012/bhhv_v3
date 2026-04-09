import { connectToDatabase } from '@/lib/mongodb';
import { decryptPcCredentials } from '@/lib/encryption';
import User, { type IUser } from '@/models/User';

interface PcCredentials {
  username: string;
  password: string;
  source: 'user_db' | 'env';
}

/**
 * Get Pacific Cross credentials for a user.
 * Priority: user DB (encrypted) → fallback to process.env
 */
export async function getPcCredentials(userId: string): Promise<PcCredentials | null> {
  // Try user DB first
  try {
    await connectToDatabase();
    const user = await User.findById(userId).lean() as IUser | null;

    if (user?.pcUsername && user?.pcPassword) {
      const { username, password } = decryptPcCredentials(user.pcUsername, user.pcPassword);
      return { username, password, source: 'user_db' };
    }
  } catch (error) {
    console.error('Failed to get PC credentials from user DB:', error);
  }

  // Fallback to env
  const envUsername = process.env.PACIFIC_CROSS_USERNAME;
  const envPassword = process.env.PACIFIC_CROSS_PASSWORD;

  if (envUsername && envPassword) {
    return { username: envUsername, password: envPassword, source: 'env' };
  }

  return null;
}
