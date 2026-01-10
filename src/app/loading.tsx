export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-[#C8102E] dark:border-white"></div>
        <p className="text-neutral-600 dark:text-neutral-400 font-serif">Yükleniyor...</p>
      </div>
    </div>
  );
}
