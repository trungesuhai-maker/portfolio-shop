export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  period: string;
  honors: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 0 - 100
}

export interface ToolItem {
  id: string;
  name: string;
  iconName?: string;
  logoUrl?: string;
  category?: 'design' | 'frontend' | 'backend' | 'devops' | 'productivity' | 'custom';
  level?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  period: string;
  tags: string[];
  description: string;
  link?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
  proficiency: number; // 1 to 5
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface CVSectionTitles {
  contact: string;
  profile: string;
  experience: string;
  education: string;
  skills: string;
  tools: string;
  projects: string;
  languages: string;
  certifications: string;
}

export interface CVLayoutSections {
  sidebar: Array<'contact' | 'profile' | 'skills' | 'languages' | 'certifications'>;
  main: Array<'experience' | 'tools' | 'projects' | 'education'>;
}

export interface CVDocument {
  id: string;
  title: string;
  updatedAt: string;
  status: 'published' | 'hidden' | 'draft';
  templateTheme: string;
  personalInfo: {
    fullName: string;
    jobTitle: string;
    avatar: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    github?: string;
    linkedin?: string;
  };
  sectionTitles: CVSectionTitles;
  layoutOrder: CVLayoutSections;
  profileSummary: string;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  skills: SkillItem[];
  tools: ToolItem[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
}
