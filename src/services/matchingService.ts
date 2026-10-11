import type { Hackathon, Application } from '../types/database';

export interface MatchScores {
  skillScore: number;
  roleScore: number;
  experienceScore: number;
  matchScore: number;
}

export interface MatchExplanation {
  skillReason: string;
  roleReason: string;
  experienceReason: string;
  summary: string;
  qualityLabel: string;
}

// const STOP_WORDS = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but', 'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was', 'so', 'if', 'out', 'not', 'can', 'my', 'will', 'need', 'looking']);


export const matchingService = {
  calculateSkillScore(hackathonSkills: string[], applicantSkills: string[]): number {
    if (!hackathonSkills || hackathonSkills.length === 0) return 100;
    if (!applicantSkills || applicantSkills.length === 0) return 0;
    
    const applicantSkillsLower = applicantSkills.map(s => s.toLowerCase());
    let matchedSkills = 0;
    
    hackathonSkills.forEach(skill => {
      if (applicantSkillsLower.includes(skill.toLowerCase())) {
        matchedSkills++;
      }
    });
    
    return Math.round((matchedSkills / hackathonSkills.length) * 100);
  },

  calculateRoleScore(hackathonRoles: string[], applicantRole: string): number {
    if (!hackathonRoles || hackathonRoles.length === 0) return 100;
    if (!applicantRole) return 0;

    const applicantRoleLower = applicantRole.toLowerCase();
    const matched = hackathonRoles.some(r => r.toLowerCase() === applicantRoleLower);
    
    return matched ? 100 : 0;
  },

  calculateExperienceScore(hackathonExp: string, applicantExp: string): number {
    if (!hackathonExp) return 100;
    if (!applicantExp) return 50;

    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
    const reqLevel = levels[hackathonExp.toLowerCase() as keyof typeof levels] || 2;
    const appLevel = levels[applicantExp.toLowerCase() as keyof typeof levels] || 2;

    if (appLevel >= reqLevel) return 100;
    if (reqLevel - appLevel === 1) return 50; // One level below is partial match
    return 20; // Two levels below is poor match
  },

  calculateMatchScore(skillScore: number, roleScore: number, experienceScore: number): number {
    // Skills (50%), Role (30%), Experience (20%)
    const match = (skillScore * 0.50) + (roleScore * 0.30) + (experienceScore * 0.20);
    return Math.round(match);
  },

  evaluateApplication(
    hackathon: Pick<Hackathon, 'skills' | 'required_roles' | 'experience_level'>,
    application: Pick<Application, 'skills' | 'role' | 'experience_level'>
  ): MatchScores {
    const skillScore = this.calculateSkillScore(hackathon.skills || [], application.skills || []);
    const roleScore = this.calculateRoleScore(hackathon.required_roles || [], application.role || '');
    const experienceScore = this.calculateExperienceScore(hackathon.experience_level || '', application.experience_level || '');
    const matchScore = this.calculateMatchScore(skillScore, roleScore, experienceScore);

    return {
      skillScore,
      roleScore,
      experienceScore,
      matchScore
    };
  },

  getMatchQualityLabel(matchScore: number): string {
    if (matchScore >= 90) return 'PERFECT MATCH';
    if (matchScore >= 75) return 'STRONG MATCH';
    if (matchScore >= 60) return 'GOOD MATCH';
    if (matchScore >= 40) return 'PARTIAL MATCH';
    return 'WEAK MATCH';
  },

  generateExplanation(scores: MatchScores, _hackathon: any, _application: any): MatchExplanation {
    let skillReason = '';
    if (scores.skillScore >= 90) skillReason = `Matches almost all required skills.`;
    else if (scores.skillScore >= 50) skillReason = `Matches some of the required skills.`;
    else skillReason = `Missing most required skills.`;

    let roleReason = '';
    if (scores.roleScore === 100) roleReason = `Applied for a role you are actively looking for.`;
    else roleReason = `Applied for a role that was not explicitly requested.`;

    let experienceReason = '';
    if (scores.experienceScore >= 90) experienceReason = `Meets or exceeds the required experience level.`;
    else if (scores.experienceScore >= 50) experienceReason = `Slightly below the requested experience level.`;
    else experienceReason = `Significantly below the requested experience level.`;

    const qualityLabel = this.getMatchQualityLabel(scores.matchScore);
    const summary = `${qualityLabel} (${scores.matchScore}%). Applicant ${scores.skillScore >= 80 ? 'has' : 'lacks'} required skills, ${scores.roleScore === 100 ? 'matches' : 'does not match'} open roles, and ${scores.experienceScore >= 80 ? 'has' : 'lacks'} the right experience.`;

    return {
      skillReason,
      roleReason,
      experienceReason,
      summary,
      qualityLabel
    };
  }
};
