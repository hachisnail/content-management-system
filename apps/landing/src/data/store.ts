// src/data/store.ts

export interface Article {
  id: string;
  title: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
}

export interface Collection {
  id: string;
  title: string;
  period: string;
  description: string;
  image: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'exhibit' | 'workshop' | 'lecture';
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  gradeLevel: string;
  focus: string;
  duration: string;
}

/* ======================
   EVENTS
====================== */

export const events: Event[] = [
  { id: '1', title: 'Museum Closed (Maintenance)', date: '2025-10-01', type: 'holiday', description: 'Regular monthly maintenance.' },
  { id: '2', title: 'Lecture: Gold of Paracale', date: '2025-10-12', type: 'lecture', description: 'Dr. Santos discusses pre-colonial mining.' },
  { id: '3', title: 'Pottery Workshop', date: '2025-10-15', type: 'workshop', description: 'Hands-on clay molding for kids.' },
  { id: '4', title: 'Camarines Norte Foundation Day', date: '2025-10-24', type: 'holiday', description: 'Provincial holiday. Museum open half-day.' },
  { id: '5', title: 'Gilded Age Exhibit Opening', date: '2025-10-30', type: 'exhibit', description: 'New rotation in the Main Hall.' },
  { id: '6', title: 'Heritage Conservation Talk', date: '2025-11-05', type: 'lecture', description: 'Preserving wooden santos and artifacts.' },
  { id: '7', title: 'Traditional Weaving Workshop', date: '2025-11-12', type: 'workshop', description: 'Learn old Bicol weaving techniques.' },
];

/* ======================
   COLLECTIONS
====================== */

export const collections: Collection[] = [
  {
    id: "pre-colonial",
    title: "Pre-Colonial Tools",
    period: "900 AD – 1565",
    description: "Obsidian blades and early pottery. (In-Person Viewing Only)",
    image: "https://picsum.photos/seed/pre-colonial/800/600"
  },
  {
    id: "war-memorabilia",
    title: "WWII Resistance",
    period: "1941 – 1945",
    description: "Guerrilla weaponry and uniforms. (In-Person Viewing Only)",
    image: "https://picsum.photos/seed/war-memorabilia/800/600"
  },
  {
    id: "religious-art",
    title: "Ecclesiastical Heritage",
    period: "18th – 19th Century",
    description: "Restored wooden Santos and altar panels. (In-Person Viewing Only)",
    image: "https://picsum.photos/seed/religious-art/800/600"
  },
  {
    id: "maritime",
    title: "Bicol Maritime Trade",
    period: "1600 – 1800",
    description: "Boats, anchors, and trading relics from coastal Bicol.",
    image: "https://picsum.photos/seed/maritime/800/600"
  },
  {
    id: "gold",
    title: "Gold of Paracale",
    period: "Pre-colonial – Spanish Era",
    description: "Gold jewelry and mining artifacts from Paracale.",
    image: "https://picsum.photos/seed/gold/800/600"
  }
];

/* ======================
   TOURS (Missing Data)
====================== */
export const tours: Tour[] = [
  { id: 'elementary', title: 'Batang Bicolano', gradeLevel: 'K-6', focus: 'Folklore & Symbols', duration: '1 Hour' },
  { id: 'highschool', title: 'History Makers', gradeLevel: '7-12', focus: 'Colonial History & WWII', duration: '1.5 Hours' },
  { id: 'college', title: 'Heritage Studies', gradeLevel: 'College', focus: 'Ethnography & Archiving', duration: '2 Hours' },
];

/* ======================
   ARTICLES
====================== */

export const articles: Article[] = [
  { 
    id: 'restoration-altar', 
    title: 'Restoration of the 19th Century Altar', 
    date: 'Oct 12, 2025', 
    category: 'News',
    image: 'https://picsum.photos/seed/restoration-altar/900/600',
    excerpt: 'The central retablo returns to its former glory. Read the full restoration report.',
    content: `<p>We are pleased to share the full restoration logs of the altar...</p>` 
  },
  { 
    id: 'mining-history', 
    title: 'New Research: The Paracale Mines', 
    date: 'Sep 28, 2025', 
    category: 'Research',
    image: 'https://picsum.photos/seed/mining-history/900/600',
    excerpt: 'A deep dive into the metallurgical methods of our ancestors.',
    content: `<p>Full academic paper available below...</p>`
  },
  { 
    id: 'pottery-tradition', 
    title: 'Pottery Traditions of Ancient Bicol', 
    date: 'Oct 05, 2025', 
    category: 'Culture',
    image: 'https://picsum.photos/seed/pottery-tradition/900/600',
    excerpt: 'How clay vessels shaped daily life in early communities.',
    content: `<p>Pottery has always been central to Bicolano culture...</p>`
  },
  { 
    id: 'war-stories', 
    title: 'Voices from the Resistance', 
    date: 'Oct 20, 2025', 
    category: 'History',
    image: 'https://picsum.photos/seed/war-stories/900/600',
    excerpt: 'Oral histories from WWII guerrilla fighters.',
    content: `<p>Survivors recall the difficult years of occupation...</p>`
  }
];

/* ======================
   GETTERS
====================== */

export const getArticles = () => articles;
export const getCollections = () => collections;
export const getEvents = () => events;
export const getTours = () => tours;