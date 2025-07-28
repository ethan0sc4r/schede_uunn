// Utility functions for handling image uploads and management

// Convert base64 to File object
export const base64ToFile = (base64String: string, filename: string): File => {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Determine MIME type from base64 prefix
  const mimeType = base64String.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'png';
  
  return new File([bytes], filename, { type: `image/${mimeType}` });
};

// Upload image to backend and return file path
export const uploadImageToBackend = async (file: File, subfolder: string = 'general'): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('subfolder', subfolder);
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
    const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.file_path; // Return the server file path
    
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Convert base64 image to backend file path
export const convertBase64ToBackendPath = async (base64String: string, elementType: string): Promise<string> => {
  if (!base64String || !base64String.startsWith('data:')) {
    return base64String; // Already a file path or empty
  }
  
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${elementType}_${timestamp}_${randomSuffix}.png`;
    
    // Convert base64 to file
    const file = base64ToFile(base64String, filename);
    
    // Upload to backend with appropriate subfolder
    const subfolder = elementType === 'silhouette' ? 'silhouettes' : 
                     elementType === 'logo' ? 'logos' : 
                     elementType === 'flag' ? 'flags' : 'general';
    const filePath = await uploadImageToBackend(file, subfolder);
    
    console.log(`✅ Converted base64 to backend path: ${filePath}`);
    return filePath;
    
  } catch (error) {
    console.error('❌ Failed to convert base64 to backend path:', error);
    // Fallback: keep base64 for now
    return base64String;
  }
};

// Get full image URL from backend path
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL or base64, return as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Import API_BASE_URL for absolute URLs
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  
  // Convert backend path to full URL
  return `${API_BASE_URL}/api/static/${imagePath}`;
};

// Migrate all base64 images in layout_config to backend files
export const migrateLayoutConfigImages = async (layoutConfig: any): Promise<any> => {
  if (!layoutConfig) {
    return layoutConfig;
  }
  
  // If no elements, return layoutConfig as-is to preserve other properties
  if (!layoutConfig.elements) {
    return layoutConfig;
  }
  
  const migratedElements = await Promise.all(
    layoutConfig.elements.map(async (element: any) => {
      if (element.image && element.image.startsWith('data:')) {
        try {
          const backendPath = await convertBase64ToBackendPath(element.image, element.type);
          return { ...element, image: backendPath };
        } catch (error) {
          console.error(`Failed to migrate image for element ${element.id}:`, error);
          return element; // Keep original if migration fails
        }
      }
      return element;
    })
  );
  
  return { ...layoutConfig, elements: migratedElements };
};