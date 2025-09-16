const faceRecognitionService = require('./services/faceRecognitionService');
const Face = require('./models/Face');
const path = require('path');
const fs = require('fs');

async function testFaceRecognitionWorkflow() {
    console.log('🧪 Testing Face Recognition Workflow');
    console.log('=====================================');
    
    try {
        // Initialize face recognition service
        console.log('1. Initializing face recognition service...');
        await faceRecognitionService.initialize();
        
        if (faceRecognitionService.dlibAvailable) {
            console.log('✓ Using dlib high-accuracy face recognition');
        } else {
            console.log('⚠ Using fallback mode');
        }
        
        // Check if we have any uploaded faces
        console.log('\n2. Checking uploaded faces...');
        const uploadedFaces = await Face.find();
        console.log(`Found ${uploadedFaces.length} faces in database`);
        
        if (uploadedFaces.length > 0) {
            const testFace = uploadedFaces[0];
            console.log(`\nTesting with face: ${testFace.name} (${testFace.category})`);
            console.log(`Image path: ${testFace.imagePath}`);
            console.log(`Encoding length: ${testFace.encodings ? testFace.encodings.length : 'No encoding'}`);
            
            // Test if the image file exists
            const imagePath = path.join(__dirname, testFace.imagePath);
            if (fs.existsSync(imagePath)) {
                console.log('✓ Face image file exists');
                
                // Test face detection on the uploaded image
                console.log('\n3. Testing face detection on uploaded image...');
                const detections = await faceRecognitionService.detectFaces(imagePath);
                console.log(`Detected ${detections.length} face(s) in uploaded image`);
                
                if (detections.length > 0) {
                    const detection = detections[0];
                    console.log(`Face box: ${JSON.stringify(detection.box)}`);
                    console.log(`Encoding length: ${detection.encoding ? detection.encoding.length : 'No encoding'}`);
                    
                    // Test face matching
                    console.log('\n4. Testing face matching...');
                    const knownFaces = [{
                        id: testFace._id,
                        name: testFace.name,
                        category: testFace.category,
                        encoding: testFace.encodings
                    }];
                    
                    const match = await faceRecognitionService.findBestMatch(
                        detection.encoding,
                        knownFaces,
                        0.6
                    );
                    
                    if (match) {
                        console.log(`✓ Face matched: ${match.name} (confidence: ${match.confidence.toFixed(3)})`);
                        console.log(`✓ Face recognition workflow is working correctly!`);
                    } else {
                        console.log('✗ No match found - may need to adjust threshold or check encodings');
                    }
                } else {
                    console.log('✗ No faces detected in uploaded image');
                }
            } else {
                console.log('✗ Face image file not found');
            }
        } else {
            console.log('\n⚠ No faces uploaded yet');
            console.log('To test the workflow:');
            console.log('1. Go to http://localhost:5000/faces.html');
            console.log('2. Click "Add New Face"');
            console.log('3. Upload a clear face image');
            console.log('4. Start webcam surveillance');
            console.log('5. Show the same face to the webcam');
        }
        
        console.log('\n🎯 Workflow Summary:');
        console.log('1. Upload face → Generate dlib encoding → Store in database');
        console.log('2. Webcam detects face → Generate encoding → Match against stored faces');
        console.log('3. If match found → Create detection record → Show notification');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testFaceRecognitionWorkflow().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});
