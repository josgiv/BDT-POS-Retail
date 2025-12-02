import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
            <div className="text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-2xl">
                        <span className="text-6xl font-extrabold text-white">404</span>
                    </div>
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">
                        Halaman Tidak Ditemukan
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-md mx-auto mb-8">
                        Maaf, halaman yang Anda cari tidak tersedia. Mungkin telah dipindahkan atau tidak pernah ada.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        size="lg"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        <Link href="/">
                            <Home className="h-5 w-5 mr-2" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-neutral-300 hover:bg-neutral-100"
                    >
                        <Link href="/login">
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Ke Halaman Login
                        </Link>
                    </Button>
                </div>

                <div className="mt-12">
                    <div className="inline-block p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200">
                        <p className="text-sm text-neutral-500">
                            Butuh bantuan? Hubungi administrator sistem
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
