// FM26 Main Menu Types

export interface FM26MenuState {
  currentScreen: 'main' | 'newgame' | 'loadgame' | 'settings' | 'credits';
  selectedClub: Club | null;
  currentDate: string;
  newsItems: NewsItem[];
  userProfile: UserProfile;
  hoveredButton: string;
  animTime: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  reputation: number; // 1-100
  transferBudget: number;
  wageBudget: number;
  logoColor: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  date: string;
  category: 'transfer' | 'injury' | 'match' | 'club';
  importance: number; // 1-5
}

export interface UserProfile {
  name: string;
  managerReputation: number;
  clubsManaged: number;
  trophiesWon: number;
  winRate: number;
}

export const FM26_CLUBS: Club[] = [
  { id: 'mci', name: 'Manchester City', shortName: 'Man City', league: 'Premier League', country: 'England', reputation: 95, transferBudget: 180000000, wageBudget: 4500000, logoColor: '#6CABDD' },
  { id: 'liv', name: 'Liverpool FC', shortName: 'Liverpool', league: 'Premier League', country: 'England', reputation: 93, transferBudget: 150000000, wageBudget: 4200000, logoColor: '#C8102E' },
  { id: 'ars', name: 'Arsenal FC', shortName: 'Arsenal', league: 'Premier League', country: 'England', reputation: 91, transferBudget: 140000000, wageBudget: 4000000, logoColor: '#EF0107' },
  { id: 'rm', name: 'Real Madrid', shortName: 'Real Madrid', league: 'La Liga', country: 'Spain', reputation: 96, transferBudget: 200000000, wageBudget: 5000000, logoColor: '#FEBE10' },
  { id: 'bar', name: 'FC Barcelona', shortName: 'Barcelona', league: 'La Liga', country: 'Spain', reputation: 94, transferBudget: 120000000, wageBudget: 4800000, logoColor: '#A50044' },
  { id: 'bay', name: 'Bayern Munich', shortName: 'Bayern', league: 'Bundesliga', country: 'Germany', reputation: 93, transferBudget: 160000000, wageBudget: 4500000, logoColor: '#DC052D' },
  { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', league: 'Ligue 1', country: 'France', reputation: 90, transferBudget: 170000000, wageBudget: 4600000, logoColor: '#004170' },
  { id: 'juv', name: 'Juventus FC', shortName: 'Juventus', league: 'Serie A', country: 'Italy', reputation: 89, transferBudget: 110000000, wageBudget: 3800000, logoColor: '#000000' },
];

export const FM26_NEWS: NewsItem[] = [
  { id: '1', headline: 'Mbappé Breaks Goal Record', summary: 'French striker nets hat-trick in Champions League final to become all-time top scorer.', date: '2026-01-15', category: 'match', importance: 5 },
  { id: '2', headline: 'Record Transfer Bid Rejected', summary: '£150M offer for young midfielder turned down by Premier League champions.', date: '2026-01-14', category: 'transfer', importance: 4 },
  { id: '3', headline: 'Star Striker Out for 6 Weeks', summary: 'Key forward suffers hamstring injury in training, major blow to title hopes.', date: '2026-01-13', category: 'injury', importance: 3 },
  { id: '4', headline: 'New Stadium Plans Approved', summary: 'Club announces £500M expansion project to increase capacity to 75,000.', date: '2026-01-12', category: 'club', importance: 4 },
  { id: '5', headline: 'Youth Academy Wonderkid Signs Pro Deal', summary: '16-year-old sensation commits future to club until 2030.', date: '2026-01-11', category: 'club', importance: 2 },
];

export const FM26_USER: UserProfile = {
  name: 'Manager',
  managerReputation: 75,
  clubsManaged: 3,
  trophiesWon: 7,
  winRate: 58.5,
};
