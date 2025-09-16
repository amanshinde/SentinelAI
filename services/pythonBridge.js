const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Python Bridge for Dlib Face Recognition Service
 * Handles communication between Node.js and Python dlib service
 */
class PythonBridge {
    constructor() {
        this.pythonPath = 'python'; // or 'python3' depending on system
        this.scriptPath = path.join(__dirname, 'dlibFaceRecognition.py');
        this.modelsPath = path.join(process.cwd(), 'data_dlib');
        this.isInitialized = false;
    }

    /**
     * Execute Python script with given arguments
     */
    async executePython(command, args = {}) {
        return new Promise((resolve, reject) => {
            const pythonArgs = [this.scriptPath, command];
            
            // Add arguments
            if (args.image) pythonArgs.push('--image', args.image);
            if (args.encoding1) pythonArgs.push('--encoding1', JSON.stringify(args.encoding1));
            if (args.encoding2) pythonArgs.push('--encoding2', JSON.stringify(args.encoding2));
            if (args.knownEncodings) pythonArgs.push('--known-encodings', JSON.stringify(args.knownEncodings));
            if (args.threshold) pythonArgs.push('--threshold', args.threshold.toString());
            pythonArgs.push('--models-path', this.modelsPath);

            const python = spawn(this.pythonPath, pythonArgs);
            
            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
                }
            });

            python.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    /**
     * Initialize the dlib face recognition service
     */
    async initialize() {
        try {
            const result = await this.executePython('init');
            this.isInitialized = result.success;
            return result;
        } catch (error) {
            return {
                success: false,
                error: `Initialization failed: ${error.message}`
            };
        }
    }

    /**
     * Detect faces in an image
     */
    async detectFaces(imagePath) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            return await this.executePython('detect', { image: imagePath });
        } catch (error) {
            return {
                success: false,
                error: `Face detection failed: ${error.message}`
            };
        }
    }

    /**
     * Generate face encoding for an image
     */
    async generateEncoding(imagePath) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            return await this.executePython('encode', { image: imagePath });
        } catch (error) {
            return {
                success: false,
                error: `Encoding generation failed: ${error.message}`
            };
        }
    }

    /**
     * Compare two face encodings
     */
    async compareFaces(encoding1, encoding2, threshold = 0.6) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            return await this.executePython('compare', {
                encoding1,
                encoding2,
                threshold
            });
        } catch (error) {
            return {
                success: false,
                error: `Face comparison failed: ${error.message}`
            };
        }
    }

    /**
     * Find best match from known encodings
     */
    async findBestMatch(unknownEncoding, knownEncodings, threshold = 0.6) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            return await this.executePython('match', {
                encoding1: unknownEncoding,
                knownEncodings,
                threshold
            });
        } catch (error) {
            return {
                success: false,
                error: `Face matching failed: ${error.message}`
            };
        }
    }

    /**
     * Check if Python and required packages are available
     */
    async checkDependencies() {
        try {
            const result = await this.executePython('init');
            return {
                success: true,
                pythonAvailable: true,
                dlibAvailable: result.success,
                message: result.success ? 'All dependencies available' : result.error
            };
        } catch (error) {
            return {
                success: false,
                pythonAvailable: false,
                dlibAvailable: false,
                message: error.message
            };
        }
    }
}

module.exports = PythonBridge;
