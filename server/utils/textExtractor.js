const https = require('https');
const http = require('http');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode === 401) {
        return reject(new Error('HTTP 401 - Unauthorized'));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function extractText(fileUrl, fileType) {
  try {
    // Convert Cloudinary URL to use fl_attachment for direct access
    let downloadUrl = fileUrl;
    if (fileUrl.includes('cloudinary.com')) {
      // For image type PDFs, add fl_attachment flag
      downloadUrl = fileUrl
        .replace('/image/upload/', '/image/upload/fl_attachment/')
        .replace('/raw/upload/', '/raw/upload/fl_attachment/');
    }

    console.log('Downloading from:', downloadUrl);
    const buffer = await downloadBuffer(downloadUrl);
    console.log('Buffer size:', buffer.length);

    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      console.log('Text length:', data.text?.length);
      return data.text || '';
    }

    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      console.log('Text length:', result.value?.length);
      return result.value || '';
    }

    return '';
  } catch (err) {
    console.error('Extraction error:', err.message);
    return '';
  }
}

module.exports = { extractText };
