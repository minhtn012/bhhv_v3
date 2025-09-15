import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

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
    const user = await User.findById(decoded.userId).select('bhvUsername bhvPassword bhvConnectedAt bhvStatus');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return credential status without sensitive data
    return NextResponse.json({
      hasCredentials: Boolean(user.bhvUsername && user.bhvPassword),
      isConnected: user.bhvStatus === 'connected',
      lastConnectionTime: user.bhvConnectedAt,
      // Don't return actual credentials for security
    });

  } catch (error) {
    console.error('BHV credentials check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Only regular users can delete BHV credentials
    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden - User access required' }, { status: 403 });
    }

    await connectToDatabase();

    // Clear BHV credentials
    await User.findByIdAndUpdate(decoded.userId, {
      $unset: {
        bhvUsername: 1,
        bhvPassword: 1,
        bhvConnectedAt: 1,
        bhvStatus: 1
      }
    });

    console.log('🗑️ BHV credentials removed for user:', decoded.username);

    return NextResponse.json({
      success: true,
      message: 'BHV credentials removed successfully'
    });

  } catch (error) {
    console.error('BHV credentials removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove BHV credentials' },
      { status: 500 }
    );
  }
}