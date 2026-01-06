#!/usr/bin/env node
/**
 * OCR Runner - Node.js wrapper for Claude Code OCR
 * Usage: node ocr-runner.js <service> <image-path>
 * Or import as module: const { runOCR, getServices } = require('./ocr-runner')
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'ocr-config.json');

// Load config
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// Get available services
function getServices() {
  const config = loadConfig();
  return Object.entries(config.services).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    fields: value.fields
  }));
}

// Build prompt from service config
function buildPrompt(service, imagePath) {
  const config = loadConfig();
  const serviceConfig = config.services[service];

  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}. Available: ${Object.keys(config.services).join(', ')}`);
  }

  const fields = serviceConfig.fields.map(f => `- ${f}`).join('\n');

  return `${serviceConfig.prompt}

Các trường cần trích xuất:
${fields}

Nếu không tìm thấy thông tin, để giá trị là null.
Chỉ trả về JSON object, không markdown code block, không giải thích.

Ảnh cần phân tích: ${imagePath}`;
}

// Run OCR using Claude CLI
async function runOCR(service, imagePath) {
  // Validate image exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const prompt = buildPrompt(service, imagePath);

  try {
    const result = execSync(`claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Clean result
    let cleaned = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Parse and return JSON
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node ocr-runner.js <service> <image-path>');
    console.log('       node ocr-runner.js --list');
    console.log('');
    console.log('Available services:');
    getServices().forEach(s => {
      console.log(`  ${s.id}: ${s.name}`);
    });
    process.exit(0);
  }

  if (args[0] === '--list' || args[0] === '-l') {
    console.log(JSON.stringify(getServices(), null, 2));
    process.exit(0);
  }

  const [service, imagePath] = args;

  if (!service || !imagePath) {
    console.error('Error: Both service and image-path are required');
    process.exit(1);
  }

  runOCR(service, imagePath)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { runOCR, getServices, loadConfig };
