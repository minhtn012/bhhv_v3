#!/usr/bin/env node
/**
 * OCR Worker Service
 * Uses process pool to minimize Claude CLI startup overhead
 *
 * Usage:
 *   node ocr-worker.js [port]
 *
 * API:
 *   POST /ocr { service, imagePath }
 *   GET /health
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2]) || 3456;
const CONFIG_FILE = path.join(__dirname, 'ocr-config.json');
const CLAUDE_PATH = `${process.env.HOME}/.nvm/versions/node/v22.10.0/bin/claude`;
const MODEL = process.env.OCR_MODEL || 'sonnet'; // sonnet is faster, good for handwriting
const MAX_IMAGE_WIDTH = parseInt(process.env.OCR_MAX_WIDTH) || 800; // Smaller = faster processing

// Load config
let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (err) {
  console.error('Failed to load config:', err.message);
  process.exit(1);
}

// Stats
let stats = { total: 0, success: 0, failed: 0, avgTime: 0, model: MODEL };

/**
 * Resize image if needed (uses ImageMagick)
 */
function resizeImage(inputPath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(inputPath);
    const resizedPath = inputPath.replace(ext, `_resized${ext}`);

    // Check image dimensions first
    const identify = spawn('identify', ['-format', '%w', inputPath]);
    let width = '';
    identify.stdout.on('data', d => width += d);
    identify.on('close', code => {
      if (code !== 0) {
        // If identify fails, use original
        return resolve(inputPath);
      }

      const imgWidth = parseInt(width);
      if (imgWidth <= MAX_IMAGE_WIDTH) {
        // No resize needed
        return resolve(inputPath);
      }

      // Resize image
      console.log(`[RESIZE] ${path.basename(inputPath)}: ${imgWidth}px → ${MAX_IMAGE_WIDTH}px`);
      const convert = spawn('convert', [
        inputPath,
        '-resize', `${MAX_IMAGE_WIDTH}x>`, // Only shrink, maintain aspect ratio
        '-quality', '60',
        resizedPath
      ]);

      convert.on('close', code => {
        if (code === 0 && fs.existsSync(resizedPath)) {
          resolve(resizedPath);
        } else {
          resolve(inputPath); // Fallback to original
        }
      });
      convert.on('error', () => resolve(inputPath));
    });
    identify.on('error', () => resolve(inputPath));
  });
}

/**
 * Build OCR prompt
 */
function buildPrompt(service, imagePath) {
  const svc = config.services[service];
  if (!svc) throw new Error(`Unknown service: ${service}`);

  return `${svc.prompt}

Các trường cần trích xuất:
- ${svc.fields.join('\n- ')}

Nếu không tìm thấy thông tin, để giá trị là null.
Chỉ trả về JSON object, không markdown code block, không giải thích.

Ảnh cần phân tích: ${imagePath}`;
}

/**
 * Build OCR prompt for batch (2 images)
 */
function buildBatchPrompt(service, imagePath1, imagePath2) {
  const svc = config.services[service];
  if (!svc) throw new Error(`Unknown service: ${service}`);

  return `${svc.prompt}

Các trường cần trích xuất cho MỖI ảnh:
- ${svc.fields.join('\n- ')}

Nếu không tìm thấy thông tin, để giá trị là null.

QUAN TRỌNG: Có 2 ảnh cần phân tích. Trả về JSON với format:
{
  "image_1": { ...các fields của ảnh 1 },
  "image_2": { ...các fields của ảnh 2 }
}

Chỉ trả về JSON object, không markdown code block, không giải thích.

Ảnh 1: ${imagePath1}
Ảnh 2: ${imagePath2}`;
}

/**
 * Run Claude OCR (single shot, optimized)
 */
async function runOCR(service, imagePath) {
  const startTime = Date.now();

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  // Resize image if needed
  const processedPath = await resizeImage(imagePath);
  const isResized = processedPath !== imagePath;

  const prompt = buildPrompt(service, processedPath);

  return new Promise((resolve, reject) => {
    // Use direct execution with model flag
    const proc = spawn(CLAUDE_PATH, [
      '-p', prompt,
      '--model', MODEL,
      '--output-format', 'text'
    ], {
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.nvm/versions/node/v22.10.0/bin:${process.env.PATH}`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Cleanup resized file after processing
    const cleanup = () => {
      if (isResized && fs.existsSync(processedPath)) {
        try { fs.unlinkSync(processedPath); } catch { }
      }
    };

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      cleanup();
      reject(new Error('Timeout after 120s'));
    }, 120000);

    proc.on('close', code => {
      clearTimeout(timeout);
      cleanup();
      const duration = Date.now() - startTime;

      if (code !== 0) {
        stats.failed++;
        return reject(new Error(`Exit code ${code}: ${stderr}`));
      }

      // Parse JSON from output
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        stats.failed++;
        return reject(new Error('No JSON in output'));
      }

      try {
        const result = JSON.parse(jsonMatch[0]);
        stats.success++;
        stats.total++;
        stats.avgTime = ((stats.avgTime * (stats.total - 1)) + duration) / stats.total;
        console.log(`[OCR] ${path.basename(imagePath)} - ${(duration / 1000).toFixed(1)}s (${MODEL})`);
        resolve(result);
      } catch (e) {
        stats.failed++;
        reject(new Error(`Invalid JSON: ${e.message}`));
      }
    });

    proc.on('error', err => {
      clearTimeout(timeout);
      cleanup();
      stats.failed++;
      reject(err);
    });

    proc.stdin.end();
  });
}

/**
 * Run Claude OCR for batch (2 images in 1 call)
 */
async function runBatchOCR(service, imagePath1, imagePath2) {
  const startTime = Date.now();

  // Validate both images exist
  if (!fs.existsSync(imagePath1)) {
    throw new Error(`Image 1 not found: ${imagePath1}`);
  }
  if (!fs.existsSync(imagePath2)) {
    throw new Error(`Image 2 not found: ${imagePath2}`);
  }

  // Resize both images in parallel
  const [processedPath1, processedPath2] = await Promise.all([
    resizeImage(imagePath1),
    resizeImage(imagePath2)
  ]);

  const isResized1 = processedPath1 !== imagePath1;
  const isResized2 = processedPath2 !== imagePath2;

  const prompt = buildBatchPrompt(service, processedPath1, processedPath2);

  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_PATH, [
      '-p', prompt,
      '--model', MODEL,
      '--output-format', 'text'
    ], {
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.nvm/versions/node/v22.10.0/bin:${process.env.PATH}`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Cleanup resized files after processing
    const cleanup = () => {
      if (isResized1 && fs.existsSync(processedPath1)) {
        try { fs.unlinkSync(processedPath1); } catch { }
      }
      if (isResized2 && fs.existsSync(processedPath2)) {
        try { fs.unlinkSync(processedPath2); } catch { }
      }
    };

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      cleanup();
      reject(new Error('Timeout after 180s'));
    }, 180000); // 3 minutes for batch

    proc.on('close', code => {
      clearTimeout(timeout);
      cleanup();
      const duration = Date.now() - startTime;

      if (code !== 0) {
        stats.failed += 2;
        return reject(new Error(`Exit code ${code}: ${stderr}`));
      }

      // Parse JSON from output
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        stats.failed += 2;
        return reject(new Error('No JSON in output'));
      }

      try {
        const result = JSON.parse(jsonMatch[0]);
        stats.success += 2;
        stats.total += 2;
        stats.avgTime = ((stats.avgTime * (stats.total - 2)) + duration) / stats.total;
        console.log(`[BATCH OCR] ${path.basename(imagePath1)} + ${path.basename(imagePath2)} - ${(duration / 1000).toFixed(1)}s (${MODEL})`);
        resolve(result);
      } catch (e) {
        stats.failed += 2;
        reject(new Error(`Invalid JSON: ${e.message}`));
      }
    });

    proc.on('error', err => {
      clearTimeout(timeout);
      cleanup();
      stats.failed += 2;
      reject(err);
    });

    proc.stdin.end();
  });
}

/**
 * HTTP Server
 */
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', stats }));
    return;
  }

  // Services list
  if (req.method === 'GET' && req.url === '/services') {
    res.writeHead(200);
    res.end(JSON.stringify({ services: Object.keys(config.services) }));
    return;
  }

  // OCR endpoint
  if (req.method === 'POST' && req.url === '/ocr') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { service, imagePath } = JSON.parse(body);

        if (!service || !imagePath) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Missing service or imagePath' }));
          return;
        }

        console.log(`[REQ] ${service} - ${path.basename(imagePath)}`);
        const result = await runOCR(service, imagePath);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (err) {
        console.error(`[ERR] ${err.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Batch OCR endpoint (2 images in 1 call - faster!)
  if (req.method === 'POST' && req.url === '/ocr-batch') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { service, imagePath1, imagePath2 } = JSON.parse(body);

        if (!service || !imagePath1 || !imagePath2) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Missing service, imagePath1 or imagePath2' }));
          return;
        }

        console.log(`[BATCH REQ] ${service} - ${path.basename(imagePath1)} + ${path.basename(imagePath2)}`);
        const result = await runBatchOCR(service, imagePath1, imagePath2);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (err) {
        console.error(`[BATCH ERR] ${err.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     OCR Worker Service Started        ║
╠═══════════════════════════════════════╣
║  Port: ${String(PORT).padEnd(32)}║
║  Model: ${MODEL.padEnd(31)}║
║  Max Width: ${String(MAX_IMAGE_WIDTH).padEnd(27)}║
╠═══════════════════════════════════════╣
║  Endpoints:                           ║
║    GET  /health     - Status          ║
║    GET  /services   - List services   ║
║    POST /ocr        - Single image    ║
║    POST /ocr-batch  - 2 images (fast!)║
╚═══════════════════════════════════════╝
`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});
