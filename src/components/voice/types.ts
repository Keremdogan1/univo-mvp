export interface Voice {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    is_anonymous: boolean;
    is_editors_choice: boolean;
    is_verified?: boolean;
    tags: string[] | null;
    image_url?: string | null;
    user: {
        full_name: string;
        nickname?: string;
        avatar_url?: string;
        department?: string;
        class_year?: string;
    } | any;
    comments: {
        id: string;
        content: string;
        created_at: string;
        user: string;
        user_id: string;
        user_avatar?: string;
        user_theme?: string;
        parent_id: string | null;
        reactions?: { count: number };
        count: number;
        user_reaction?: string | null;
    }[];
    reactions: {
        user_id: string;
        reaction_type: string;
        created_at: string;
    }[];
    status?: string; // approved, pending, rejected
}

// Re-export comment related types if needed, though they are inline in Voice currently.
