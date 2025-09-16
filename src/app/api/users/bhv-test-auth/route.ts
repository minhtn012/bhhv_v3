import { NextRequest, NextResponse } from 'next/server';
import { bhvApiClient } from '@/lib/bhvApiClient';
import { encryptBhvCredentials, decryptBhvCredentials } from '@/lib/encryption';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { userId: string; username: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; username: string; role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only regular users can test BHV auth
    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden - User access required' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Test authentication with BHV API
    console.log('Testing BHV authentication for user:', decoded.username);
    const authResult = await bhvApiClient.authenticate(username, password);

    if (authResult.success) {
      // Save encrypted credentials to database
      try {
        await connectToDatabase();
        const { encryptedUsername, encryptedPassword } = encryptBhvCredentials(username, password);

        await User.findByIdAndUpdate(decoded.userId, {
          bhvUsername: encryptedUsername,
          bhvPassword: encryptedPassword,
          bhvConnectedAt: new Date(),
          bhvStatus: 'connected'
        });

        console.log('✅ BHV credentials saved to database for user:', decoded.username);
      } catch (dbError) {
        console.error('❌ Failed to save BHV credentials:', dbError);
        // Don't fail the response if credential saving fails
        // The authentication was successful, just log the error
      }

      return NextResponse.json({
        success: true,
        message: 'BHV authentication successful',
        connectionTime: new Date().toISOString(),
        cookies: authResult.cookies
      });
    } else {
      // Determine specific error message based on response
      let errorMessage = 'Đăng nhập BHV thất bại';

      if (authResult.error?.includes('HTTP 401') || authResult.error?.includes('Authentication failed')) {
        errorMessage = 'Tên đăng nhập hoặc mật khẩu BHV không đúng';
      } else if (authResult.error?.includes('HTTP 404') || authResult.error?.includes('not found')) {
        errorMessage = 'Không thể kết nối với hệ thống BHV';
      } else if (authResult.error?.includes('timeout') || authResult.error?.includes('network')) {
        errorMessage = 'Kết nối mạng không ổn định. Vui lòng thử lại';
      } else if (authResult.error) {
        errorMessage = `Lỗi BHV: ${authResult.error}`;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: authResult.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('BHV auth test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi hệ thống. Vui lòng thử lại sau',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { userId: string; username: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; username: string; role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only regular users can access BHV credentials
    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden - User access required' }, { status: 403 });
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has BHV credentials
    if (!user.bhvUsername || !user.bhvPassword) {
      return NextResponse.json({
        hasCredentials: false,
        error: 'No BHV credentials found. Please set up BHV credentials in your profile.'
      }, { status: 404 });
    }

    try {
      // Decrypt credentials
      const { username, password } = decryptBhvCredentials(user.bhvUsername, user.bhvPassword);

      // Test authentication with BHV API and get fresh cookies
      console.log('Getting fresh BHV cookies for user:', decoded.username);
      const authResult = await bhvApiClient.authenticate(username, password);

      if (authResult.success) {
        return NextResponse.json({
          success: true,
          hasCredentials: true,
          cookies: authResult.cookies,
          connectionTime: new Date().toISOString()
        });
      } else {
        // Authentication failed - credentials might be outdated
        return NextResponse.json({
          success: false,
          hasCredentials: true,
          error: 'BHV authentication failed. Please update your BHV credentials in your profile.',
          details: authResult.error
        }, { status: 401 });
      }

    } catch (decryptError) {
      console.error('❌ Failed to decrypt BHV credentials:', decryptError);
      return NextResponse.json({
        success: false,
        hasCredentials: false,
        error: 'Failed to decrypt BHV credentials. Please re-enter your credentials in your profile.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('BHV credentials GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}