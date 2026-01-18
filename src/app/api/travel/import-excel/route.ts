import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logError } from '@/lib/errorLogger';
import * as XLSX from 'xlsx';
import { calculateAge } from '@/providers/pacific-cross/products/travel/mapper';

interface ExcelRow {
  [key: string]: string | number | undefined;
}

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// POST /api/travel/import-excel - Import insured persons from Excel
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'Excel file has no sheets' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    // Map rows to insured persons
    const insuredPersons = rows.map((row) => {
      // Expected columns: Name, DOB, Gender, Country, Personal ID, Tel, Email, Relationship
      // Support both English and Vietnamese headers
      const name = (row['Name'] || row['Ho ten'] || '') as string;
      const dob = (row['DOB'] || row['Ngay sinh'] || '') as string;
      const genderRaw = ((row['Gender'] || row['Gioi tinh'] || 'M') as string).toUpperCase();
      const country = (row['Country'] || row['Quoc gia'] || 'VIETNAM') as string;
      const personalId = (row['Personal ID'] || row['CCCD'] || row['So CMND'] || '') as string;
      const telNo = (row['Tel'] || row['SDT'] || '') as string;
      const email = (row['Email'] || '') as string;
      const relationship = (row['Relationship'] || row['Quan he'] || 'RELATION_O') as string;

      // Parse gender
      const gender = (genderRaw === 'F' || genderRaw === 'NU' || genderRaw === 'NỮ') ? 'F' : 'M';

      // Calculate age
      const age = calculateAge(dob);

      return {
        name,
        dob,
        age,
        gender,
        country,
        personalId,
        telNo,
        email,
        beneficiary: '',
        relationship,
        pct: 100,
        carRental: false,
        carRentalDate: '',
        carRentalDays: 0
      };
    });

    // Validate required fields
    const errors: string[] = [];
    insuredPersons.forEach((person, index) => {
      const rowNum = index + 2; // Excel rows start at 1, header is row 1
      if (!person.name) {
        errors.push(`Row ${rowNum}: Missing name`);
      }
      if (!person.dob) {
        errors.push(`Row ${rowNum}: Missing date of birth`);
      }
      if (!person.personalId) {
        errors.push(`Row ${rowNum}: Missing personal ID`);
      }
      if (person.age < 0 || person.age > 120) {
        errors.push(`Row ${rowNum}: Invalid age (${person.age})`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Import thanh cong',
      insuredPersons,
      count: insuredPersons.length
    });

  } catch (error: unknown) {
    logError(error, {
      operation: 'TRAVEL_IMPORT_EXCEL',
      path: request.url,
      method: 'POST',
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
