// Utility functions for exporting canvas to PDF/PNG

export const exportCanvasToPNG = async (containerElement: HTMLElement, filename: string) => {
  try {
    console.log('🔍 Starting PNG export...');
    
    // Wait for html2canvas to load
    await waitForHtml2Canvas();
    
    console.log('📦 Container element:', containerElement);
    console.log('📏 Container dimensions:', {
      offsetWidth: containerElement.offsetWidth,
      offsetHeight: containerElement.offsetHeight
    });
    
    // Wait for all images to load before capturing
    await waitForImagesToLoad(containerElement);
    
    // Skip base64 conversion for now to avoid CORS issues
    // await convertImagesToBase64(containerElement);
    
    // Enhanced approach: capture with proper image handling
    const canvas = await (window as any).html2canvas(containerElement, {
      backgroundColor: '#ffffff',
      useCORS: true, // Enable CORS for proper image handling
      allowTaint: false, // Don't allow taint to enable export
      scale: 2, // Higher scale for better quality
      logging: true, // Enable logging to debug image issues
      imageTimeout: 20000, // Wait up to 20 seconds for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      proxy: undefined, // Disable proxy for local images
      width: containerElement.offsetWidth,
      height: containerElement.offsetHeight,
      onclone: (clonedDoc: Document) => {
        // Ensure all images in the cloned document have the correct src
        const images = clonedDoc.querySelectorAll('img');
        console.log(`🔍 Found ${images.length} images in cloned document`);
        
        images.forEach((img, index) => {
          console.log(`🔍 Image ${index + 1}:`, {
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
          
          // Convert relative URLs to absolute URLs
          if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('http')) {
            const absoluteUrl = new URL(img.src, window.location.origin).href;
            console.log(`🔄 Converting relative URL to absolute: ${img.src} -> ${absoluteUrl}`);
            img.src = absoluteUrl;
          }
          
          // Set crossorigin attribute for ALL images to avoid taint  
          img.crossOrigin = 'anonymous';
          console.log(`🔒 Set crossOrigin=anonymous for cloned image ${index + 1}`);
          
          // Check if image is loaded properly
          if (!img.complete || img.naturalWidth === 0) {
            console.log(`⚠️ Image ${index + 1} not properly loaded in clone`);
          } else {
            console.log(`✅ Image ${index + 1} loaded in clone (${img.naturalWidth}x${img.naturalHeight})`);
          }
        });
      }
    });
    
    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 0.95); // High quality
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📥 PNG download triggered');
    
  } catch (error: any) {
    console.error('❌ PNG export error:', error);
    alert(`Errore esportazione PNG: ${error.message}`);
    throw error;
  }
};

export const printCanvas = async (containerElement: HTMLElement) => {
  try {
    console.log('🖨️ Starting print...');
    
    // Wait for html2canvas to load (same as PNG export)
    await waitForHtml2Canvas();
    
    console.log('📦 Container element:', containerElement);
    console.log('📏 Container dimensions:', {
      offsetWidth: containerElement.offsetWidth,
      offsetHeight: containerElement.offsetHeight
    });
    
    // Wait for all images to load before capturing (same as PNG export)
    await waitForImagesToLoad(containerElement);
    
    // Skip base64 conversion for now to avoid CORS issues
    // await convertImagesToBase64(containerElement);
    
    // Use same enhanced method as PNG export
    const canvas = await (window as any).html2canvas(containerElement, {
      backgroundColor: '#ffffff',
      useCORS: false, // Disable CORS to avoid issues
      allowTaint: true, // Allow taint for local images
      scale: 2, // Higher scale for better print quality
      logging: true, // Enable logging to debug image issues
      imageTimeout: 20000, // Wait up to 20 seconds for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      proxy: undefined, // Disable proxy for local images
      width: containerElement.offsetWidth,
      height: containerElement.offsetHeight,
      onclone: (clonedDoc: Document) => {
        // Ensure all images in the cloned document have the correct src
        const images = clonedDoc.querySelectorAll('img');
        console.log(`🔍 Found ${images.length} images in cloned document for print`);
        
        images.forEach((img, index) => {
          console.log(`🔍 Print Image ${index + 1}:`, {
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
          
          // Convert relative URLs to absolute URLs
          if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('http')) {
            const absoluteUrl = new URL(img.src, window.location.origin).href;
            console.log(`🔄 Converting relative URL to absolute for print: ${img.src} -> ${absoluteUrl}`);
            img.src = absoluteUrl;
          }
          
          // Force reload incomplete images
          if (img.src && !img.complete) {
            console.log(`🔄 Reloading incomplete image ${index + 1} for print:`, img.src);
            const originalSrc = img.src;
            img.src = '';
            // Small delay before setting src back
            setTimeout(() => {
              img.src = originalSrc;
            }, 10);
          }
          
          // Add crossorigin attribute for CORS images
          if (img.src.includes('/api/static/')) {
            img.crossOrigin = 'anonymous';
            console.log(`🔒 Added crossOrigin attribute to print image ${index + 1}`);
          }
        });
      }
    });
    
    console.log('✅ Canvas created for print:', canvas.width, 'x', canvas.height);
    
    // Convert canvas to image data
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      throw new Error('Impossibile aprire finestra di stampa');
    }
    
    // Create simple print HTML with the generated image
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa Scheda Navale</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            img {
              max-width: 100%;
              max-height: 100%;
              width: auto;
              height: auto;
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
          <img src="${imageDataUrl}" alt="Scheda Navale" />
          <script>
            // Auto-print when page loads
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // Close window after printing
                window.onafterprint = function() {
                  window.close();
                };
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;
    
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
      
      // Set crossOrigin for ALL images to avoid taint issues
      if (!img.crossOrigin) {
        img.crossOrigin = 'anonymous';
        console.log(`🔒 Set crossOrigin=anonymous for image ${index + 1}`);
        
        // Only reload if image hasn't loaded yet (avoid breaking working images)
        if (!img.complete || img.naturalWidth === 0) {
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
            console.log(`🔄 Reloaded image ${index + 1} for crossOrigin`);
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
      
      // For /api/static/ images, try to fetch and convert
      if (img.src.includes('/api/static/')) {
        try {
          const response = await fetch(img.src, { 
            method: 'GET',
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                img.src = reader.result;
                console.log(`✅ Image ${index + 1} converted via fetch to base64`);
              }
            };
            
            reader.readAsDataURL(blob);
            return;
          }
        } catch (fetchError) {
          console.log(`❌ Fetch conversion failed for image ${index + 1}:`, fetchError);
        }
      }
      
      // Fallback: standard canvas conversion
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.log(`❌ Failed to get canvas context for image ${index + 1}`);
        return;
      }
      
      // Set canvas size to image size
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/png', 0.9);
      
      // Replace image source with base64
      img.src = base64;
      
      console.log(`✅ Image ${index + 1} converted to base64 (${base64.length} chars)`);
      
    } catch (error) {
      console.log(`❌ Failed to convert image ${index + 1} to base64:`, error);
      // Continue with original src
    }
  });
  
  await Promise.all(conversionPromises);
  console.log('✅ Image conversion completed');
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