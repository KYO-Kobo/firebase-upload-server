const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORSの設定
app.use(cors());
app.use(express.json());

// Firebase初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();
const upload = multer({ dest: 'uploads/' });

// ヘルスチェックエンドポイント
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// POSTエンドポイント
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Upload request received');
  
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log(`File received: ${req.file.originalname}, Size: ${req.file.size} bytes`);

  const tempPath = req.file.path;
  const fileName = `${Date.now()}-${req.file.originalname}`;
  const dest = `images/${fileName}`;

  try {
    console.log('Uploading to Firebase Storage...');
    await bucket.upload(tempPath, {
      destination: dest,
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    console.log('Upload successful, cleaning up...');
    fs.unlinkSync(tempPath);
    
    res.status(200).json({
      message: 'Upload success!',
      fileName: fileName,
      path: dest
    });
  } catch (err) {
    console.error('Upload error:', err);
    // 一時ファイルの削除を試みる
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
    res.status(500).json({
      error: 'Upload failed',
      details: err.message
    });
  }
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Firebase Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
}); 