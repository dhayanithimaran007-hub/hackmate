export interface Profile {
  id: string;
  full_name: string;
  username?: string | null;
  headline?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  college?: string | null;
  department?: string | null;
  study_year?: string | null;
  location?: string | null;
  skills?: string[] | null;
  preferred_roles?: string[] | null;
  experience_level?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  leetcode_url?: string | null;
  availability_status?: string | null;
  available_for_hackathons?: boolean;
  email?: string | null;
  phone?: string | null;
  is_email_public?: boolean | null;
  is_phone_public?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  technologies?: string[] | null;
  category?: string | null;
  repository_url?: string | null;
  demo_url?: string | null;
  cover_image_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HackathonExperience {
  id: string;
  user_id: string;
  hackathon_name: string;
  event_date?: string | null;
  project_title?: string | null;
  role?: string | null;
  achievement?: string | null;
  project_url?: string | null;
  verification_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hackathon {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  hackathon_url?: string | null;
  event_date: string;
  registration_deadline: string;
  location?: string | null;
  state?: string | null;
  district?: string | null;
  hosting_college?: string | null;
  city?: string | null;
  venue?: string | null;
  mode: 'Online' | 'Offline' | 'Hybrid';
  team_size: number;
  max_team_size: number;
  open_positions: number;
  experience_level: string;
  skills?: string[] | null;
  required_roles?: string[] | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
  updated_at: string;
  applications?: { count: number }[] | any;
}

export interface Application {
  id: string;
  hackathon_id: string;
  applicant_id: string;
  role: string;
  skills?: string[] | null;
  experience_level?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  contact_email?: string | null;
  contact_phone?: string | null;
  match_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface HackathonMember {
  id: string;
  hackathon_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}
