'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type CommunityPost = {
    id: string
    community_id: string
    user_id: string
    content: string | null
    media_url: string | null
    is_announcement: boolean
    created_at: string
    updated_at: string
    profiles?: {
        full_name: string
        avatar_url: string
        department?: string
        class_year?: string
    }
    reaction_count?: number
    comment_count?: number
    user_reaction?: 'like' | 'dislike' | null
}

export type CommunityPostComment = {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    parent_id: string | null;
    profiles?: {
        full_name: string;
        avatar_url: string;
        department?: string;
        class_year?: string;
    };
    reactions?: { reaction_type: 'like' | 'dislike'; user_id: string }[];
    reaction_count?: number;
    user_reaction?: 'like' | 'dislike' | null;
    children?: CommunityPostComment[];
}

export async function getCommunityPosts(communityId: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('community_posts')
            .select(`
                *,
                profiles:user_id (full_name, avatar_url, department, class_year),
                reactions:community_post_reactions(reaction_type, user_id),
                comments:community_post_comments(id)
            `)
            .eq('community_id', communityId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching posts:', error)
            return []
        }

        const { data: { user } } = await supabase.auth.getUser()

        return data.map(post => {
            const reactions = post.reactions || []
            const userReaction = user ? (reactions as any[]).find((r: any) => r.user_id === user.id) : null
            
            return {
                ...post,
                reaction_count: reactions.length,
                comment_count: post.comments?.length || 0,
                user_reaction: userReaction ? userReaction.reaction_type : null
            }
        }) as CommunityPost[]
    } catch (e) {
        console.error('Unexpected error in getCommunityPosts:', e)
        return []
    }
}

export async function createPost(communityId: string, content: string, mediaUrl?: string, isAnnouncement: boolean = false) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Oturum açmanız gerekiyor' }
        }

        const { error } = await supabase
            .from('community_posts')
            .insert({
                community_id: communityId,
                user_id: user.id,
                content,
                media_url: mediaUrl,
                is_announcement: isAnnouncement
            })

        if (error) {
            console.error('Error creating post:', error)
            return { success: false, message: 'Gönderi oluşturulurken bir hata oluştu' }
        }

        revalidatePath(`/community/${communityId}/chat`)
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in createPost:', e)
        return { success: false, message: 'Beklenmedik bir hata oluştu' }
    }
}

export async function getPostComments(postId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
            *,
            profiles:user_id (full_name, avatar_url, department, class_year),
            reactions:community_comment_reactions(reaction_type, user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Process comments to add reaction counts and user reaction state
    const processedComments = data.map(comment => {
        const reactions = comment.reactions || []
        const userReaction = user ? (reactions as any[]).find((r: any) => r.user_id === user.id) : null
        
        // Calculate aggregate count: Like (+1), Dislike (-1)
        const likes = (reactions as any[]).filter(r => r.reaction_type === 'like').length
        const dislikes = (reactions as any[]).filter(r => r.reaction_type === 'dislike').length
        
        return {
            ...comment,
            reaction_count: likes - dislikes,
            user_reaction: userReaction ? userReaction.reaction_type : null,
            children: []
        }
    })

    // Build tree
    const commentMap: Record<string, CommunityPostComment> = {}
    const roots: CommunityPostComment[] = []

    processedComments.forEach(comment => {
        commentMap[comment.id] = comment as CommunityPostComment
    })

    processedComments.forEach(comment => {
        if (comment.parent_id && commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].children?.push(commentMap[comment.id])
        } else {
            roots.push(commentMap[comment.id])
        }
    })

    return roots
}

export async function createComment(postId: string, content: string, parentId: string | null = null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Oturum açmanız gerekiyor' }
        }

        const { error } = await supabase
            .from('community_post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content,
                parent_id: parentId
            })

        if (error) {
            console.error('Error creating comment:', error)
            return { success: false, message: 'Yorum yapılamadı' }
        }

        // Trigger notification if not replying to self
        const { data: post } = await supabase
            .from('community_posts')
            .select('user_id, community_id')
            .eq('id', postId)
            .single()

        if (post && post.user_id !== user.id && !parentId) {
            await supabase.from('notifications').insert({
                user_id: post.user_id,
                actor_id: user.id,
                type: 'community_post_comment',
                content: 'Gönderine yorum yaptı',
                target_id: postId,
                metadata: { community_id: post.community_id }
            })
        }

        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in createComment:', e)
        return { success: false, message: 'Beklenmedik bir hata oluştu' }
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, message: 'Oturum açmanız gerekiyor' }

        const { error } = await supabase
            .from('community_post_comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', commentId)
            .eq('user_id', user.id)

        if (error) throw error
        return { success: true }
    } catch (e: any) {
        console.error('Error updateComment:', e)
        return { success: false, message: 'Yorum güncellenemedi' }
    }
}

export async function deleteComment(commentId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, message: 'Yetkisiz erişim' }

        const { error } = await supabase
            .from('community_post_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id) // RLS will also check for community admin

        if (error) throw error
        return { success: true }
    } catch (e: any) {
        console.error('Error deleteComment:', e)
        return { success: false, message: 'Yorum silinemedi' }
    }
}

export async function reactToComment(commentId: string, reactionType: 'like' | 'dislike' | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, message: 'Oturum açmanız gerekiyor' }

        if (reactionType === null) {
            const { error } = await supabase
                .from('community_comment_reactions')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('community_comment_reactions')
                .upsert({
                    comment_id: commentId,
                    user_id: user.id,
                    reaction_type: reactionType
                }, { onConflict: 'comment_id,user_id' })
            if (error) throw error
        }

        return { success: true }
    } catch (e: any) {
        console.error('Error in reactToComment:', e)
        return { success: false, message: 'İşlem başarısız' }
    }
}

export async function requestPostPermission(communityId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Oturum açmanız gerekiyor' }
        }

        // Check if already has pending or approved
        const { data: existing, error: fetchError } = await supabase
            .from('community_permission_requests')
            .select('*')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .in('status', ['pending', 'approved'])
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching existing request:', fetchError);
            return { success: false, message: 'İzin durumu kontrol edilirken bir hata oluştu' }
        }

        if (existing) {
            return { success: false, message: 'Zaten beklemede olan veya onaylanmış bir isteğiniz var.' }
        }

        const { error } = await supabase
            .from('community_permission_requests')
            .insert({
                community_id: communityId,
                user_id: user.id,
                status: 'pending'
            })

        if (error) {
            console.error('Error requesting permission:', error)
            return { success: false, message: 'İstek gönderilirken bir veritabanı hatası oluştu' }
        }

        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in requestPostPermission:', e);
        return { success: false, message: 'Beklenmedik bir hata oluştu' }
    }
}

export async function getPendingRequests(communityId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('community_permission_requests')
            .select(`
            *,
            profiles:user_id (full_name, avatar_url)
          `)
            .eq('community_id', communityId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting requests:', error)
            return []
        }

        return data
    } catch (e) {
        console.error('Unexpected error in getPendingRequests:', e)
        return []
    }
}

export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected') {
    try {
        const supabase = await createClient()

        // RLS will check if admin
        const { error } = await supabase
            .from('community_permission_requests')
            .update({ status })
            .eq('id', requestId)

        if (error) {
            console.error('Error updating request:', error)
            throw new Error('Could not update request')
        }

        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in updateRequestStatus:', e)
        return { success: false, message: e.message || 'Bir hata oluştu' }
    }
}

export async function checkUserPermission(communityId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { hasPermission: false, isAdmin: false }

        // Check if admin
        const { data: community, error: communityError } = await supabase
            .from('communities')
            .select('admin_id')
            .eq('id', communityId)
            .maybeSingle()

        if (communityError) {
            console.error('Error checking community admin:', communityError)
        }

        if (community && community.admin_id === user.id) {
            return { hasPermission: true, isAdmin: true }
        }

        // Check if approved request
        const { data: request, error: requestError } = await supabase
            .from('community_permission_requests')
            .select('id')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .maybeSingle()

        if (requestError) {
            console.error('Error checking user permission:', requestError)
        }

        return { hasPermission: !!request, isAdmin: false }
    } catch (e) {
        console.error('Unexpected error in checkUserPermission:', e)
        return { hasPermission: false, isAdmin: false }
    }
}

export async function reactToPost(postId: string, reactionType: 'like' | 'dislike' | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Oturum açmanız gerekiyor' }
        }

        if (reactionType === null) {
            // Remove reaction
            const { error } = await supabase
                .from('community_post_reactions')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id)

            if (error) throw error
        } else {
            // Upsert reaction
            const { error } = await supabase
                .from('community_post_reactions')
                .upsert({
                    post_id: postId,
                    user_id: user.id,
                    reaction_type: reactionType
                }, { onConflict: 'post_id,user_id' })

            if (error) throw error

            // Trigger notification if it's a new like
            if (reactionType === 'like') {
                const { data: post } = await supabase
                    .from('community_posts')
                    .select('user_id, community_id')
                    .eq('id', postId)
                    .single()

                if (post && post.user_id !== user.id) {
                    await supabase.from('notifications').insert({
                        user_id: post.user_id,
                        actor_id: user.id,
                        type: 'community_post_like',
                        content: 'Gönderini beğendi',
                        target_id: postId,
                        metadata: { community_id: post.community_id }
                    })
                }
            }
        }

        return { success: true }
    } catch (e: any) {
        console.error('Error in reactToPost:', e)
        return { success: false, message: 'İşlem başarısız' }
    }
}

export async function deletePost(postId: string, communityId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, message: 'Yetkisiz erişim' }

        const { error } = await supabase
            .from('community_posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id) // RLS also check for admin

        if (error) throw error

        revalidatePath(`/community/${communityId}/chat`)
        return { success: true }
    } catch (e: any) {
        console.error('Error deletePost:', e)
        return { success: false, message: 'Silme işlemi başarısız' }
    }
}
