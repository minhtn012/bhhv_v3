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
      // Support Vietnamese headers with diacritics from template_PCV.xlsx
      const name = (
        row['Họ tên *'] || row['Họ tên'] ||
        row['Name'] || row['Ho ten'] || ''
      ) as string;

      const dobRaw = row['Ngày sinh *'] || row['Ngày sinh'] ||
        row['DOB'] || row['Ngay sinh'] || '';

      // Handle Excel date serial number
      let dob = '';
      if (typeof dobRaw === 'number') {
        // Excel serial date: convert to YYYY-MM-DD
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dobRaw * 86400000);
        dob = date.toISOString().split('T')[0];
      } else {
        dob = String(dobRaw || '');
      }

      const genderRaw = (
        row['Giới tính * (Nam/Nữ)'] || row['Giới tính'] ||
        row['Gender'] || row['Gioi tinh'] || 'M'
      ) as string;

      const country = (
        row['Nước Cư trú *'] || row['Nước Cư trú'] ||
        row['Country'] || row['Quoc gia'] || 'VIETNAM'
      ) as string;

      const personalId = (
        row['CMND/Hộ chiếu'] || row['CMND'] || row['Hộ chiếu'] ||
        row['Personal ID'] || row['CCCD'] || row['So CMND'] || ''
      ) as string;

      const telNo = (
        row['Số Điện thoại'] || row['SĐT'] ||
        row['Tel'] || row['SDT'] || ''
      ) as string;

      const email = (row['Email'] || '') as string;

      const beneficiary = (
        row['Người Thụ hưởng'] || row['Beneficiary'] || ''
      ) as string;

      const relationshipRaw = (
        row['Quan hệ (Cha/Mẹ/Vợ chồng/Con/Người khác)'] || row['Quan hệ'] ||
        row['Relationship'] || row['Quan he'] || 'Người khác'
      ) as string;

      const pct = (
        row['% cho Người Thụ hưởng'] || row['%'] || 100
      ) as number;

      // Parse gender
      const genderUpper = String(genderRaw).toUpperCase();
      const gender = (genderUpper === 'F' || genderUpper === 'NỮ' || genderUpper === 'NU' || genderRaw === 'Nữ') ? 'F' : 'M';

      // Map relationship to UI expected values (from TRAVEL_RELATIONSHIP_LABELS)
      const relationshipMap: Record<string, string> = {
        'Cha': 'RELATION_F',
        'Mẹ': 'RELATION_M',
        'Vợ chồng': 'RELATION_S',
        'Vợ': 'RELATION_S',
        'Chồng': 'RELATION_S',
        'Con': 'RELATION_C',
        'Người khác': 'RELATION_O',
      };
      const relationship = relationshipMap[relationshipRaw] || 'RELATION_O';

      // Calculate age
      const age = calculateAge(dob);

      return {
        name: String(name).trim(),
        dob,
        age,
        gender,
        country: String(country).toUpperCase(),
        personalId: String(personalId).trim(),
        telNo: String(telNo).trim(),
        email: String(email).trim(),
        beneficiary: String(beneficiary).trim(),
        relationship,
        pct: Number(pct) || 100,
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
