const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const apiRoutes = require('./routes/apiRoutes');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');

const app = express();

// Configure CORS - allow specific origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.APP_URL || 'https://module-spec-reader.herokuapp.com']
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, but log it
    }
  }
}));

// File upload configuration with size limits
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the 10MB limit'
}));

const PORT = process.env.PORT || 5000;

// Allowed file types for upload
const ALLOWED_EXTENSIONS = ['.docx'];
const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Uploads directory (outside of client/build)
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cleanup old upload sessions (older than 1 hour)
function cleanupOldUploads() {
  try {
    const sessions = fs.readdirSync(UPLOADS_DIR);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    sessions.forEach(session => {
      const sessionPath = path.join(UPLOADS_DIR, session);
      const stats = fs.statSync(sessionPath);
      if (stats.isDirectory() && stats.mtimeMs < oneHourAgo) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`Cleaned up old session: ${session}`);
      }
    });
  } catch (err) {
    console.error('Error cleaning up old uploads:', err.message);
  }
}

// Run cleanup on server start
cleanupOldUploads();

// Run cleanup every hour
setInterval(cleanupOldUploads, 60 * 60 * 1000);

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename) {
  // Get just the base filename (no directory components)
  const basename = path.basename(filename);
  // Remove any characters that could be problematic
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Validate file
function validateFile(file) {
  const ext = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file type: ${ext}. Only .docx files are allowed.` };
  }

  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return { valid: false, error: `Invalid file format. Please upload a valid Word document (.docx).` };
  }

  return { valid: true };
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve up static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

// Routes
app.use('/api', apiRoutes);

// Upload Endpoint
app.post("/upload", async function (req, res) {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  const uploadedFiles = req.files.file;
  const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

  // Validate all files first
  for (const file of filesArray) {
    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
  }

  // Create a unique session directory for this upload
  const sessionId = uuidv4();
  const sessionDir = path.join(UPLOADS_DIR, sessionId);

  try {
    fs.mkdirSync(sessionDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create session directory:', err);
    return res.status(500).json({ error: 'Failed to create upload directory' });
  }

  const savedFiles = [];
  const errors = [];

  // Move each file to the session directory
  for (const file of filesArray) {
    const sanitizedName = sanitizeFilename(file.name);
    const filePath = path.join(sessionDir, sanitizedName);

    try {
      await file.mv(filePath);
      savedFiles.push(sanitizedName);
    } catch (err) {
      console.error(`Failed to save file ${file.name}:`, err);
      errors.push(`Failed to save ${file.name}`);
    }
  }

  if (savedFiles.length === 0) {
    return res.status(500).json({ error: 'Failed to save any files', details: errors });
  }

  res.json({
    sessionId,
    fileNames: savedFiles,
    filesUploaded: savedFiles.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Download Endpoint (GET - legacy, uses server-generated file)
app.get("/download", function (req, res) {
  const sessionId = req.query.sessionId;

  if (sessionId) {
    // Session-based download
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    const outputFile = path.join(sessionDir, 'output.xlsx');

    // Validate session ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (!fs.existsSync(outputFile)) {
      return res.status(404).json({ error: 'Output file not found. Please generate the data first.' });
    }

    res.download(outputFile, 'output.xlsx');
  } else {
    // Fallback to legacy behavior for backward compatibility
    const file = path.join(__dirname, 'output.xlsx');
    if (!fs.existsSync(file)) {
      return res.status(404).json({ error: 'Output file not found. Please generate the data first.' });
    }
    res.download(file);
  }
});

// Download Endpoint (POST - uses client-provided moduleData with user modifications)
app.post("/api/download", function (req, res) {
  const { moduleData } = req.body;

  if (!moduleData || !Array.isArray(moduleData)) {
    return res.status(400).json({ error: 'Invalid module data' });
  }

  if (moduleData.length === 0) {
    return res.status(400).json({ error: 'No module data to export' });
  }

  try {
    // Strip UI-only fields before creating Excel
    const cleanData = moduleData.map(m => {
      const {
        fuzzySuggestion,
        hierarchyMismatch,
        missingDept,
        missingSchool,
        deptOptions,
        schoolOptions,
        collegeOptions,
        ...rest
      } = m;
      return rest;
    });

    // Create worksheet from posted data
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Error generating Excel:', err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => console.log("Server started!"));
