// src/lib/pdf/image-uploader.ts

import { createClient } from '@/lib/supabase/server';

export interface UploadedImage {
  pageNumber: number;
  url: string;
  width: number;
  height: number;
}

export async function uploadPageImages(
  pages: PdfPage[],
  lessonId: string
): Promise<UploadedImage[]> {
  const supabase = await createClient();
  const uploadedImages: UploadedImage[] = [];

  for (const page of pages) {
    try {
      // Convert data URL to buffer
      const base64Data = page.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Supabase Storage
      const fileName = `${lessonId}/page-${page.pageNumber}.png`;
      
      const { data, error } = await supabase.storage
        .from('lesson-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true,
          cacheControl: '31536000', // 1 year
        });

      if (error) {
        console.error(`Failed to upload page ${page.pageNumber}:`, error);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lesson-images')
        .getPublicUrl(fileName);

      uploadedImages.push({
        pageNumber: page.pageNumber,
        url: publicUrl,
        width: page.width,
        height: page.height,
      });
    } catch (error) {
      console.error(`Error processing page ${page.pageNumber}:`, error);
    }
  }

  return uploadedImages;
}