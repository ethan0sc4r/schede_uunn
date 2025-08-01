// Utility functions for exporting canvas to PDF/PNG

export const exportCanvasToPNG = async (containerElement: HTMLElement, filename: string, unitId?: number, layoutConfig?: any) => {
  console.log('🔍 Starting PNG export...');
  
  // STRATEGY 1: Try server-side PNG export first (most reliable)
  try {
    console.log('🎯 Attempting server-side PNG export (primary method)...');
    await tryServerSideScreenshot(containerElement, filename, unitId, layoutConfig);
    return; // If successful, we're done
  } catch (serverError) {
    console.log('⚠️ Server-side export failed, trying client-side...', serverError);
  }
  
  // STRATEGY 2: Client-side with advanced image handling
  try {
    console.log('🔍 Attempting client-side PNG export...');
    
    // Clone element to avoid modifying original
    const clonedElement = containerElement.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0px';
    document.body.appendChild(clonedElement);
    
    try {
      // Convert ALL images to base64 FIRST
      await forceConvertAllImagesToBase64(clonedElement);
      
      // Wait for processing
      console.log('⏳ Waiting for image processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // html2canvas with safe settings
      const canvas = await (window as any).html2canvas(clonedElement, {
        backgroundColor: '#ffffff',
        useCORS: false,
        allowTaint: true,
        scale: 1,
        logging: false, // Reduced logging
        imageTimeout: 30000,
        removeContainer: false,
        foreignObjectRendering: false,
        proxy: undefined,
        width: clonedElement.offsetWidth,
        height: clonedElement.offsetHeight,
        onclone: (clonedDoc: Document) => {
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.removeAttribute('crossorigin');
          });
        }
      });
      
      console.log('✅ Client-side canvas created:', canvas.width, 'x', canvas.height);
      
      // Try toBlob() first
      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('toBlob returned null'));
            }
          }, 'image/png', 0.95);
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('📥 Client-side PNG export completed via toBlob()');
        
      } catch (blobError) {
        console.log('❌ toBlob() failed, trying toDataURL():', blobError);
        
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📥 Client-side PNG export completed via toDataURL()');
      }
      
    } finally {
      document.body.removeChild(clonedElement);
    }
    
  } catch (clientError: any) {
    console.error('❌ Both server-side and client-side PNG export failed:', clientError);
    
    // Final user message
    alert(`
      ❌ Export PNG non riuscito.
      
      🔧 Problemi tecnici rilevati:
      • Client-side: ${clientError.message || 'Canvas tainted'}
      • Server-side: Endpoint non disponibile
      
      📋 Usa la STAMPA (funziona perfettamente):
      La stampa può salvare come PDF convertibile in PNG.
    `);
    
    throw clientError;
  }
};

export const printCanvas = async (containerElement: HTMLElement) => {
  try {
    console.log('🖨️ Starting print with HTML-only approach...');
    
    // Create HTML content for printing (no canvas involved)
    const printHTML = createPrintHTML(containerElement);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      throw new Error('Impossibile aprire finestra di stampa');
    }
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    console.log('🖨️ Print window opened successfully');
    
  } catch (error: any) {
    console.error('❌ Print error:', error);
    alert(`Errore durante la stampa: ${error.message}`);
    throw error;
  }
};

// Helper function to wait for all images to load
const waitForImagesToLoad = async (containerElement: HTMLElement): Promise<void> => {
  const images = containerElement.querySelectorAll('img');
  console.log(`🔍 Found ${images.length} images to wait for`);
  
  // Log detailed info about each image
  images.forEach((img, index) => {
    console.log(`🔍 Image ${index + 1} details:`, {
      src: img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.width,
      height: img.height,
      crossOrigin: img.crossOrigin,
      alt: img.alt
    });
  });
  
  const imagePromises = Array.from(images).map((img, index) => {
    return new Promise<void>((resolve) => {
      console.log(`🔍 Processing image ${index + 1}:`, img.src);
      
      // Remove crossOrigin from ALL images to prevent taint
      if (img.crossOrigin) {
        img.removeAttribute('crossorigin');
        console.log(`🔓 Removed crossOrigin from image ${index + 1} to prevent taint`);
        
        // Reload image without crossOrigin
        if (img.complete) {
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
            console.log(`🔄 Reloaded image ${index + 1} without crossOrigin`);
          }, 100);
        }
      }
      
      if (img.complete && img.naturalWidth > 0) {
        console.log(`✅ Image ${index + 1} already loaded (${img.naturalWidth}x${img.naturalHeight})`);
        resolve();
      } else {
        console.log(`⏳ Waiting for image ${index + 1} to load`);
        
        const onLoad = () => {
          console.log(`✅ Image ${index + 1} loaded successfully (${img.naturalWidth}x${img.naturalHeight})`);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (error: any) => {
          console.log(`❌ Image ${index + 1} failed to load:`, error);
          console.log(`❌ Failed image src:`, img.src);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          
          // Try to reload the image with a cache-busting parameter
          if (!img.src.includes('?reload=')) {
            const separator = img.src.includes('?') ? '&' : '?';
            const newSrc = img.src + separator + 'reload=' + Date.now();
            console.log(`🔄 Trying to reload image ${index + 1} with: ${newSrc}`);
            img.src = newSrc;
            
            // Give it another chance
            setTimeout(() => {
              if (img.complete && img.naturalWidth > 0) {
                console.log(`✅ Image ${index + 1} loaded after reload`);
              } else {
                console.log(`❌ Image ${index + 1} still failed after reload`);
              }
              resolve();
            }, 2000);
          } else {
            resolve(); // Already tried reload, give up
          }
        };
        
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        
        // Force reload if not complete
        if (!img.complete) {
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
          }, 100);
        }
        
        // Timeout after 15 seconds per image
        setTimeout(() => {
          console.log(`⏰ Timeout waiting for image ${index + 1}, continuing anyway`);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve();
        }, 15000);
      }
    });
  });
  
  await Promise.all(imagePromises);
  console.log('✅ All images processed');
};

// Helper function to convert images to base64 for better html2canvas compatibility
const convertImagesToBase64 = async (containerElement: HTMLElement): Promise<void> => {
  const images = containerElement.querySelectorAll('img');
  console.log(`🔄 Converting ${images.length} images to base64 for export compatibility`);
  
  const conversionPromises = Array.from(images).map(async (img, index) => {
    // Skip if already base64
    if (img.src.startsWith('data:')) {
      console.log(`⏭️ Image ${index + 1} already base64, skipping`);
      return;
    }
    
    // Skip if image failed to load
    if (!img.complete || img.naturalWidth === 0) {
      console.log(`⏭️ Image ${index + 1} not loaded properly, skipping conversion`);
      return;
    }
    
    try {
      console.log(`🔄 Converting image ${index + 1} to base64:`, img.src);
      
      // ALWAYS convert ALL images to base64 to avoid canvas taint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.log(`❌ Failed to get canvas context for image ${index + 1}`);
        return;
      }
      
      // Create a new image element WITHOUT crossOrigin to avoid taint
      const newImg = new Image();
      
      return new Promise<void>((resolve) => {
        newImg.onload = () => {
          try {
            // Set canvas size to image size
            canvas.width = newImg.naturalWidth;
            canvas.height = newImg.naturalHeight;
            
            // Draw image to canvas
            ctx.drawImage(newImg, 0, 0);
            
            // Convert to base64
            const base64 = canvas.toDataURL('image/png', 0.9);
            
            // Replace image source with base64
            img.src = base64;
            
            console.log(`✅ Image ${index + 1} converted to base64 (${base64.length} chars)`);
            resolve();
          } catch (error) {
            console.log(`❌ Failed to draw/convert image ${index + 1}:`, error);
            resolve();
          }
        };
        
        newImg.onerror = () => {
          console.log(`❌ Failed to load image ${index + 1} for conversion`);
          resolve();
        };
        
        // Load the image
        newImg.src = img.src;
      });
      
    } catch (error) {
      console.log(`❌ Failed to convert image ${index + 1} to base64:`, error);
      // Continue with original src
    }
  });
  
  await Promise.all(conversionPromises);
  console.log('✅ Image conversion completed');
};

// Convert element to SVG string
const elementToSVG = (element: HTMLElement): string => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  // Get all stylesheets
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');
  
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <defs>
        <style>
          <![CDATA[
            ${styles}
          ]]>
        </style>
      </defs>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${element.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  
  return svgString;
};

// Create HTML for printing without canvas issues
const createPrintHTML = (containerElement: HTMLElement): string => {
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');

  const content = containerElement.outerHTML;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Naval Unit Card</title>
        <style>
          ${styles}
          
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          body {
            margin: 0;
            padding: 20px;
            background: white;
            font-family: Arial, sans-serif;
          }
          
          @media print {
            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 1000);
          };
        </script>
      </body>
    </html>
  `;
};

// Create SVG representation of DOM element
const createSVGFromDOM = async (element: HTMLElement): Promise<string> => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  // Create SVG with embedded HTML
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="${computedStyle.cssText}">
          ${await serializeElementWithImages(element)}
        </div>
      </foreignObject>
    </svg>
  `;
  
  return svgContent;
};

// Serialize element with embedded base64 images
const serializeElementWithImages = async (element: HTMLElement): Promise<string> => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  const images = clonedElement.querySelectorAll('img');
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      if (!img.src.startsWith('data:')) {
        const base64 = await imageToBase64(img.src);
        img.src = base64;
      }
    } catch (error) {
      console.log(`Failed to convert image ${i + 1} to base64:`, error);
    }
  }
  
  return clonedElement.outerHTML;
};

// Convert image URL to base64
const imageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// Fallback PNG export using simplified approach
const exportFallbackPNG = async (containerElement: HTMLElement, filename: string) => {
  console.log('🔄 Using fallback PNG export method...');
  
  // Simple canvas copy approach
  const rect = containerElement.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rect.width, rect.height);
  
  // Create download with white background
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 0.95);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('📥 Fallback PNG download triggered');
};

// Load dom-to-image library dynamically
const loadDomToImage = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).domtoimage !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/dom-to-image@2.6.0/dist/dom-to-image.min.js';
    
    script.onload = () => {
      console.log('✅ dom-to-image loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.log('❌ Failed to load dom-to-image, will use fallback');
      resolve(); // Don't reject, just use fallback
    };
    
    document.head.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ dom-to-image loading timeout, using fallback');
      resolve();
    }, 10000);
  });
};

// ADVANCED: Force convert ALL images to base64 with robust handling
const forceConvertAllImagesToBase64 = async (containerElement: HTMLElement): Promise<void> => {
  const images = containerElement.querySelectorAll('img');
  console.log(`🔄 Force converting ${images.length} images to base64...`);
  
  const conversionPromises = Array.from(images).map(async (img, index) => {
    try {
      console.log(`🔄 Processing image ${index + 1}: ${img.src}`);
      
      // Skip if already base64
      if (img.src.startsWith('data:')) {
        console.log(`⏭️ Image ${index + 1} already base64`);
        return;
      }
      
      // Method 1: Fetch + FileReader (most reliable)
      try {
        const response = await fetch(img.src, {
          method: 'GET',
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          img.src = base64;
          console.log(`✅ Image ${index + 1} converted via fetch (${base64.length} chars)`);
          return;
        }
      } catch (fetchError) {
        console.log(`❌ Fetch failed for image ${index + 1}:`, fetchError);
      }
      
      // Method 2: Canvas conversion (fallback)
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Cannot get canvas context');
        }
        
        // Create new image without crossorigin
        const newImg = new Image();
        
        const base64 = await new Promise<string>((resolve, reject) => {
          newImg.onload = () => {
            try {
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              ctx.drawImage(newImg, 0, 0);
              
              const dataUrl = canvas.toDataURL('image/png', 0.9);
              resolve(dataUrl);
            } catch (canvasError) {
              reject(canvasError);
            }
          };
          
          newImg.onerror = () => reject(new Error('Image load failed'));
          newImg.src = img.src;
        });
        
        img.src = base64;
        console.log(`✅ Image ${index + 1} converted via canvas (${base64.length} chars)`);
        
      } catch (canvasError) {
        console.log(`❌ Canvas conversion failed for image ${index + 1}:`, canvasError);
        console.log(`⚠️ Keeping original src for image ${index + 1}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to process image ${index + 1}:`, error);
    }
  });
  
  await Promise.all(conversionPromises);
  console.log('✅ All images processed for base64 conversion');
};

// Convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not string'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
};

// Server-side screenshot using existing backend PNG export
const tryServerSideScreenshot = async (containerElement: HTMLElement, filename: string, unitId?: number, layoutConfig?: any): Promise<void> => {
  try {
    console.log('🔄 Attempting server-side PNG export...');
    
    // Use provided unitId or extract from URL
    let finalUnitId = unitId;
    
    if (!finalUnitId) {
      const urlParts = window.location.pathname.split('/');
      console.log(`🔍 URL parts:`, urlParts);
      const unitIdIndex = urlParts.indexOf('unit') + 1;
      finalUnitId = parseInt(urlParts[unitIdIndex]);
      
      console.log(`🔍 Unit ID extracted from URL: ${finalUnitId} (index: ${unitIdIndex})`);
    } else {
      console.log(`🔍 Unit ID provided directly: ${finalUnitId}`);
    }
    
    if (!finalUnitId || isNaN(finalUnitId)) {
      console.error(`❌ Invalid unit ID: ${finalUnitId} from URL: ${window.location.pathname}`);
      throw new Error(`Cannot determine unit ID: ${finalUnitId}`);
    }
    
    console.log(`📡 Calling server PNG export for unit ID: ${finalUnitId}`);
    
    // Use existing backend PNG export endpoint with layout config
    const response = await fetch(`/api/public/units/${finalUnitId}/export/png`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layout_config: layoutConfig || null
      })
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('📥 Server-side PNG export completed successfully');
      alert('✅ Export PNG completato tramite server!');
      
    } else {
      const errorText = await response.text();
      console.error('❌ Server PNG export failed:', response.status, errorText);
      throw new Error(`Server PNG export failed: ${response.status}`);
    }
    
  } catch (serverError) {
    console.log('❌ Server-side PNG export failed:', serverError);
    
    // Final fallback: inform user with better options
    alert(`
      ⚠️ Export PNG automatico non disponibile.
      
      📋 Soluzioni alternative:
      1. 🖨️ Usa la STAMPA (funziona perfettamente)
      2. 📸 Screenshot manuale: F12 → tasto destro → "Cattura screenshot del nodo"
      3. 📄 La stampa può salvare come PDF convertibile in PNG
      
      💡 La stampa è il metodo più affidabile al momento.
    `);
  }
};

// Helper function to wait for html2canvas
const waitForHtml2Canvas = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    
    const checkLibrary = () => {
      attempts++;
      
      const html2canvasLoaded = typeof (window as any).html2canvas !== 'undefined';
      
      console.log(`🔄 html2canvas check attempt ${attempts}:`, html2canvasLoaded);
      
      if (html2canvasLoaded) {
        console.log('✅ html2canvas loaded successfully');
        resolve();
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error('❌ html2canvas failed to load');
        reject(new Error('html2canvas non caricato'));
        return;
      }
      
      setTimeout(checkLibrary, 500);
    };
    
    checkLibrary();
  });
};