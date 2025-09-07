import { http, HttpResponse } from 'msw';
import { mockUsers, mockCarData } from './fixtures';

export const handlers = [
  // Auth handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    
    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        user: mockUsers.admin,
      });
    }
    
    if (body.username === 'testuser' && body.password === 'test123') {
      return HttpResponse.json({
        success: true,
        user: mockUsers.user,
      });
    }
    
    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    
    if (authHeader?.includes('Bearer') || cookie?.includes('token=')) {
      return HttpResponse.json({
        success: true,
        user: mockUsers.admin,
      });
    }
    
    return HttpResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Car search handlers
  http.get('/api/car-search/brands', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { brand: 'Toyota' },
        { brand: 'Honda' },
        { brand: 'Hyundai' },
        { brand: 'Ford' },
        { brand: 'Mazda' },
      ],
    });
  }),

  http.get('/api/car-search/models/:brand', ({ params }) => {
    const { brand } = params;
    const modelsMap: Record<string, string[]> = {
      Toyota: ['Vios', 'Camry', 'Corolla Cross', 'Fortuner'],
      Honda: ['City', 'Civic', 'Accord', 'CR-V'],
      Hyundai: ['Accent', 'Elantra', 'Tucson', 'HD120SL'],
    };
    
    return HttpResponse.json({
      success: true,
      data: modelsMap[brand as string] || [],
    });
  }),

  http.get('/api/car-search/details/:brand/:model', ({ params }) => {
    const { brand, model } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        brand,
        model,
        bodyStyles: ['Sedan', 'SUV', 'Hatchback', 'Truck'],
        years: ['2018', '2019', '2020', '2021', '2022', '2023'],
      },
    });
  }),

  // Location handlers
  http.get('/api/admin/provinces', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { province_id: '79', province_name: 'TP Hồ Chí Minh' },
        { province_id: '01', province_name: 'Hà Nội' },
        { province_id: '48', province_name: 'Đà Nẵng' },
      ],
    });
  }),

  http.get('/api/admin/districts-wards', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          province_id: '79',
          districts: [
            { district_id: '760', district_name: 'Quận 1' },
            { district_id: '763', district_name: 'Quận 2' },
            { district_id: '764', district_name: 'Quận 3' },
          ],
        },
      ],
    });
  }),

  // Contract handlers
  http.get('/api/contracts', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    
    return HttpResponse.json({
      success: true,
      data: {
        contracts: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
      },
    });
  }),

  http.post('/api/contracts', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        ...body,
        _id: '6507f1f77bcf86cd799439c1',
        contractNumber: `BH${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000)}`,
        status: 'nhap',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.post('/api/contracts/extract-info', async ({ request }) => {
    // Mock OCR response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          HttpResponse.json({
            success: true,
            data: {
              extractedData: {
                bienSo: '51A-123.45',
                soKhung: 'ABC123456789',
                soMay: 'DEF987654321',
                chuXe: 'NGUYEN VAN A',
                namSanXuat: '2020',
              },
            },
          })
        );
      }, 1000); // Simulate processing delay
    });
  }),

  // User management handlers
  http.get('/api/users', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    
    if (!authHeader?.includes('Bearer') && !cookie?.includes('token=')) {
      return HttpResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: [mockUsers.admin, mockUsers.user],
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      success: true,
      data: {
        ...body,
        _id: '6507f1f77bcf86cd799439c2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Error handlers for testing
  http.get('/api/test/server-error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),

  http.get('/api/test/network-error', () => {
    return HttpResponse.error();
  }),
];