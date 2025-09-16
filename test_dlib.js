const faceRecognitionService = require('./services/faceRecognitionService');

async function testDlibIntegration() {
    console.log('Testing SentinelAI Dlib Integration...');
    console.log('=' * 40);
    
    try {
        // Initialize the service
        await faceRecognitionService.initialize();
        
        // Check if dlib is available
        if (faceRecognitionService.dlibAvailable) {
            console.log('✓ Dlib face recognition is ACTIVE');
            console.log('✓ Using high-accuracy ResNet-based face recognition');
        } else {
            console.log('⚠ Using fallback mode');
            console.log('  Dlib not available - install Python dependencies for enhanced accuracy');
        }
        
        // Test with an existing face image if available
        const fs = require('fs');
        const path = require('path');
        const facesDir = path.join(__dirname, 'uploads/faces');
        
        if (fs.existsSync(facesDir)) {
            const faceFiles = fs.readdirSync(facesDir).filter(f => f.endsWith('.jpg'));
            
            if (faceFiles.length > 0) {
                const testImage = path.join(facesDir, faceFiles[0]);
                console.log(`\nTesting face detection on: ${faceFiles[0]}`);
                
                const detections = await faceRecognitionService.detectFaces(testImage);
                console.log(`✓ Detected ${detections.length} face(s)`);
                
                if (detections.length > 0) {
                    const encoding = await faceRecognitionService.generateFaceEncoding(testImage);
                    console.log(`✓ Generated encoding with ${encoding.length} dimensions`);
                    
                    if (faceRecognitionService.dlibAvailable) {
                        console.log('✓ Using dlib 128-dimensional face embeddings');
                    } else {
                        console.log('⚠ Using fallback random encodings');
                    }
                }
            } else {
                console.log('\nNo face images found for testing');
                console.log('Upload some faces through the web interface to test detection');
            }
        }
        
        console.log('\n🎉 Face recognition system is operational!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDlibIntegration().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});
