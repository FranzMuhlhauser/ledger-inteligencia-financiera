/**
 * Compress an image file to reduce file size while maintaining quality
 * @param file - The image file to compress
 * @param maxWidth - Maximum width for the compressed image
 * @param maxHeight - Maximum height for the compressed image
 * @param quality - JPEG/WEBP quality (0.1 - 1.0)
 * @returns Promise<Blob> - Compressed image as blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a file to a compressed blob if it's an image
 * @param file - The file to process
 * @param maxSizeMB - Maximum file size in MB (default: 2MB)
 * @returns Promise<File> - Processed file (compressed if image)
 */
export async function processFileForUpload(
  file: File,
  maxSizeMB: number = 2
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  try {
    const compressedBlob = await compressImage(file, 1920, 1920, 0.8);
    
    // If compressed size is still too large, reduce quality
    let finalBlob = compressedBlob;
    let currentQuality = 0.8;
    
    while (finalBlob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.3) {
      currentQuality -= 0.1;
      finalBlob = await compressImage(file, 1920, 1920, currentQuality);
    }
    
    // Create new file with webp extension
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([finalBlob], `${baseName}.webp`, {
      type: 'image/webp',
    });
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
