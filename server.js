const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Firebase初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();
const upload = multer({ dest: 'uploads/' });

// POSTエンドポイント
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const tempPath = req.file.path;
  const fileName = `${Date.now()}-${req.file.originalname}`;
  const dest = `images/${fileName}`;

  try {
    await bucket.upload(tempPath, {
      destination: dest,
      metadata: {
        contentType: req.file.mimetype
      }
    });
    fs.unlinkSync(tempPath);
    res.status(200).send('Upload success!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed.');
  }
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
}); 