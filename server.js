const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });
AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

const invalidateCache = async () => {
    const params = {
        DistributionId: 'EYZ28X0QYJPYT', 
        InvalidationBatch: {
            CallerReference: `invalidate-${Date.now()}`, 
            Paths: {
                Quantity: 1,
                Items: ['/*'], 
            },
        },
    };

    return cloudfront.createInvalidation(params).promise();
};

app.post('/upload', upload.single('video'), (req, res) => {
    const file = req.file;
    const hlsOutputFolder = `uploads/${file.filename}-hls`;

    // Ensure HLS output folder exists
    if (!fs.existsSync(hlsOutputFolder)) {
        fs.mkdirSync(hlsOutputFolder, { recursive: true });
    }

    // Define quality variants
    const qualities = [
        { name: '1080p', resolution: '1920x1080', bitrate: '4500k' },
        { name: '720p', resolution: '1280x720', bitrate: '2500k' },
        { name: '480p', resolution: '854x480', bitrate: '1000k' },
        { name: '360p', resolution: '640x360', bitrate: '600k' }
    ];

    //playlist variants
    const generateVariant = (quality) => {
        return new Promise((resolve, reject) => {
            ffmpeg(file.path)
                .outputOptions([
                    '-c:v h264',
                    '-c:a aac',
                    '-ac 2',
                    '-hls_time 10',
                    '-hls_list_size 0',
                    '-hls_segment_type mpegts',
                    '-hls_playlist_type vod',
                    `-vf scale=${quality.resolution}`,
                    `-b:v ${quality.bitrate}`,
                    '-preset fast',
                    '-g 48',
                    '-sc_threshold 0',
                    `-hls_segment_filename ${hlsOutputFolder}/${quality.name}_%03d.ts`
                ])
                .output(`${hlsOutputFolder}/${quality.name}.m3u8`)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
    };

    //master playlist
    const generateMasterPlaylist = () => {
        let master = '#EXTM3U\n#EXT-X-VERSION:3\n';
        qualities.forEach(quality => {
            const [width, height] = quality.resolution.split('x');
            master += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.resolution}\n`;
            master += `${quality.name}.m3u8\n`;
        });
        return master;
    };

    //s3 upload
    const processAndUpload = async () => {
        try {
            // Generate all quality variants
            await Promise.all(qualities.map(generateVariant));

            // Write and upload master playlist
            const masterContent = generateMasterPlaylist();
            fs.writeFileSync(`${hlsOutputFolder}/master.m3u8`, masterContent);

            // Upload all files to S3
            const files = fs.readdirSync(hlsOutputFolder);
            for (const hlsFile of files) {
                const filePath = path.join(hlsOutputFolder, hlsFile);
                const fileStream = fs.createReadStream(filePath);

                const params = {
                    Bucket: 'copper-health-videos-output',
                    Key: `hls/${hlsFile}`,
                    Body: fileStream,
                    ContentType: hlsFile.endsWith('.m3u8')
                        ? 'application/vnd.apple.mpegurl'
                        : 'video/MP2T',
                };

                await s3.upload(params).promise();
                console.log(`Uploaded ${hlsFile} to S3`);
            }

            // Clean up
            fs.rmSync(hlsOutputFolder, { recursive: true, force: true });
            fs.unlinkSync(file.path);

            // Invalidate CloudFront cache
            await invalidateCache();

            return {
                message: 'Video processed successfully',
                url: `https://dof5s84llwxl1.cloudfront.net/hls/master.m3u8`
            };
        } catch (error) {
            console.error('Processing error:', error);
            throw error;
        }
    };

    processAndUpload()
        .then(result => {
            res.json(result);
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});

app.listen(3000, () => console.log('Server running on port 3000'));
