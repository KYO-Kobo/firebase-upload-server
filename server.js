// server.js
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Firebase Admin SDK 初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();
const upload = multer({ dest: 'uploads/' });

// ファイルアップロードAPI
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const tempPath = req.file.path;
  const fileName = `images/${Date.now()}-${req.file.originalname}`;

  try {
    await bucket.upload(tempPath, {
      destination: fileName,
      metadata: {
        contentType: req.file.mimetype
      }
    });
    fs.unlinkSync(tempPath);
    res.status(200).send('Upload successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});

// 動作確認用
app.get('/', (req, res) => {
  res.send('Firebase Upload Server is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
