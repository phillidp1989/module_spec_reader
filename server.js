const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const apiRoutes = require('./routes/apiRoutes');
const fs = require('fs');


const app = express();
app.use(cors());

app.use(fileUpload());
const PORT = process.env.PORT || 5000;

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
app.post("/upload", function (req, res) {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  const files = req.files.file;

  const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    

    console.log(getDirectories(__dirname));

  if (files.constructor.name == "Array") {
    files.forEach((file) => {
      file.mv(`${__dirname}/client/build/uploads/${file.name}`, (err) => {
        if (err) {          
          console.log('server.js, file.mv Array', err);
          return res.status(500).send(err);
        }
      });
    });
  } else {
    files.mv(`${__dirname}/client/build/uploads/${files.name}`, (err) => {
      if (err) {
        console.log('server.js, file.mv single file', err);
        console.log(err);
        return res.status(500).send(err);
      }
    });
  }
  res.json({ fileName: files.name, filePath: `/uploads/${files}` });
});

// Download Endpoint
app.get("/download", function (req, res) {
  const file = `${__dirname}/output.xlsx`;
  res.download(file);
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => console.log("Server started!"));
