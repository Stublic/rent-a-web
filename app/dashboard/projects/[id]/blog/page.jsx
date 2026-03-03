import BlogTab from './BlogTab';

export default async function BlogPage({ params }) {
    const { id } = await params;
    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
            <BlogTab projectId={id} />
        </div>
    );
}
