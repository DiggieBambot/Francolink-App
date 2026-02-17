// src/app/api/admin/content/upload/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const level = formData.get('level') as string;
    const category = formData.get('category') as string;
    const aiProvider = formData.get('aiProvider') as string;
    const targetLanguagesString = formData.get('targetLanguages') as string;

    // Parse target languages
    const targetLanguages = targetLanguagesString 
      ? targetLanguagesString.split(',') 
      : ['en'];

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL (even though bucket is private, we need the path)
    const { data: { publicUrl } } = supabase.storage
      .from('lesson-pdfs')
      .getPublicUrl(storagePath);

    // Create draft record
    const { data: draft, error: draftError } = await supabase
      .from('lesson_drafts')
      .insert({
        original_file_name: file.name,
        pdf_url: publicUrl,
        file_size_bytes: file.size,
        language,
        level,
        category,
        ai_provider: aiProvider,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (draftError) {
      console.error('Draft creation error:', draftError);
      return NextResponse.json(
        { error: 'Failed to create draft record' },
        { status: 500 }
      );
    }

    // Return draft ID and target languages for the processing step
    return NextResponse.json({
      success: true,
      draftId: draft.id,
      targetLanguages,
      message: 'File uploaded successfully. Processing will begin shortly.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}