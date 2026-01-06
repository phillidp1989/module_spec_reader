const fs = require('fs');
const path = require('path');

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
// Legacy directory for backward compatibility
const LEGACY_DIR = path.join(__dirname, '..', 'client', 'build');

// Remove all .docx files from the specified directory
const clearFiles = (req, res, next) => {
    const sessionId = req.query.sessionId;
    const response = { cleared: [], errors: [] };

    // Determine which directory to clear
    let directory;
    if (sessionId) {
        // Validate session ID format (UUID)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        directory = path.join(UPLOADS_DIR, sessionId);

        // If session directory exists, remove the entire session directory
        if (fs.existsSync(directory)) {
            try {
                fs.rmSync(directory, { recursive: true, force: true });
                response.message = 'Session cleared successfully';
                response.sessionId = sessionId;
                return res.status(200).json(response);
            } catch (err) {
                console.error(`Failed to remove session directory ${sessionId}:`, err.message);
                return res.status(500).json({ error: 'Failed to clear session files' });
            }
        } else {
            return res.status(404).json({ error: 'Session not found' });
        }
    } else {
        // Legacy behavior: clear .docx files from client/build
        directory = LEGACY_DIR;
    }

    // Check if directory exists
    if (!fs.existsSync(directory)) {
        return res.status(200).json({ message: 'No files to clear', cleared: [] });
    }

    try {
        const files = fs.readdirSync(directory);

        for (const file of files) {
            if (path.extname(file).toLowerCase() === ".docx") {
                const filePath = path.join(directory, file);
                try {
                    fs.unlinkSync(filePath);
                    response.cleared.push(file);
                } catch (err) {
                    console.error(`Failed to delete ${file}:`, err.message);
                    response.errors.push({ file, error: err.message });
                }
            }
        }

        response.message = `${response.cleared.length} file(s) cleared`;
        return res.status(200).json(response);
    } catch (err) {
        console.error('Error reading directory:', err.message);
        return res.status(500).json({ error: 'Failed to clear files' });
    }
};

module.exports = clearFiles;

