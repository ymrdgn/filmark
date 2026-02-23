// Demo mode for App Store screenshots
// Set this to true to show generic placeholder content instead of real TMDB data
export const DEMO_MODE = false;

// Import local poster images
const poster1 = require('../assets/images/posters/fantasy1.jpg');
const poster2 = require('../assets/images/posters/minimal-action1.jpg');
const poster3 = require('../assets/images/posters/minimalcinematic.jpg');
const poster4 = require('../assets/images/posters/art-house2.jpg');
const poster5 = require('../assets/images/posters/minimalblack.jpg');
const poster6 = require('../assets/images/posters/art-house1.jpg');

// Generic placeholder movies for screenshots
export const demoMovies = [
  {
    id: '1',
    title: 'The Great Adventure',
    year: '2023',
    poster_url: poster1,
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
    rating: 5,
    watched_date: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Mystery Mountain',
    year: '2024',
    poster_url: poster2,
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
    rating: 4,
    watched_date: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Ocean Dreams',
    year: '2023',
    poster_url: poster3,
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
    rating: 5,
    watched_date: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'City Lights',
    year: '2024',
    poster_url: poster4,
    is_watched: false,
    is_favorite: false,
    is_watchlist: true,
    rating: null,
    watched_date: null,
  },
  {
    id: '5',
    title: 'Forest Tales',
    year: '2022',
    poster_url: poster5,
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
    rating: 3,
    watched_date: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Desert Journey',
    year: '2023',
    poster_url: poster6,
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
    rating: 4,
    watched_date: new Date().toISOString(),
  },
];

// Generic placeholder TV shows for screenshots
export const demoTVShows = [
  {
    id: '1',
    title: 'The Chronicles',
    year: '2023',
    poster_url: poster1,
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
    rating: 5,
    watched_date: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Mystery Files',
    year: '2024',
    poster_url: poster2,
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
    rating: 4,
    watched_date: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Space Adventures',
    year: '2023',
    poster_url: poster3,
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
    rating: 5,
    watched_date: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Time Travelers',
    year: '2024',
    poster_url: poster4,
    is_watched: false,
    is_favorite: false,
    is_watchlist: true,
    rating: null,
    watched_date: null,
  },
  {
    id: '5',
    title: 'Drama Stories',
    year: '2022',
    poster_url: poster5,
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
    rating: 3,
    watched_date: new Date().toISOString(),
  },
];

// Generic TMDB-like data for "All" tab
export const demoTMDBMovies = [
  {
    id: 101,
    title: 'Popular Movie 1',
    release_date: '2024-01-15',
    poster_path: '/demo1', // Placeholder path for DEMO mode
    poster_url: poster1, // Actual asset for rendering
    vote_average: 7.8,
    overview: 'A great story about adventure and friendship.',
  },
  {
    id: 102,
    title: 'Popular Movie 2',
    release_date: '2024-02-20',
    poster_path: '/demo2',
    poster_url: poster2,
    vote_average: 8.2,
    overview: 'An exciting journey through unknown lands.',
  },
  {
    id: 103,
    title: 'Popular Movie 3',
    release_date: '2023-12-10',
    poster_path: '/demo3',
    poster_url: poster3,
    vote_average: 7.5,
    overview: 'A heartwarming tale of courage and hope.',
  },
  {
    id: 104,
    title: 'Popular Movie 4',
    release_date: '2024-03-05',
    poster_path: '/demo4',
    poster_url: poster4,
    vote_average: 8.5,
    overview: 'An unforgettable experience.',
  },
  {
    id: 105,
    title: 'Popular Movie 5',
    release_date: '2023-11-22',
    poster_path: '/demo5',
    poster_url: poster5,
    vote_average: 7.9,
    overview: 'A thrilling adventure.',
  },
  {
    id: 106,
    title: 'Popular Movie 6',
    release_date: '2024-01-30',
    poster_path: '/demo6',
    poster_url: poster6,
    vote_average: 8.1,
    overview: 'A beautiful story.',
  },
];

export const demoTMDBTVShows = [
  {
    id: 201,
    name: 'Popular Show 1',
    first_air_date: '2024-01-15',
    poster_path: '/demo1',
    poster_url: poster1,
    vote_average: 8.3,
    overview: 'An engaging series about mystery and intrigue.',
  },
  {
    id: 202,
    name: 'Popular Show 2',
    first_air_date: '2024-02-20',
    poster_path: '/demo2',
    poster_url: poster2,
    vote_average: 8.7,
    overview: 'A captivating drama series.',
  },
  {
    id: 203,
    name: 'Popular Show 3',
    first_air_date: '2023-12-10',
    poster_path: '/demo3',
    poster_url: poster3,
    vote_average: 7.9,
    overview: 'An exciting adventure series.',
  },
  {
    id: 204,
    name: 'Popular Show 4',
    first_air_date: '2024-03-05',
    poster_path: '/demo4',
    poster_url: poster4,
    vote_average: 8.9,
    overview: 'A must-watch series.',
  },
  {
    id: 205,
    name: 'Popular Show 5',
    first_air_date: '2023-11-22',
    poster_path: '/demo5',
    poster_url: poster5,
    vote_average: 8.2,
    overview: 'A thrilling series.',
  },
];

// Demo recent activity for home screen
export const demoRecentActivity = [
  {
    id: 'demo-1',
    item_id: '1',
    title: 'The Great Adventure',
    type: 'Movie' as const,
    action: 'watched' as const,
    date: new Date().toISOString(),
    poster: poster1,
    rating: 5,
    year: '2023',
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
  },
  {
    id: 'demo-2',
    item_id: '2',
    title: 'Space Adventures',
    type: 'TV Show' as const,
    action: 'favorited' as const,
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    poster: poster3,
    rating: 4,
    year: '2024',
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
  },
  {
    id: 'demo-3',
    item_id: '3',
    title: 'Ocean Dreams',
    type: 'Movie' as const,
    action: 'watched' as const,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    poster: poster2,
    rating: 5,
    year: '2023',
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
  },
];

// Demo friends activity for home screen
export const demoFriendsActivity = [
  {
    id: 'friend-demo-1',
    item_id: '101',
    friendName: 'Alex Johnson',
    friendEmail: 'alex@example.com',
    title: 'Mystery Mountain',
    type: 'Movie' as const,
    action: 'watched' as const,
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    poster: poster6,
    rating: 4,
    year: '2024',
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
  },
  {
    id: 'friend-demo-2',
    item_id: '102',
    friendName: 'Sarah Miller',
    friendEmail: 'sarah@example.com',
    title: 'The Chronicles',
    type: 'TV Show' as const,
    action: 'favorited' as const,
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    poster: poster5,
    rating: 5,
    year: '2023',
    is_watched: true,
    is_favorite: true,
    is_watchlist: false,
  },
  {
    id: 'friend-demo-3',
    item_id: '103',
    friendName: 'Mike Chen',
    friendEmail: 'mike@example.com',
    title: 'City Lights',
    type: 'Movie' as const,
    action: 'watched' as const,
    date: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    poster: poster4,
    rating: 4,
    year: '2024',
    is_watched: true,
    is_favorite: false,
    is_watchlist: false,
  },
];
