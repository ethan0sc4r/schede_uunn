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
    
    // Enhanced approach: capture with proper image handling
    const canvas = await (window as any).html2canvas(containerElement, {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false, // Changed to false for better CORS handling
      scale: 2, // Higher scale for better quality
      logging: true, // Enable logging to debug image issues
      imageTimeout: 15000, // Wait up to 15 seconds for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      onclone: (clonedDoc: Document) => {
        // Ensure all images in the cloned document have the correct src
        const images = clonedDoc.querySelectorAll('img');
        images.forEach(img => {
          console.log('🔍 Cloned image src:', img.src);
          // Force reload images in clone
          if (img.src && !img.complete) {
            console.log('🔄 Reloading image in clone:', img.src);
            const originalSrc = img.src;
            img.src = '';
            img.src = originalSrc;
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
    
    // Use same enhanced method as PNG export
    const canvas = await (window as any).html2canvas(containerElement, {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false, // Changed to false for better CORS handling
      scale: 2, // Higher scale for better print quality
      logging: true, // Enable logging to debug image issues
      imageTimeout: 15000, // Wait up to 15 seconds for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      onclone: (clonedDoc: Document) => {
        // Ensure all images in the cloned document have the correct src
        const images = clonedDoc.querySelectorAll('img');
        images.forEach(img => {
          console.log('🔍 Cloned image src for print:', img.src);
          // Force reload images in clone
          if (img.src && !img.complete) {
            console.log('🔄 Reloading image in clone for print:', img.src);
            const originalSrc = img.src;
            img.src = '';
            img.src = originalSrc;
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
  
  const imagePromises = Array.from(images).map((img, index) => {
    return new Promise<void>((resolve) => {
      console.log(`🔍 Checking image ${index + 1}:`, img.src, 'complete:', img.complete);
      
      if (img.complete && img.naturalWidth > 0) {
        console.log(`✅ Image ${index + 1} already loaded`);
        resolve();
      } else {
        console.log(`⏳ Waiting for image ${index + 1} to load`);
        
        const onLoad = () => {
          console.log(`✅ Image ${index + 1} loaded successfully`);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          console.log(`❌ Image ${index + 1} failed to load, continuing anyway`);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve(); // Resolve anyway to not block export
        };
        
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        
        // Timeout after 10 seconds per image
        setTimeout(() => {
          console.log(`⏰ Timeout waiting for image ${index + 1}, continuing anyway`);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve();
        }, 10000);
      }
    });
  });
  
  await Promise.all(imagePromises);
  console.log('✅ All images processed');
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