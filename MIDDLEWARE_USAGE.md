# Middleware Usage Guide

## Overview
Hệ thống middleware tự động log và xử lý authentication cho API routes.

## Available Middleware

### 1. `withApiLogger` - Auto logging
Tự động log tất cả requests/responses với context đầy đủ.

### 2. `withAuth` - Authentication
Kiểm tra user đã login hay chưa.

### 3. `withAdmin` - Admin-only access
Chỉ cho phép admin access.

### 4. `composeMiddleware` - Compose nhiều middleware
Kết hợp nhiều middleware thành một.

## Usage Examples

### Basic API Logging (Recommended for all routes)

```typescript
// src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger } from '@/middleware';

export async function GET(request: NextRequest) {
  return withApiLogger(request, async () => {
    // Your handler logic here
    const data = await fetchContracts();
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withApiLogger(request, async () => {
    const body = await request.json();
    const contract = await createContract(body);
    return NextResponse.json(contract, { status: 201 });
  });
}
```

### With Authentication

```typescript
// src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAuth, withApiLogger } from '@/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withMiddleware(
    request,
    async () => {
      const { id } = await params;
      const body = await request.json();
      const updated = await updateContract(id, body);
      return NextResponse.json(updated);
    },
    [withAuth, withApiLogger]
  );
}
```

### Admin-only Routes

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAdmin, withApiLogger } from '@/middleware';

export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async () => {
      const users = await getAllUsers();
      return NextResponse.json(users);
    },
    [withAdmin, withApiLogger]
  );
}
```

### Custom Options

```typescript
// Disable request body logging for file uploads
export async function POST(request: NextRequest) {
  return withApiLogger(
    request,
    async () => {
      // Handle file upload
      const formData = await request.formData();
      return NextResponse.json({ success: true });
    },
    {
      logRequestBody: false, // Don't log large file data
      logResponseBody: false,
    }
  );
}
```

### Exclude Sensitive Routes from Logging

```typescript
// Health check endpoint - no need to log
export async function GET(request: NextRequest) {
  return withApiLogger(
    request,
    async () => {
      return NextResponse.json({ status: 'ok' });
    },
    {
      excludePaths: ['/api/health'],
    }
  );
}
```

## Migration Guide

### Before (old console.log approach)
```typescript
export async function POST(request: NextRequest) {
  try {
    console.log('Creating contract...');
    const body = await request.json();
    console.log('Request body:', body);

    const contract = await createContract(body);
    console.log('Contract created:', contract);

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### After (with middleware)
```typescript
export async function POST(request: NextRequest) {
  return withApiLogger(request, async () => {
    const body = await request.json();
    const contract = await createContract(body);
    return NextResponse.json(contract);
  });
}
// Middleware tự động log request, response, errors với timestamp, duration, IP, etc.
```

## Benefits

✅ **Consistent logging** - Tất cả routes đều có format log giống nhau
✅ **Automatic context** - IP, user-agent, duration tự động được log
✅ **Security** - Sensitive data (password, token) tự động bị redact
✅ **Performance tracking** - Measure response time của mỗi request
✅ **Error tracking** - Tự động log stack trace khi có error
✅ **Development/Production** - Tự động filter log level theo environment

## Log Output Example

```
[2025-10-02T10:30:45.123Z] 🌐 HTTP: API Request: POST /api/contracts
{
  "method": "POST",
  "path": "/api/contracts",
  "query": {},
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "body": {
    "contractNumber": "HD123456",
    "status": "nhap",
    "cookies": "***REDACTED***"
  }
}

[2025-10-02T10:30:45.456Z] 🌐 HTTP: API Response: POST /api/contracts - 201
{
  "method": "POST",
  "path": "/api/contracts",
  "status": 201,
  "duration": "333ms"
}
```

## Next Steps

1. Migrate existing API routes to use middleware
2. Add custom business logic logging with `logger.contractAction()`
3. Consider adding database logging for audit trail
4. Setup log aggregation service (optional)
