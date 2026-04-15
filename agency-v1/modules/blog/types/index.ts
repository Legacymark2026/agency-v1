/**
 * Blog Module - Type Definitions
 * Types for blog posts, categories, tags, and comments
 */

/**
 * Blog post
 */
export interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    coverImage?: string | null;
    published: boolean;
    featured?: boolean;
    author: PostAuthor;
    tags: Tag[];
    categories: Category[];
    readTime?: number;
    views?: number;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date | null;
}

/**
 * Post author information
 */
export interface PostAuthor {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
}

/**
 * Blog category
 */
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    postCount?: number;
}

/**
 * Blog tag
 */
export interface Tag {
    id: string;
    name: string;
    slug?: string;
    postCount?: number;
}

/**
 * Blog comment
 */
export interface Comment {
    id: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string | null;
    approved: boolean;
    postId: string;
    parentId?: string | null;
    replies?: Comment[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Create post input
 */
export interface CreatePostInput {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
    categoryIds?: string[];
    tagIds?: string[];
}

/**
 * Update post input
 */
export interface UpdatePostInput {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
    categoryIds?: string[];
    tagIds?: string[];
}

/**
 * Post filters for queries
 */
export interface PostFilters {
    published?: boolean;
    featured?: boolean;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'publishedAt' | 'views' | 'title';
    order?: 'asc' | 'desc';
}

/**
 * Create comment input
 */
export interface CreateCommentInput {
    postId: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string;
    parentId?: string;
}

/**
 * Blog statistics
 */
export interface BlogStats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalComments: number;
    totalCategories: number;
    totalTags: number;
}
