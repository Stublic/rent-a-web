import BlogTab from './BlogTab';

export default async function BlogPage({ params }) {
    const { id } = await params;
    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <BlogTab projectId={id} />
        </div>
    );
}
