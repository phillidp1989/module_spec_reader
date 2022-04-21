const fs = require('fs');
const path = require('path');
const directory = path.join(__dirname, '..', 'client', 'build', 'uploads');

// Remove all files from the uploads folder
const clearFiles = (req, res, next) => {
    let response = [];
    const files = fs.readdirSync(directory);
    for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
            response.push(file);
        });
    }
    return res.status(200).send(response);
}

module.exports = clearFiles;

