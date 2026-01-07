
export default function Loading() {
  return (
    <div className="w-full flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-color, #C8102E)', borderTopColor: 'transparent' }}></div>
        <p className="text-neutral-500 font-serif animate-pulse">Profil Yükleniyor...</p>
      </div>
    </div>
  );
}
