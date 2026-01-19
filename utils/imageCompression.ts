import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Comprime una imagen y la convierte a formato WebP
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión personalizadas
 * @returns Archivo comprimido en formato WebP
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 0.5,           // Máximo 500KB después de compresión
    maxWidthOrHeight: 512,    // Avatar no necesita más de 512px
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.8,
  };

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  const compressedBlob = await imageCompression(file, compressionOptions);

  // Crear nuevo File con extensión .webp
  const newFileName = file.name.replace(/\.[^/.]+$/, '.webp');
  const webpFile = new File(
    [compressedBlob],
    newFileName,
    { type: 'image/webp' }
  );

  return webpFile;
}

/**
 * Valida que el archivo no exceda el tamaño máximo permitido
 * @param file - Archivo a validar
 * @param maxMB - Tamaño máximo en MB (por defecto 3MB)
 * @returns true si el archivo es válido, false si excede el límite
 */
export function validateFileSize(file: File, maxMB: number = 3): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Formatea el tamaño de archivo a una cadena legible
 * @param bytes - Tamaño en bytes
 * @returns Cadena formateada (ej: "1.5 MB", "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
