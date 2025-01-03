import React, { useRef, useEffect } from 'react';
import 'video.js/dist/video-js.css';
import videojs from 'video.js';

function VideoPlayer({ videoUrl }) {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
      if (!videoRef.current) return;
  
      // Dispose of the previous player instance if it exists
      if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
      }
  
      // Initialize the video.js player
      playerRef.current = videojs(videoRef.current, {
          controls: true,
          fluid: true,
          preload: 'auto',
          responsive: true,
      });
  
      // Set the new video source
      playerRef.current.src({
          src: videoUrl,
          type: 'application/x-mpegURL',
      });
  
      return () => {
          // Clean up the player on unmount
          if (playerRef.current) {
              playerRef.current.dispose();
              playerRef.current = null;
          }
      };
  }, [videoUrl]); // Re-run whenever videoUrl changes
  

    return (
        <div data-vjs-player>
            <video
                ref={videoRef}
                className="video-js vjs-big-play-centered"
                playsInline
            >
                <p className="vjs-no-js">
                    To view this video please enable JavaScript, or try a different browser
                </p>
            </video>
        </div>
    );
}

export default VideoPlayer;
