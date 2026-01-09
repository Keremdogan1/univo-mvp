export type EventCategory = 'event' | 'announcement' | 'workshop' | 'talk';

export interface Community {
  id: string;
  name: string;
  logo?: string;
  category?: string;
}

export interface Event {
  id: string;
  title: string;
  community: Community;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  excerpt: string;
  description: string;
  image?: string;
  image_url?: string;
  quota?: number;
  registration_link?: string;
  maps_url?: string;
}
