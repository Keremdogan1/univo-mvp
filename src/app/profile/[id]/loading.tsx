
export default function Loading() {
  return (
    <div className="w-full flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-serif animate-pulse">Profil Yükleniyor...</p>
      </div>
    </div>
  );
}
