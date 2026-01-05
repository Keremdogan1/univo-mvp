export default function Footer() {
  return (
    <footer className="bg-white border-t-4 border-black mt-20 pb-12">
      {/* Decorative Strip */}
      <div className="h-2 bg-black w-full mb-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-white w-full h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 25% 50%, 50% 100%, 75% 50%)' }}></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-4xl font-black font-serif uppercase tracking-tighter border-b-2 border-black pb-2 inline-block">
              Univo
            </h3>
            <p className="text-neutral-900 font-serif italic leading-relaxed text-sm">
              "Kampüsün nabzı, öğrencinin sesi." <br/>
              Ankara'nın en güncel üniversite gazetesi.
            </p>
            <div className="pt-4">
               <span className="inline-block bg-black text-white px-3 py-1 font-bold text-xs uppercase tracking-widest">
                  EST. 2025
               </span>
            </div>
          </div>

          {/* Navigation - Vertical Rules */}
          <div className="md:col-span-1 border-l-2 border-black pl-8 border-l-0 pl-0 md:border-l-2 md:pl-8">
            <h4 className="font-bold font-serif uppercase mb-4 text-sm tracking-wider">Bölümler</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="/" className="hover:underline decoration-2 underline-offset-2">Resmi Gündem</a></li>
              <li><a href="/?tab=community" className="hover:underline decoration-2 underline-offset-2">Topluluk Meydanı</a></li>
              <li><a href="/?tab=voice" className="hover:underline decoration-2 underline-offset-2">Kampüsün Sesi</a></li>
            </ul>
          </div>

          <div className="md:col-span-1 border-l-2 border-black pl-8 border-l-0 pl-0 md:border-l-2 md:pl-8">
             <h4 className="font-bold font-serif uppercase mb-4 text-sm tracking-wider">Kategoriler</h4>
             <ul className="space-y-2 text-sm font-medium">
               <li><a href="/?category=event" className="hover:bg-neutral-100 block -ml-2 px-2 py-1 transition-colors">Etkinlikler</a></li>
               <li><a href="/?category=announcement" className="hover:bg-neutral-100 block -ml-2 px-2 py-1 transition-colors">Duyurular</a></li>
               <li><a href="/?category=workshop" className="hover:bg-neutral-100 block -ml-2 px-2 py-1 transition-colors">Atölyeler</a></li>
             </ul>
          </div>

          {/* Contact / Legal */}
          <div className="md:col-span-1 border-l-2 border-black pl-8">
            <h4 className="font-bold font-serif uppercase mb-4 text-sm tracking-wider">Künye</h4>
            <address className="not-italic text-sm text-neutral-600 mb-6 font-serif">
              ODTÜ Üniversiteler Mah.<br />
              Dumlupınar Blv. No:1<br />
              06800 Çankaya/Ankara
            </address>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
               &copy; 2025 UNIVO GAZETTE.<br/>Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
