import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get user from token to invalidate refresh token in database
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        // Clear refresh token from database
        await User.findByIdAndUpdate(payload.userId, {
          $unset: { refreshToken: 1, refreshTokenExpiry: 1 }
        });
      }
    }

    const response = NextResponse.json({
      message: 'Logout successful'
    });

    // Clear the access token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0)
    });

    // Clear the refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      expires: new Date(0)
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}