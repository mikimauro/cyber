// Utilità per analisi forense delle immagini

import ExifReader from 'exifreader';
import type { EXIFMetadata, ELAResult, AnalysisResult } from '@/types';

// Analisi metadati EXIF
export async function analyzeEXIF(file: File): Promise<EXIFMetadata | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = await ExifReader.load(arrayBuffer);
    
    const metadata: EXIFMetadata = {
      dimensions: {
        width: tags['Image Width']?.value as number || 0,
        height: tags['Image Height']?.value as number || 0,
      }
    };

    // Estrai informazioni camera/dispositivo
    if (tags.Make?.description || tags.Model?.description) {
      metadata.camera = `${tags.Make?.description || ''} ${tags.Model?.description || ''}`.trim();
      metadata.device = metadata.camera;
    }

    // Software utilizzato
    const software = tags.Software?.description;
    if (software) {
      metadata.software = software;
      // Controlla se è software di editing o AI
      const aiTools = ['midjourney', 'dall-e', 'stable diffusion', 'firefly', 'leonardo', 'bing image', 'copilot'];
      const editingTools = ['photoshop', 'gimp', 'lightroom', 'canva', 'pixlr', 'fotor'];
      
      metadata.editingSoftware = [];
      const softwareLower = software.toLowerCase();
      
      aiTools.forEach(tool => {
        if (softwareLower.includes(tool)) metadata.editingSoftware?.push(tool);
      });
      editingTools.forEach(tool => {
        if (softwareLower.includes(tool)) metadata.editingSoftware?.push(tool);
      });
      
      metadata.hasAIsignature = metadata.editingSoftware.some(s => 
        aiTools.includes(s.toLowerCase())
      );
    }

    // Date
    if (tags.DateTimeOriginal?.description) {
      metadata.dateTaken = tags.DateTimeOriginal.description;
    }
    if (tags.ModifyDate?.description) {
      metadata.dateModified = tags.ModifyDate.description;
    }

    // Coordinate GPS
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const lat = convertDMSToDD(tags.GPSLatitude.description, tags.GPSLatitudeRef?.description);
      const lon = convertDMSToDD(tags.GPSLongitude.description, tags.GPSLongitudeRef?.description);
      const alt = typeof tags.GPSAltitude?.value === 'number' ? tags.GPSAltitude.value : undefined;
      
      if (lat && lon) {
        metadata.gps = {
          latitude: lat,
          longitude: lon,
          altitude: alt
        };
      }
    }

    // Compressione
    if (tags.Compression?.description) {
      metadata.compression = tags.Compression.description;
    }

    return metadata;
  } catch (error) {
    console.error('Errore analisi EXIF:', error);
    return null;
  }
}

// Converte coordinate DMS in DD
function convertDMSToDD(dms: string, ref?: string): number | null {
  try {
    const parts = dms.split(',').map(p => parseFloat(p.trim()));
    if (parts.length !== 3) return null;
    
    let dd = parts[0] + parts[1] / 60 + parts[2] / 3600;
    if (ref === 'S' || ref === 'W') {
      dd = -dd;
    }
    return dd;
  } catch {
    return null;
  }
}

// Error Level Analysis (ELA)
export async function performELA(file: File): Promise<ELAResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ errorLevelScore: 0, manipulationProbability: 0, hotspots: [] });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Disegna immagine originale
      ctx.drawImage(img, 0, 0);
      
      // Comprimi e decomprimi per rilevare differenze
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      const compressedImg = new Image();
      
      compressedImg.onload = () => {
        const elaCanvas = document.createElement('canvas');
        const elaCtx = elaCanvas.getContext('2d');
        if (!elaCtx) {
          resolve({ errorLevelScore: 0, manipulationProbability: 0, hotspots: [] });
          return;
        }
        
        elaCanvas.width = img.width;
        elaCanvas.height = img.height;
        
        // Disegna versione compressa
        elaCtx.drawImage(compressedImg, 0, 0);
        
        // Ottieni dati pixel
        const originalData = ctx.getImageData(0, 0, img.width, img.height);
        const compressedData = elaCtx.getImageData(0, 0, img.width, img.height);
        
        // Calcola differenze
        let totalDiff = 0;
        const hotspots: Array<{ x: number; y: number; intensity: number }> = [];
        const threshold = 30;
        
        for (let i = 0; i < originalData.data.length; i += 4) {
          const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
          const gDiff = Math.abs(originalData.data[i + 1] - compressedData.data[i + 1]);
          const bDiff = Math.abs(originalData.data[i + 2] - compressedData.data[i + 2]);
          
          const diff = (rDiff + gDiff + bDiff) / 3;
          totalDiff += diff;
          
          if (diff > threshold) {
            const pixelIndex = i / 4;
            const x = pixelIndex % img.width;
            const y = Math.floor(pixelIndex / img.width);
            hotspots.push({ x, y, intensity: diff });
          }
        }
        
        const avgDiff = totalDiff / (originalData.data.length / 4);
        const errorLevelScore = Math.min(100, (avgDiff / 255) * 100 * 5);
        
        // Calcola probabilità manipolazione
        const manipulationProbability = Math.min(100, 
          (hotspots.length / (img.width * img.height)) * 10000 + errorLevelScore * 0.3
        );
        
        // Crea immagine ELA
        const elaData = elaCtx.createImageData(img.width, img.height);
        for (let i = 0; i < originalData.data.length; i += 4) {
          const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
          const gDiff = Math.abs(originalData.data[i + 1] - compressedData.data[i + 1]);
          const bDiff = Math.abs(originalData.data[i + 2] - compressedData.data[i + 2]);
          
          const diff = (rDiff + gDiff + bDiff) / 3;
          const scaled = Math.min(255, diff * 10);
          
          elaData.data[i] = scaled;
          elaData.data[i + 1] = scaled;
          elaData.data[i + 2] = scaled;
          elaData.data[i + 3] = 255;
        }
        
        elaCtx.putImageData(elaData, 0, 0);
        
        URL.revokeObjectURL(url);
        
        resolve({
          errorLevelScore: Math.round(errorLevelScore),
          manipulationProbability: Math.round(manipulationProbability),
          hotspots: hotspots.slice(0, 100), // Limita hotspot
          analysisImage: elaCanvas.toDataURL()
        });
      };
      
      compressedImg.src = compressed;
    };
    
    img.src = url;
  });
}

// Analisi AI - rilevamento contenuti generati da AI
export async function analyzeAIGeneration(file: File): Promise<{
  aiProbability: number;
  indicators: string[];
}> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ aiProbability: 0, indicators: [] });
        return;
      }
      
      // Riduci dimensioni per analisi
      const maxSize = 512;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const indicators: string[] = [];
      
      // Analisi pattern AI
      let unnaturalPatterns = 0;
      let symmetryScore = 0;
      let textureUniformity = 0;
      let noiseConsistency = 0;
      
      // Controlla simmetria facciale (se rileva volto)
      const faceRegion = detectFaceRegion(imageData, canvas.width, canvas.height);
      if (faceRegion) {
        symmetryScore = analyzeSymmetry(imageData, faceRegion, canvas.width);
        if (symmetryScore > 0.85) {
          indicators.push('Simmetria facciale eccessivamente perfetta');
          unnaturalPatterns++;
        }
      }
      
      // Analisi texture
      textureUniformity = analyzeTextureUniformity(imageData);
      if (textureUniformity > 0.9) {
        indicators.push('Texture troppo uniforme, tipica di immagini AI');
        unnaturalPatterns++;
      }
      
      // Analisi rumore
      noiseConsistency = analyzeNoisePattern(imageData);
      if (noiseConsistency < 0.3) {
        indicators.push('Pattern di rumore inconsistente');
        unnaturalPatterns++;
      }
      
      // Controlla bordi
      const edgeArtifacts = detectEdgeArtifacts(imageData, canvas.width, canvas.height);
      if (edgeArtifacts > 0.1) {
        indicators.push('Artefatti sui bordi rilevati');
        unnaturalPatterns++;
      }
      
      // Calcola probabilità AI
      const baseProbability = 30;
      const patternContribution = unnaturalPatterns * 15;
      const textureContribution = textureUniformity > 0.9 ? 20 : 0;
      const symmetryContribution = symmetryScore > 0.85 ? 15 : 0;
      
      const aiProbability = Math.min(98, baseProbability + patternContribution + textureContribution + symmetryContribution);
      
      URL.revokeObjectURL(url);
      
      resolve({
        aiProbability: Math.round(aiProbability),
        indicators
      });
    };
    
    img.src = url;
  });
}

// Funzioni helper per analisi AI
function detectFaceRegion(_imageData: ImageData, width: number, height: number): { x: number; y: number; w: number; h: number } | null {
  // Semplice rilevamento regione centrale (assunta facciale)
  const centerX = width / 2;
  const centerY = height / 2;
  const faceW = width * 0.4;
  const faceH = height * 0.5;
  
  return {
    x: centerX - faceW / 2,
    y: centerY - faceH / 2,
    w: faceW,
    h: faceH
  };
}

function analyzeSymmetry(imageData: ImageData, region: { x: number; y: number; w: number; h: number }, width: number): number {
  let diffSum = 0;
  let count = 0;
  
  const startX = Math.floor(region.x);
  const startY = Math.floor(region.y);
  const endX = Math.floor(region.x + region.w);
  const endY = Math.floor(region.y + region.h);
  const centerX = (startX + endX) / 2;
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < centerX; x++) {
      const leftIdx = (y * width + x) * 4;
      const rightIdx = (y * width + (centerX + (centerX - x))) * 4;
      
      if (rightIdx < imageData.data.length) {
        const rDiff = Math.abs(imageData.data[leftIdx] - imageData.data[rightIdx]);
        const gDiff = Math.abs(imageData.data[leftIdx + 1] - imageData.data[rightIdx + 1]);
        const bDiff = Math.abs(imageData.data[leftIdx + 2] - imageData.data[rightIdx + 2]);
        
        diffSum += (rDiff + gDiff + bDiff) / 3;
        count++;
      }
    }
  }
  
  const avgDiff = diffSum / (count * 255);
  return 1 - avgDiff;
}

function analyzeTextureUniformity(imageData: ImageData): number {
  const blockSize = 16;
  const blocksX = Math.floor(imageData.width / blockSize);
  const blocksY = Math.floor(imageData.height / blockSize);
  
  const variances: number[] = [];
  
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      
      for (let y = by * blockSize; y < (by + 1) * blockSize; y++) {
        for (let x = bx * blockSize; x < (bx + 1) * blockSize; x++) {
          const idx = (y * imageData.width + x) * 4;
          const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
          sum += gray;
          sumSq += gray * gray;
          count++;
        }
      }
      
      const variance = (sumSq / count) - (sum / count) ** 2;
      variances.push(variance);
    }
  }
  
  const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
  const varianceOfVariances = variances.reduce((sum, v) => sum + (v - avgVariance) ** 2, 0) / variances.length;
  
  return 1 / (1 + varianceOfVariances / 1000);
}

function analyzeNoisePattern(imageData: ImageData): number {
  const diffs: number[] = [];
  
  for (let y = 1; y < imageData.height - 1; y++) {
    for (let x = 1; x < imageData.width - 1; x++) {
      const idx = (y * imageData.width + x) * 4;
      const rightIdx = (y * imageData.width + x + 1) * 4;
      const bottomIdx = ((y + 1) * imageData.width + x) * 4;
      
      const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      const rightGray = (imageData.data[rightIdx] + imageData.data[rightIdx + 1] + imageData.data[rightIdx + 2]) / 3;
      const bottomGray = (imageData.data[bottomIdx] + imageData.data[bottomIdx + 1] + imageData.data[bottomIdx + 2]) / 3;
      
      diffs.push(Math.abs(gray - rightGray));
      diffs.push(Math.abs(gray - bottomGray));
    }
  }
  
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((sum, d) => sum + (d - avgDiff) ** 2, 0) / diffs.length;
  
  return Math.min(1, variance / 100);
}

function detectEdgeArtifacts(imageData: ImageData, width: number, height: number): number {
  let edgePixels = 0;
  let artifactPixels = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const leftIdx = (y * width + x - 1) * 4;
      const rightIdx = (y * width + x + 1) * 4;
      
      const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      const leftGray = (imageData.data[leftIdx] + imageData.data[leftIdx + 1] + imageData.data[leftIdx + 2]) / 3;
      const rightGray = (imageData.data[rightIdx] + imageData.data[rightIdx + 1] + imageData.data[rightIdx + 2]) / 3;
      
      const edgeStrength = Math.abs(gray - leftGray) + Math.abs(gray - rightGray);
      
      if (edgeStrength > 50) {
        edgePixels++;
        // Controlla artefatti (transizioni troppo nette)
        if (edgeStrength > 200) {
          artifactPixels++;
        }
      }
    }
  }
  
  return edgePixels > 0 ? artifactPixels / edgePixels : 0;
}

// Analisi completa
export async function analyzeFile(file: File): Promise<Partial<AnalysisResult>> {
  const [metadata, elaResult, aiAnalysis] = await Promise.all([
    analyzeEXIF(file),
    performELA(file),
    analyzeAIGeneration(file)
  ]);

  return {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadDate: new Date(),
    metadata,
    elaAnalysis: elaResult,
    scores: {
      aiGenerated: aiAnalysis.aiProbability,
      manipulated: elaResult.manipulationProbability,
      deepfake: Math.round((aiAnalysis.aiProbability + elaResult.manipulationProbability) / 2),
      authentic: Math.round(100 - Math.max(aiAnalysis.aiProbability, elaResult.manipulationProbability))
    }
  };
}
