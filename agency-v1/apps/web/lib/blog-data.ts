import { prisma } from "@/lib/prisma";

export async function dbGetPostComments(postId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                postId,
                approved: true,
                parentId: null
            },
            include: {
                replies: {
                    where: { approved: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return comments.map(comment => ({
            ...comment,
            likeCount: comment.likeCount,
            replies: comment.replies.map(reply => ({
                ...reply,
                likeCount: reply.likeCount
            }))
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function dbGetCommentCount(postId: string): Promise<number> {
    try {
        return await prisma.comment.count({
            where: { postId, approved: true }
        });
    } catch (error) {
        console.error(error);
        return 0;
    }
}
