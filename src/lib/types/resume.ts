// JSON Resume Schema TypeScript Definitions
// Based on https://jsonresume.org/schema/

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface Profile {
  network?: string;
  username?: string;
  url?: string;
}

export interface ImagePosition {
  x: number; // -100 to 100 percent offset
  y: number; // -100 to 100 percent offset
  scale: number; // 1 to 2 zoom level
}

export interface Basics {
  name?: string;
  label?: string;
  image?: string;
  imagePosition?: ImagePosition;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
}

export interface Work {
  name?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  city?: string;
  country?: string;
}

export interface Volunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Education {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
  isCurrent?: boolean;
}

export interface Award {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface Certificate {
  name?: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface Publication {
  name?: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

export interface Skill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface Language {
  language?: string;
  fluency?: string;
}

export interface Interest {
  name?: string;
  keywords?: string[];
}

export interface Reference {
  name?: string;
  reference?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface Project {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface Course {
  name?: string;
  institution?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  url?: string;
}

export interface Internship {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  city?: string;
  country?: string;
}

export interface Hobby {
  name?: string;
  description?: string;
}

export interface Activity {
  name?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CustomSection {
  title?: string;
  content?: string;
}

export interface Resume {
  $schema?: string;
  basics?: Basics;
  work?: Work[];
  volunteer?: Volunteer[];
  education?: Education[];
  awards?: Award[];
  certificates?: Certificate[];
  publications?: Publication[];
  skills?: Skill[];
  languages?: Language[];
  interests?: Interest[];
  references?: Reference[];
  projects?: Project[];
  courses?: Course[];
  internships?: Internship[];
  hobbies?: Hobby[];
  activities?: Activity[];
  customSections?: CustomSection[];
}

// Default empty resume
export const defaultResume: Resume = {
  basics: {
    name: "John Doe",
    label: "Software Developer",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    summary: "Experienced software developer with a passion for building scalable applications and solving complex problems.",
    location: {
      city: "San Francisco",
      region: "CA",
      countryCode: "US"
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "johndoe",
        url: "https://linkedin.com/in/johndoe"
      },
      {
        network: "GitHub",
        username: "johndoe",
        url: "https://github.com/johndoe"
      }
    ]
  },
  work: [
    {
      name: "Tech Company Inc.",
      position: "Senior Software Developer",
      startDate: "2021-01",
      endDate: "Present",
      summary: "Leading development of core platform features",
      highlights: [
        "Led a team of 5 developers to deliver a new microservices architecture",
        "Improved application performance by 40% through optimization",
        "Mentored junior developers and conducted code reviews"
      ]
    },
    {
      name: "Startup Labs",
      position: "Full Stack Developer",
      startDate: "2018-06",
      endDate: "2020-12",
      summary: "Built and maintained web applications",
      highlights: [
        "Developed RESTful APIs serving 100k+ daily requests",
        "Implemented CI/CD pipelines reducing deployment time by 60%"
      ]
    }
  ],
  education: [
    {
      institution: "University of Technology",
      area: "Computer Science",
      studyType: "Bachelor of Science",
      startDate: "2014-09",
      endDate: "2018-05",
      score: "3.8 GPA"
    }
  ],
  skills: [
    {
      name: "Frontend",
      keywords: ["React", "TypeScript", "Next.js", "Tailwind CSS"]
    },
    {
      name: "Backend",
      keywords: ["Node.js", "Python", "PostgreSQL", "Redis"]
    },
    {
      name: "DevOps",
      keywords: ["Docker", "AWS", "CI/CD", "Kubernetes"]
    }
  ],
  languages: [
    { language: "English", fluency: "Native" },
    { language: "Spanish", fluency: "Intermediate" }
  ]
};

// Empty resume for starting fresh
export const emptyResume: Resume = {
  basics: {
    name: "",
    label: "",
    email: "",
    phone: "",
    summary: "",
    location: {
      city: "",
      region: "",
    },
    profiles: []
  },
  work: [],
  education: [],
  skills: [],
  languages: []
};

