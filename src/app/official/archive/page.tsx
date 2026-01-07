'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Filter, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OfficialArchivePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [yearFilter, setYearFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock initial data or fetch
  useEffect(() => {
    async function fetchDocs() {
        // In real app: fetch from 'official_documents' table
        // For demo: verify if table exists or use mock if empty
        const { data, error } = await supabase.from('official_documents').select('*');
        
        if (data && data.length > 0) {
            setDocuments(data);
        } else {
             // Fallback mock if DB is empty or connection fails
            setDocuments([
                { id: 1, title: '2025-2026 Akademik Takvimi', category: 'Takvim', year: 2025, department: 'ÖİDB', file_url: 'https://pdfobject.com/pdf/sample.pdf' },
                { id: 2, title: 'Yaz Okulu Yönetmeliği', category: 'Yönetmelik', year: 2024, department: 'Rektörlük', file_url: 'https://pdfobject.com/pdf/sample.pdf' },
                { id: 3, title: 'Öğrenci Toplulukları Kuruluş Formu', category: 'Form', year: 2025, department: 'Kültür Müdürlüğü', file_url: 'https://pdfobject.com/pdf/sample.pdf' },
            ]);
        }
        setLoading(false);
    }
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter(doc => {
      const matchYear = yearFilter === 'all' || doc.year === parseInt(yearFilter);
      const matchDept = deptFilter === 'all' || doc.department === deptFilter;
      const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchYear && matchDept && matchSearch;
  });

  const departments = Array.from(new Set(documents.map(d => d.department)));
  const years = Array.from(new Set(documents.map(d => d.year))).sort((a:any,b:any) => b-a);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] pb-12 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b-2 border-black dark:border-neutral-700">
        <div className="container mx-auto px-4 py-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
                <Link href="/official" className="p-2 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors absolute left-4 md:static text-neutral-600 dark:text-neutral-400">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black font-serif uppercase text-black dark:text-white">Resmi Belge Arşivi</h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Üniversite yönetmelikleri, başvuru formları, kılavuzlar ve akademik takvimlerin bulunduğu merkezi arşiv sistemi.
            </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-neutral-900 p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
                        <Filter size={20} />
                        Filtrele
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Arama</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-neutral-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Belge ara..." 
                                    className="w-full pl-9 p-2 border border-neutral-300 dark:border-neutral-700 rounded focus:border-black dark:focus:border-white focus:outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Yıl</label>
                             <select 
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded focus:border-black dark:focus:border-white focus:outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                             >
                                 <option value="all">Tüm Yıllar</option>
                                 {years.map(y => <option key={y} value={y}>{y}</option>)}
                             </select>
                        </div>

                        <div>
                             <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Birim / Bölüm</label>
                             <select 
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded focus:border-black dark:focus:border-white focus:outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                             >
                                 <option value="all">Tüm Birimler</option>
                                 {departments.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                        </div>
                    </div>
                </div>
              </div>

              {/* Document Results */}
              <div className="lg:col-span-3">
                  {loading ? (
                      <div className="text-center py-12 text-neutral-500">Yükleniyor...</div>
                  ) : (
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden text-neutral-900 dark:text-white">
                          <table className="w-full text-left">
                              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">
                                  <tr>
                                      <th className="p-4">Belge Adı</th>
                                      <th className="p-4">Kategori</th>
                                      <th className="p-4">Birim</th>
                                      <th className="p-4">Yıl</th>
                                      <th className="p-4 text-right">İndir</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                  {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
                                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                          <td className="p-4 font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                                              <div className="bg-primary/10 dark:bg-primary/20 text-primary p-2 rounded">
                                                  <FileText size={20} />
                                              </div>
                                              {doc.title}
                                          </td>
                                          <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                                              <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs font-bold border border-neutral-200 dark:border-neutral-700">{doc.category}</span>
                                          </td>
                                          <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">{doc.department}</td>
                                          <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400 font-mono">{doc.year}</td>
                                          <td className="p-4 text-right">
                                              <a 
                                                href={doc.file_url} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                              >
                                                  <Download size={16} />
                                                  <span className="hidden sm:inline">İndir/Görüntüle</span>
                                              </a>
                                          </td>
                                      </tr>
                                  )) : (
                                       <tr>
                                           <td colSpan={5} className="p-8 text-center text-neutral-500 italic">
                                               Arama kriterlerine uygun belge bulunamadı.
                                           </td>
                                       </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
