// English dictionary follows exactly the same shape as Russian; no extra routes yet.
import type { ru } from "./ru";
type Translation<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: Translation<T[K]> }
    : { [K in keyof T]: Translation<T[K]> };
export const en: Translation<typeof ru> = {
  brand: "ZILAL TRAVEL",
  brandCaption: "Journeys through Kyrgyzstan",
  nav: [
    { label: "Destinations", href: "/destinations" },
    { label: "Journeys", href: "/tours" },
    { label: "Experiences", href: "/experiences" },
    { label: "About us", href: "/about" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contacts" },
  ],
  plan: "Plan your journey",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  skip: "Skip to content",
  hero: {
    eyebrow: "KYRGYZSTAN · AT YOUR OWN PACE",
    title: "Closer to nature.\nCloser to yourself.",
    description:
      "Mountain lakes, roads to the clouds and meaningful encounters. Discover Kyrgyzstan with people who call it home.",
    action: "Find your journey",
    secondary: "Discover Kyrgyzstan",
    bottom: "FURTHER FROM THE EVERYDAY. CLOSER TO WHAT MATTERS.",
    location: "Inspired by Issyk-Kul Lake",
    placeholder: "Illustration · space for photography",
  },
  intro: {
    eyebrow: "THE ART OF TRAVEL",
    title: "More than seeing.\nFeeling.",
    description:
      "We believe in journeys that stay with you. A quiet morning by the lake, tea in a yurt and a trail where all you hear is the wind.",
    detail:
      "ZILAL TRAVEL offers an inside view of Kyrgyzstan. Thoughtful itineraries, attention to detail and room for your own discoveries.",
  },
  experiences: {
    eyebrow: "YOUR STORY STARTS HERE",
    title: "Experiences that stay with you",
    description: "Find what speaks to you.",
  },
  tours: {
    eyebrow: "THOUGHTFULLY SELECTED",
    title: "Journeys to inspire",
    description:
      "From a day in the mountains to an adventure across the country.",
    note: "Sample itineraries and prices for this design prototype. Booking is not available.",
    action: "Discuss a similar journey",
    priceLabel: "Sample price",
    perPerson: "per person",
  },
  destinations: {
    eyebrow: "PLACES WITH CHARACTER",
    title: "One Kyrgyzstan.\nA thousand discoveries.",
    description:
      "From turquoise lakes to quiet alpine valleys, every place has its own voice.",
  },
  why: {
    eyebrow: "WHY ZILAL",
    title: "You travel.\nWe care for the details.",
    items: [
      {
        title: "An inside view",
        description: "Discover the places, culture and rhythms of Kyrgyzstan.",
      },
      {
        title: "Your own pace",
        description: "An itinerary built around your interests.",
      },
      {
        title: "Thoughtful details",
        description: "Clear plans, comfortable transfers and time to rest.",
      },
      {
        title: "Meaningful encounters",
        description: "People and their stories are part of the journey.",
      },
    ],
  },
  country: {
    eyebrow: "KYRGYZSTAN",
    title: "Where the horizon\nfeels closer.",
    description:
      "Mountains set the scale; hospitality sets the mood. Alpine pastures, lakes and nomadic culture offer a different way to see the world.",
    detail:
      "Take your time. The most memorable moments rarely follow a schedule.",
    action: "Choose an experience",
    caption: "Highlands · illustration",
  },
  journal: {
    eyebrow: "TRAVEL NOTES",
    title: "The ZILAL journal",
    description: "Small stories for a great journey.",
    note: "Previews of future articles",
  },
  gallery: {
    eyebrow: "THE MOOD OF A JOURNEY",
    title: "Kyrgyzstan in the details",
    description: "A palette of places to experience for yourself.",
    caption: "Visual sketches · photography coming soon",
  },
  reviews: {
    eyebrow: "TRAVELLERS’ WORDS",
    title: "Every journey has a story",
    note: "Sample copy for the design. These are not real customer reviews.",
  },
  cta: {
    eyebrow: "YOUR NEXT JOURNEY",
    title: "Let’s start with a dream.",
    description:
      "Quiet lakes, mountain trails or new encounters? Imagine your journey — there is room for your story.",
    action: "Shape your travel idea",
    note: "Visual prototype: enquiries are not sent.",
    interestsTitle: "What would you like to discover?",
    interests: [
      "Lakes and relaxation",
      "Mountains and trails",
      "Culture and people",
    ],
    selected: "Your choice",
    empty: "Choose the mood of your journey",
    close: "Close",
    dialogTitle: "A journey starts with an idea",
    dialogDescription:
      "Choose interests for a future itinerary. This example runs only in your browser and sends no data.",
  },
  editorial: {
    issue: "Journeys with character · Kyrgyzstan",
    introCaption: "Culture and people · space for photography",
    teamCaption: "The ZILAL team · space for a portrait",
    approach: "Discover our approach",
    allTours: "All journeys",
    allDestinations: "Explore destinations",
    allStories: "Open the journal",
    journalInvitation: "Before the journey",
    journalText:
      "Stories about places, culture and details to help you imagine your trip.",
    galleryLink: "Explore the gallery",
    experienceMoods: {
      trails: "Head into the mountains",
      nomads: "Discover the culture",
      lakes: "Slow down",
    },
    readStory: "Read the story",
    tourDetails: "Explore the journey",
  },
  footer: {
    description: "Thoughtful journeys.\nAuthentic Kyrgyzstan.",
    navigation: "Explore",
    contactTitle: "Stay in touch",
    contactDescription: "Team contact details will be added before launch.",
    place: "Bishkek, Kyrgyzstan",
    copyright: "ZILAL TRAVEL",
    status: "Visual prototype · 2026",
    top: "Back to top",
  },
};
