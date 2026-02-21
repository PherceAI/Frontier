import HandsBottomNav from '@/components/hands/HandsBottomNav';

export default function CamarerasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Add extra padding at the bottom so the content isn't hidden by the navigation bar
    return (
        <div className="pb-[5.5rem] min-h-screen bg-[#F0F2F5] dark:bg-gray-900 font-[family-name:var(--font-outfit)]">
            {children}
            <HandsBottomNav basePath="/hands/camareros" />
        </div>
    );
}
