export type Locale = 'ru' | 'en';
export type CollectionItem = { id: string; title: string; description: string; image: string; label: string };
export type Tour = CollectionItem & { duration: string; season: string; price: string; difficulty: string; group: string };
export type Review = { id: string; quote: string; name: string; trip: string; isDemo: true };
