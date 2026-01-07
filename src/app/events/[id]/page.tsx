import { notFound } from 'next/navigation';
import { mockEvents } from '@/data/mockEvents';
import { Calendar, MapPin, Users, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import RSVPButton from '@/components/RSVPButton';
import AttendeesList from '@/components/AttendeesList';
import AddToCalendarButton from '@/components/AddToCalendarButton';
import EventFeedbackButton from '@/components/EventFeedbackButton';
import AnnouncementComments from '@/components/AnnouncementComments';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  const isPastEvent = new Date(event.date) < new Date();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors">
      {/* Newspaper Navigation Strip */}
      <div className="border-b-4 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 transition-colors">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-sm hover:underline decoration-2 underline-offset-2 dark:text-white"
          >
            <ArrowLeft size={20} className="border-2 border-black dark:border-white rounded-full p-0.5" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Newspaper Header Block */}
        <header className="mb-10 text-center border-b-4 border-black dark:border-white pb-8 relative transition-colors">
           <div className="flex justify-center mb-4">
              <span className="bg-black dark:bg-white text-white dark:text-black px-4 py-1 font-bold uppercase tracking-widest text-sm transition-colors">
                {event.category === 'event' ? 'ETKİNLİK HABERİ' : 'DUYURU'}
              </span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black font-serif text-black dark:text-white mb-6 leading-tight uppercase transition-colors">
            {event.title}
          </h1>
           <div className="flex justify-center items-center gap-4 text-sm font-bold font-serif border-t-2 border-black dark:border-white pt-4 w-fit mx-auto px-8 dark:text-white transition-colors">
              <span>{formatDate(event.date).toUpperCase()}</span>
              <span className="w-2 h-2 bg-black dark:bg-white rounded-full"></span>
              <span>{event.time}</span>
              <span className="w-2 h-2 bg-black dark:bg-white rounded-full"></span>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=ODTÜ+Devrim+Stadyumu" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline decoration-2 underline-offset-4 cursor-pointer hover:text-primary transition-colors"
              >
                {event.location.toUpperCase()}
              </a>
           </div>

           <div className="absolute bottom-0 left-0 bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors">
              {event.category === 'event' ? 'ETKİNLİK' : 
               event.category === 'workshop' ? 'ATÖLYE' :
               event.category === 'talk' ? 'KONUŞMA' : 
               event.category === 'announcement' ? 'TOPLANTI' : 'ETKİNLİK'}
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
             {/* Lead / Excerpt */}
             <div className="text-xl font-serif font-medium leading-relaxed italic border-l-4 border-neutral-300 dark:border-neutral-700 pl-6 mb-8 text-neutral-800 dark:text-neutral-300 transition-colors">
                "{event.excerpt}"
             </div>

             {/* Description Body */}
             <div className="prose prose-lg max-w-none font-serif text-neutral-900 dark:text-neutral-200 leading-relaxed prose-headings:font-sans prose-headings:font-bold prose-headings:uppercase prose-p:text-neutral-800 dark:prose-p:text-neutral-300 transition-colors">
                <div className="whitespace-pre-wrap">
                  {event.description}
                </div>
             </div>
             
             {/* Organizer Signature */}
             {/* Note: This block was partly moved or we redefine it to be clickable */}
             
             {/* Feedback (if past) */}
             {isPastEvent && (
                 <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg transition-colors">
                     <h4 className="font-bold text-lg mb-2 flex items-center gap-2 dark:text-yellow-500">
                         <Star className="text-yellow-600 fill-yellow-600 dark:text-yellow-500 dark:fill-yellow-500" />
                         Etkinlik Tamamlandı
                     </h4>
                     <p className="mb-4 text-neutral-700 dark:text-neutral-300">Bu etkinliğe katıldıysan deneyimini paylaşabilirsin.</p>
                     
                     <EventFeedbackButton eventId={id} eventTitle={event.title} />
                 </div>
             )}

             <div className="mt-12 pt-8 border-t-2 border-black dark:border-white flex items-center justify-between transition-colors">
                <div>
                   <span className="block text-xs uppercase font-bold text-neutral-500 mb-1">Haber Kaynağı / Düzenleyen</span>
                   <Link href={`/community/${event.community.id}`} className="text-xl font-black font-serif hover:underline text-blue-600 dark:text-blue-400">
                        {event.community.name}
                   </Link>
                </div>
                <div className="text-right">
                    <span className="block text-xs uppercase font-bold text-neutral-500 mb-1">Konum</span>
                    <span className="font-bold dark:text-white">{event.location}</span>
                </div>
             </div>

             {/* Student Views Section (Official Announcements Only) */}
             {event.category === 'announcement' && (
                 <div className="mt-12">
                     <AnnouncementComments announcementId={event.id} />
                 </div>
             )}
          </div>

          {/* Sidebar / Action Column */}
          <div className="lg:col-span-1 space-y-8">
             {/* Action Card */}
             <div className="bg-neutral-50 dark:bg-neutral-900 border-4 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] transition-colors">
                <h3 className="text-2xl font-black font-serif uppercase mb-6 border-b-2 border-black dark:border-white pb-2 text-center dark:text-white">
                   Katılım Durumu
                </h3>

                {!isPastEvent ? (
                    <RSVPButton 
                      eventId={id} 
                      eventTitle={event.title}
                      eventDate={event.date}
                      eventTime={event.time}
                      eventLocation={event.location}
                      eventDescription={event.description}
                    />
                ) : (
                    <div className="text-center font-bold text-neutral-500 py-4 border-2 border-neutral-300 bg-neutral-100 italic">
                        Etkinlik sona erdi
                    </div>
                )}
                
                {/* Calendar Button removed as per request (RSVPButton handles it) */}
             </div>

             {/* Attendees Card */}
             <div className="border-2 border-black dark:border-white p-6 dark:bg-neutral-900 transition-colors">
                <h3 className="font-bold uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-white">
                   <Users size={20} />
                   Katılımcılar
                </h3>
                <AttendeesList eventId={id} />
             </div>
          </div>
        </div>
      </article>
    </div>
  );
}
