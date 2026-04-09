import { NextRequest, NextResponse } from 'next/server';
import { PacificCrossApiClient } from '@/providers/pacific-cross/api-client';
import { encryptPcCredentials, decryptPcCredentials } from '@/lib/encryption';
import { connectToDatabase } from '@/lib/mongodb';
import User, { type IUser } from '@/models/User';
import jwt from 'jsonwebtoken';

// POST: Test PC login + save credentials
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { userId: string; username: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as typeof decoded;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden - User access required' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Test authentication with Pacific Cross
    console.log('Testing PC authentication for user:', decoded.username);
    const client = new PacificCrossApiClient();
    const authResponse = await client.authenticate(username, password);

    if (!authResponse.success) {
      return NextResponse.json({
        success: false,
        error: 'Đăng nhập Pacific Cross thất bại. Vui lòng kiểm tra lại thông tin.',
        details: authResponse.error
      }, { status: 400 });
    }

    // Authentication successful — encrypt and save
    try {
      await connectToDatabase();
      const { encryptedUsername, encryptedPassword } = encryptPcCredentials(username, password);

      await User.findByIdAndUpdate(decoded.userId, {
        pcUsername: encryptedUsername,
        pcPassword: encryptedPassword,
        pcConnectedAt: new Date(),
        pcStatus: 'connected'
      });

      console.log('PC credentials saved for user:', decoded.username);
    } catch (dbError) {
      console.error('Failed to save PC credentials:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Pacific Cross authentication successful',
      connectionTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('PC auth test error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}

// GET: Decrypt credentials + get fresh PC session for a user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { userId: string; username: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as typeof decoded;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Allow both user and admin
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    const userIdToQuery = (targetUserId && decoded.role === 'admin') ? targetUserId : decoded.userId;

    await connectToDatabase();
    const user = await User.findById(userIdToQuery).lean() as IUser | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.pcUsername || !user.pcPassword) {
      return NextResponse.json({
        hasCredentials: false,
        error: 'No PC credentials found. Please set up Pacific Cross credentials in your profile.'
      }, { status: 404 });
    }

    try {
      const { username, password } = decryptPcCredentials(user.pcUsername, user.pcPassword);

      // Authenticate and return fresh session
      const client = new PacificCrossApiClient();
      const authResult = await client.authenticate(username, password);

      if (!authResult.success) {
        return NextResponse.json({
          success: false,
          hasCredentials: true,
          error: 'PC authentication failed. Please update your credentials.',
          details: authResult.error
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        hasCredentials: true,
        username,
        password,
        connectionTime: new Date().toISOString()
      });
    } catch (decryptError) {
      console.error('Failed to decrypt PC credentials:', decryptError);
      return NextResponse.json({
        success: false,
        hasCredentials: false,
        error: 'Failed to decrypt PC credentials. Please re-enter your credentials.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('PC credentials GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
