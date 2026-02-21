import HandsBottomNav from '@/components/hands/HandsBottomNav';

export default function LimpiezaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pb-[5.5rem] min-h-screen bg-[#F0F2F5] dark:bg-gray-900 font-[family-name:var(--font-outfit)]">
            {children}
            <HandsBottomNav basePath="/hands/limpieza" />
        </div>
    );
}
