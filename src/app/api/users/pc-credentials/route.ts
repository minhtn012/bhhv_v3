import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { type IUser } from '@/models/User';
import jwt from 'jsonwebtoken';

// GET: Check PC credentials status
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

    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).lean() as IUser | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasCredentials: !!(user.pcUsername && user.pcPassword),
      isConnected: user.pcStatus === 'connected',
      lastConnectionTime: user.pcConnectedAt || null
    });

  } catch (error) {
    console.error('PC credentials status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove PC credentials
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(decoded.userId, {
      $unset: { pcUsername: 1, pcPassword: 1, pcConnectedAt: 1, pcStatus: 1 }
    });

    console.log('PC credentials removed for user:', decoded.username);

    return NextResponse.json({ success: true, message: 'PC credentials removed' });

  } catch (error) {
    console.error('PC credentials DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
