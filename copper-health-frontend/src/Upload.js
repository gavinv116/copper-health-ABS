import React, { useState } from 'react';

function Upload() {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('video', file);

        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });
        const message = await response.text();
        alert(message);
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload Video</button>
        </div>
    );
}

export default Upload;
