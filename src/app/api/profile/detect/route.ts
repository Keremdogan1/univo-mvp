import { NextResponse } from 'next/server';
import { analyzeCourses } from '@/lib/course-analyzer';
import getSupabaseAdmin from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get user metadata for courses
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const courses = user.user_metadata.odtu_courses || [];
        
        if (!courses || courses.length === 0) {
            return NextResponse.json({ error: 'No courses found to analyze' }, { status: 404 });
        }

        // 2. Analyze courses
        const detectionResult = analyzeCourses(courses);

        // 3. Update profile with detected info
        // We use metadata to store these even if profile columns don't exist yet
        // This ensures the data is safe
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...user.user_metadata,
                detected_department: detectionResult.detectedDepartment,
                detected_class: detectionResult.detectedClass,
                detection_confidence: detectionResult.confidence,
                is_prep: detectionResult.isPrep
            }
        });

        if (updateAuthError) {
            console.error('Error updating auth metadata:', updateAuthError);
        }

        // 4. Update profiles table
        // We attempt to update these columns. If they don't exist, we'll catch the error.
        // For now, let's keep it robust.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                // We use these names, if they don't exist it might error
                // but we can also store the raw result in a jsonb field if available
                metadata: {
                    ...(user.user_metadata.profile_metadata || {}),
                    detected_department: detectionResult.detectedDepartment,
                    detected_class: detectionResult.detectedClass,
                    detection_confidence: detectionResult.confidence
                }
            })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            detection: detectionResult
        });

    } catch (error: any) {
        console.error('Detection API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
