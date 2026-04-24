export type UserRole = 'coach' | 'student';

export type ScorecardStatus = 'in_progress' | 'submitted' | 'reviewed';

export type FairwayResult = 'hit' | 'left' | 'right' | null;

export type PinPosition = 'left' | 'right' | 'short' | 'over' | 'pin_high';

export type ClubUsed = 'LW' | 'SW' | 'GW' | 'PW' | '9i' | '8i' | '7i' | '6i' | '5i' | '4i' | '3i' | '2i' | '5H' | '4H' | '3H' | '7w' | '5w' | '3w' | 'D' | null;

export type FirstPuttResult = 'made' | 'short' | 'over' | 'high_side' | 'low_side' | null;

export type MentalityRating = 1 | 2 | 3 | 4;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  coach_id: string | null;
  invite_code: string | null;
  parent_email: string | null;
  parent_first_name: string | null;
  created_at: string;
}

export interface GolfCourse {
  id: string;
  name: string;
  coach_id: string;
  created_at: string;
  holes?: CourseHole[];
}

export interface CourseHole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
}

export interface Scorecard {
  id: string;
  student_id: string;
  course_id: string;
  tournament_name: string;
  round_date: string;
  status: ScorecardStatus;
  hole_count: number;
  hundred_yards_in: number | null;
  reflections: string | null;
  mentality_rating: MentalityRating | null;
  what_transpired: string | null;
  how_to_respond: string | null;
  coach_feedback: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  course?: GolfCourse;
  student?: Profile;
  hole_scores?: HoleScore[];
}

export interface HoleScore {
  id: string;
  scorecard_id: string;
  hole_number: number;
  par: number;
  score: number | null;
  fairway: FairwayResult;
  gir_hit: boolean | null;
  pin_position: PinPosition[] | null;
  putts: number | null;
  first_putt_distance: number | null;
  up_and_down: boolean | null;
  penalty_strokes: number;
  chip_in: boolean;
  coach_note: string | null;
  fairway_miss_distance: number | null;
  club_used: string | null;
  approach_distance: number | null;
  first_putt_result: FirstPuttResult;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'scorecard_submitted' | 'scorecard_reviewed';
  scorecard_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Calculated stats
export interface RoundStats {
  totalScore: number;
  totalPar: number;
  scoreToPar: number;
  front9Score: number;
  front9Par: number;
  back9Score: number;
  back9Par: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  fairwaysMissedLeft: number;
  fairwaysMissedRight: number;
  girHit: number;
  girTotal: number;
  pinPositionLeft: number;
  pinPositionRight: number;
  pinPositionShort: number;
  pinPositionOver: number;
  pinPositionPinHigh: number;
  totalPutts: number;
  onePutts: number;
  threePutts: number;
  chipIns: number;
  upAndDownMade: number;
  upAndDownAttempts: number;
  par3ScoringToPar: number;
  par4ScoringToPar: number;
  par5ScoringToPar: number;
  penaltyStrokes: number;
  avgFairwayMissDistance: number | null;
  avgApproachDistance: number | null;
  clubUsageCounts: Record<string, number>;
  firstPuttMade: number;
  firstPuttShort: number;
  firstPuttOver: number;
  firstPuttHighSide: number;
  firstPuttLowSide: number;
}
