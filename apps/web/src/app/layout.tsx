import type { Metadata } from 'next';
import './globals.css';
import { TourProvider } from '../components/tour/TourProvider';

export const metadata: Metadata = {
    title: 'EAOS — Enterprise Agent Operating System',
    description: 'Mission Control for intelligent enterprise agents — Marketing Execution, Engineering Intelligence, Learning & Upskilling',
    authors: [{ name: 'Phani Marupaka', url: 'https://linkedin.com/in/phani-marupaka' }],
    creator: 'Phani Marupaka',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased">
                <TourProvider>
                    {children}
                </TourProvider>
            </body>
        </html>
    );
}
