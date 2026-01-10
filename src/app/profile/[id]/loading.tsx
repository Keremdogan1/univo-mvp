
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-color, #C8102E)', borderTopColor: 'transparent' }}></div>
        <p className="text-neutral-600 dark:text-neutral-400 font-serif animate-pulse">Profil Yükleniyor...</p>
      </div>
    </div>
  );
}
