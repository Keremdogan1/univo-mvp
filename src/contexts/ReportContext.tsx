'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import ReportModal from '@/components/ReportModal';

interface ReportTarget {
    type: 'post' | 'comment';
    id: string;
    preview?: string;
}

interface ReportContextType {
    openReportModal: (target: ReportTarget) => void;
}

const ReportContext = createContext<ReportContextType>({
    openReportModal: () => {}
});

export const useReport = () => useContext(ReportContext);

export function ReportProvider({ children }: { children: ReactNode }) {
    const [target, setTarget] = useState<ReportTarget | null>(null);

    const openReportModal = (t: ReportTarget) => setTarget(t);

    return (
        <ReportContext.Provider value={{ openReportModal }}>
            {children}
            <ReportModal
                isOpen={!!target}
                onClose={() => setTarget(null)}
                contentType={target?.type || 'post'}
                contentId={target?.id || ''}
                contentPreview={target?.preview}
            />
        </ReportContext.Provider>
    );
}
