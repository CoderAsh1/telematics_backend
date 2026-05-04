const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const uploadToR2 = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const folder = 'vehicle_icons';
    const safeName = req.file.originalname.replace(/\s+/g, '-');
    const fileName = `${Date.now()}-${safeName}`;
    const key = `${folder}/${fileName}`;

    try {
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }));

        const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

        res.json({
            message: 'File uploaded successfully',
            key,
            url: publicUrl,
        });
    } catch (error) {
        console.error('R2 Upload Error:', error);
        res.status(500).json({
            message: 'Failed to upload to R2',
            error: error.message,
        });
    }
};

module.exports = { uploadToR2 };