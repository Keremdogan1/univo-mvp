import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: settings, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) {
            console.error('Settings fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // Convert array to object for easier consumption
        const settingsMap: Record<string, any> = {};
        settings?.forEach((s: any) => {
             try {
                settingsMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
            } catch {
                settingsMap[s.key] = s.value;
            }
        });

        // Whitelist public settings to avoid leaking internal config if any
        const publicSettings = {
            maintenance_mode: settingsMap.maintenance_mode ?? false,
            registration_enabled: settingsMap.registration_enabled ?? true,
            photo_uploads_enabled: settingsMap.photo_uploads_enabled ?? true,
            video_uploads_enabled: settingsMap.video_uploads_enabled ?? true,
            site_name: settingsMap.site_name || 'Univo',
            announcement_text: settingsMap.announcement_text || '',
        };

        return NextResponse.json(publicSettings);

    } catch (err) {
        console.error('Settings server error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
