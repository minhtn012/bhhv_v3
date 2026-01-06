/**
 * OCR API Endpoint
 * POST /api/ocr - Process images using OCR Worker Service
 *
 * Request: FormData with:
 *   - service: string (e.g., "bao-hiem-suc-khoe")
 *   - images: File[] (one or more image files)
 *
 * Response: JSON with OCR results
 *
 * Note: Requires OCR Worker Service running on port 3456
 *   Start with: node scripts/ocr/ocr-worker.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// OCR Worker Service URL
const OCR_WORKER_URL = process.env.OCR_WORKER_URL || 'http://localhost:3456';
const TEMP_DIR = path.join(process.cwd(), '.tmp/ocr');

// Helper to call OCR Worker Service
async function callOCRWorker(service: string, imagePath: string): Promise<Record<string, unknown>> {
  console.log(`[OCR API] Calling worker: ${OCR_WORKER_URL}/ocr`, { service, imagePath });
  const response = await fetch(`${OCR_WORKER_URL}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, imagePath }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Worker request failed' }));
    throw new Error(error.error || `Worker returned ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'OCR processing failed');
  }

  return result.data;
}

// Allowed services
const ALLOWED_SERVICES = ['bao-hiem-suc-khoe', 'bao-hiem-xe', 'bao-hiem-du-lich'];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();
    const service = formData.get('service') as string;
    const files = formData.getAll('images') as File[];

    // Validate service
    if (!service || !ALLOWED_SERVICES.includes(service)) {
      return NextResponse.json(
        { error: `Invalid service. Allowed: ${ALLOWED_SERVICES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
    }

    // Ensure temp directory exists
    await mkdir(TEMP_DIR, { recursive: true });

    let results: Record<string, unknown>[] = [];

    // Validate and save all files first
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max size: 10MB` },
          { status: 400 }
        );
      }
    }

    // Save all files to temp directory
    const savedFiles: { file: File; path: string }[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const tempFileName = `${randomUUID()}.${ext}`;
      const tempFilePath = path.join(TEMP_DIR, tempFileName);
      tempFiles.push(tempFilePath);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tempFilePath, buffer);
      savedFiles.push({ file, path: tempFilePath });
    }

    // Process all files in PARALLEL
    console.log(`[OCR API] Processing ${savedFiles.length} files in parallel...`);
    const ocrPromises = savedFiles.map(async ({ file, path: filePath }) => {
      try {
        const result = await callOCRWorker(service, filePath);
        return result;
      } catch (ocrError) {
        console.error('OCR worker error:', ocrError);
        return { _error: String(ocrError), _file: file.name };
      }
    });

    results = await Promise.all(ocrPromises);

    // Merge results if multiple files
    const mergedResult = mergeOCRResults(results);

    return NextResponse.json({
      success: true,
      service,
      filesProcessed: files.length,
      result: mergedResult,
      rawResults: results,
    });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', details: String(error) },
      { status: 500 }
    );
  } finally {
    // Cleanup temp files
    for (const tempFile of tempFiles) {
      try {
        await unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Merge multiple OCR results (for multi-page forms)
 * Later results override earlier ones for non-null values
 */
function mergeOCRResults(results: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  for (const result of results) {
    // Skip error results
    if (result._error) continue;

    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined && value !== '') {
        merged[key] = value;
      }
    }
  }

  return merged;
}

// GET endpoint to list available services
export async function GET() {
  return NextResponse.json({
    services: ALLOWED_SERVICES,
    maxFiles: 5,
    maxFileSize: '10MB',
    allowedTypes: ALLOWED_MIME_TYPES,
  });
}
