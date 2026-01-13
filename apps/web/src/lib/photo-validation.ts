/**
 * Photo Validation Utilities
 * 
 * Basic client-side validation for job photos
 */

// Minimum required dimensions
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export interface PhotoValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

/**
 * Validate photo file before upload
 */
export function validatePhotoFile(file: File): PhotoValidationResult {
    const warnings: string[] = [];

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please use JPEG, PNG, or WebP images.'
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 10MB.'
        };
    }

    // Check for very small files (likely not real photos)
    if (file.size < 10000) { // Less than 10KB
        return {
            valid: false,
            error: 'File is too small. Please take an actual photo.'
        };
    }

    return { valid: true, warnings };
}

/**
 * Validate photo dimensions
 */
export async function validatePhotoDimensions(file: File): Promise<PhotoValidationResult> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const warnings: string[] = [];

            // Check dimensions
            if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
                resolve({
                    valid: false,
                    error: `Photo resolution is too low. Minimum ${MIN_WIDTH}x${MIN_HEIGHT} required.`
                });
                return;
            }

            // Check aspect ratio (should be reasonable, not a screenshot)
            const aspectRatio = img.width / img.height;
            if (aspectRatio < 0.5 || aspectRatio > 2) {
                warnings.push('Unusual aspect ratio detected. Make sure this is a photo of the room.');
            }

            resolve({ valid: true, warnings });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({
                valid: false,
                error: 'Could not load image. Please try a different photo.'
            });
        };

        img.src = url;
    });
}

/**
 * Check if image is too dark or too bright
 */
export async function checkImageBrightness(file: File): Promise<{ brightness: number; warning?: string }> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Create canvas to analyze image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve({ brightness: 128 });
                return;
            }

            // Resize for faster processing
            const maxDim = 100;
            const scale = Math.min(maxDim / img.width, maxDim / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Calculate average brightness
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                // Use luminance formula
                totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            }

            const avgBrightness = totalBrightness / (data.length / 4);

            let warning;
            if (avgBrightness < 40) {
                warning = 'Photo appears too dark. Consider using flash or better lighting.';
            } else if (avgBrightness > 220) {
                warning = 'Photo appears overexposed. Try reducing lighting or adjusting camera.';
            }

            resolve({ brightness: avgBrightness, warning });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ brightness: 128 });
        };

        img.src = url;
    });
}

/**
 * Full validation pipeline
 */
export async function validatePhoto(file: File): Promise<PhotoValidationResult> {
    // Basic file validation
    const fileValidation = validatePhotoFile(file);
    if (!fileValidation.valid) {
        return fileValidation;
    }

    // Dimension validation
    const dimValidation = await validatePhotoDimensions(file);
    if (!dimValidation.valid) {
        return dimValidation;
    }

    // Brightness check (warning only)
    const brightnessCheck = await checkImageBrightness(file);
    
    const warnings = [
        ...(fileValidation.warnings || []),
        ...(dimValidation.warnings || []),
        ...(brightnessCheck.warning ? [brightnessCheck.warning] : [])
    ];

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}
