import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, verifyRefreshToken } from '@/lib/jwt';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Verify refresh token ID matches stored token
    if (user.refreshToken !== payload.tokenId) {
      return NextResponse.json(
        { error: 'Refresh token revoked or invalid' },
        { status: 401 }
      );
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Set new access token cookie
    const response = NextResponse.json({
      message: 'Token refreshed successfully'
    });

    response.cookies.set('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 // 30 minutes
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}