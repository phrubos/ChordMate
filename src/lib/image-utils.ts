export async function compressImageBase64(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; isJpeg?: boolean } = {}
): Promise<string> {
  const { maxWidth = 1920, maxHeight = 1080, isJpeg = false } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Ha JPEG, fehér háttér biztosítása
        if (isJpeg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Kimentjük WebP formátumban (a legpraktikusabb webes célokra)
        const format = isJpeg ? 'image/jpeg' : 'image/webp';
        const dataUrl = canvas.toDataURL(format, 0.85); // 0.85 jó minőség kisebb méretnél

        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
