import ProfessionalCoverLetter from "./ProfessionalCoverLetter";

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  component: typeof ProfessionalCoverLetter;
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and classic cover letter design",
    component: ProfessionalCoverLetter,
  },
];

export { ProfessionalCoverLetter };
