import BlogEditor from '../BlogEditor';

export default async function NewBlogPostPage({ params }) {
    const { id } = await params;
    return <BlogEditor projectId={id} existingPost={null} />;
}
