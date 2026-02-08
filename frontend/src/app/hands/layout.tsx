// Hands Layout - Mobile Worker Interface (Dark Theme)
export default function HandsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark min-h-screen bg-gray-900">
            {children}
        </div>
    );
}
