import React, { useState } from 'react';
import Upload from './Upload';
import VideoPlayer from './VideoPlayer';

function App() {
    const [videoUrl, setVideoUrl] = useState('https://dof5s84llwxl1.cloudfront.net/hls/master.m3u8');

    const handleUploadSuccess = () => {
        const cacheBuster = new Date().getTime(); // Unique timestamp
        const newUrl = `https://dof5s84llwxl1.cloudfront.net/hls/master.m3u8?cache=${cacheBuster}`;
        setVideoUrl(newUrl);
        console.log('New video URL set:', newUrl); // Debugging log
    };

    return (
        <div>
            <h1>Copper Health Video Uploader</h1>
            <div className="upload-container">
                <Upload onUploadSuccess={handleUploadSuccess} />
            </div>
            <div className="video-container">
                <h2>Video Playback</h2>
                {videoUrl ? (
                    <VideoPlayer key={videoUrl} videoUrl={videoUrl} /> // Use 'key' to force re-render
                ) : (
                    <p>Loading video...</p>
                )}
            </div>
        </div>
    );
}

export default App;
