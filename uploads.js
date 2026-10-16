// uploads.js - Enterprise Secure File Upload Handler with Magic Byte Verification
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const UPLOADS_BASE = path.join(__dirname, 'public', 'uploads');
const RESUMES_DIR = path.join(UPLOADS_BASE, 'resumes');
const LOGOS_DIR = path.join(UPLOADS_BASE, 'logos');

// Ensure upload directories exist
[UPLOADS_BASE, RESUMES_DIR, LOGOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_LOGO_SIZE = 2 * 1024 * 1024;   // 2 MB

/**
 * Validate magic numbers for safe file formats
 */
function validateMagicBytes(buffer, type) {
  if (!buffer || buffer.length < 4) return false;

  if (type === 'resume') {
    // PDF Magic bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return '.pdf';
    }
    // DOCX (Zip archive): PK.. (0x50 0x4B 0x03 0x04)
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return '.docx';
    }
    return false;
  }

  if (type === 'logo') {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return '.png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return '.jpg';
    }
    // WebP: RIFF ... WEBP
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return '.webp';
    }
    // SVG text check
    const textPreview = buffer.slice(0, 100).toString('utf8').toLowerCase();
    if (textPreview.includes('<svg') || textPreview.includes('<?xml')) {
      return '.svg';
    }
    return false;
  }

  return false;
}

/**
 * Save an uploaded file securely from Base64 or binary payload
 */
function saveUploadedFile(base64Data, filename, type = 'resume') {
  if (!base64Data) {
    throw new Error('No file data provided');
  }

  // Strip Base64 Data URL prefix if present
  let cleanBase64 = base64Data;
  if (cleanBase64.includes(',')) {
    cleanBase64 = cleanBase64.split(',')[1];
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  const maxSize = type === 'resume' ? MAX_RESUME_SIZE : MAX_LOGO_SIZE;

  if (buffer.length > maxSize) {
    throw new Error(`File exceeds maximum permitted size of ${maxSize / (1024 * 1024)} MB`);
  }

  const detectedExt = validateMagicBytes(buffer, type);
  if (!detectedExt) {
    throw new Error(
      type === 'resume' 
        ? 'Invalid resume format. Only verified PDF and DOCX files are permitted.' 
        : 'Invalid image format. Only verified PNG, JPEG, WebP, and SVG images are permitted.'
    );
  }

  const safeUniqueName = `${type}_${crypto.randomUUID().slice(0, 10)}_${Date.now()}${detectedExt}`;
  const targetDir = type === 'resume' ? RESUMES_DIR : LOGOS_DIR;
  const targetFilePath = path.join(targetDir, safeUniqueName);

  // Security check: Ensure target path remains strictly within targetDir
  if (!targetFilePath.startsWith(targetDir)) {
    throw new Error('Path traversal detected');
  }

  fs.writeFileSync(targetFilePath, buffer);

  return {
    filename: safeUniqueName,
    url: `/uploads/${type === 'resume' ? 'resumes' : 'logos'}/${safeUniqueName}`,
    size: buffer.length
  };
}

module.exports = {
  saveUploadedFile,
  validateMagicBytes
};
