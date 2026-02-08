import ProfessionalWhite from "./ProfessionalWhite";
import ProfessionalTeal from "./ProfessionalTeal";
import ProfessionalNavy from "./ProfessionalNavy";
import ModernSidebar from "./ModernSidebar";
import ModernGrid from "./ModernGrid";
import ModernAccent from "./ModernAccent";
import CreativeTimeline from "./CreativeTimeline";
import CreativeGradient from "./CreativeGradient";
import CreativeBold from "./CreativeBold";
import MinimalistLine from "./MinimalistLine";
import MinimalistElegant from "./MinimalistElegant";
import MinimalistClean from "./MinimalistClean";
import ExecutiveDark from "./ExecutiveDark";
import ClassicTraditional from "./ClassicTraditional";

export type TemplateCategory = "Professional" | "Modern" | "Creative" | "Minimalist" | "Executive" | "Classic";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  component: React.ComponentType<{ resume: any }>;
  description: string;
  color: string;
}

export const templates: Template[] = [
  // Professional Templates
  {
    id: "professional-white",
    name: "Professional White",
    category: "Professional",
    component: ProfessionalWhite,
    description: "Clean and minimal",
    color: "#ffffff",
  },
  {
    id: "professional-teal",
    name: "Professional Teal",
    category: "Professional",
    component: ProfessionalTeal,
    description: "Teal header accent",
    color: "#0d9488",
  },
  {
    id: "professional-navy",
    name: "Professional Navy",
    category: "Professional",
    component: ProfessionalNavy,
    description: "Navy sidebar layout",
    color: "#1e3a5f",
  },

  // Modern Templates
  {
    id: "modern-sidebar",
    name: "Modern Sidebar",
    category: "Modern",
    component: ModernSidebar,
    description: "Two-column dark sidebar",
    color: "#334155",
  },
  {
    id: "modern-grid",
    name: "Modern Grid",
    category: "Modern",
    component: ModernGrid,
    description: "Card-based grid layout",
    color: "#6366f1",
  },
  {
    id: "modern-accent",
    name: "Modern Accent",
    category: "Modern",
    component: ModernAccent,
    description: "Rose gradient accent",
    color: "#f43f5e",
  },

  // Creative Templates
  {
    id: "creative-timeline",
    name: "Creative Timeline",
    category: "Creative",
    component: CreativeTimeline,
    description: "Purple timeline design",
    color: "#7c3aed",
  },
  {
    id: "creative-gradient",
    name: "Creative Gradient",
    category: "Creative",
    component: CreativeGradient,
    description: "Dark gradient glassmorphism",
    color: "#0f172a",
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    category: "Creative",
    component: CreativeBold,
    description: "Bold orange design",
    color: "#ea580c",
  },

  // Minimalist Templates
  {
    id: "minimalist-line",
    name: "Minimalist Line",
    category: "Minimalist",
    component: MinimalistLine,
    description: "Ultra-clean centered",
    color: "#e5e7eb",
  },
  {
    id: "minimalist-elegant",
    name: "Minimalist Elegant",
    category: "Minimalist",
    component: MinimalistElegant,
    description: "Elegant serif typography",
    color: "#d1d5db",
  },
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    category: "Minimalist",
    component: MinimalistClean,
    description: "Grid-based clean layout",
    color: "#f3f4f6",
  },

  // Executive Templates
  {
    id: "executive-dark",
    name: "Executive Dark",
    category: "Executive",
    component: ExecutiveDark,
    description: "Dark luxury with gold",
    color: "#18181b",
  },

  // Classic Templates
  {
    id: "classic-traditional",
    name: "Classic Traditional",
    category: "Classic",
    component: ClassicTraditional,
    description: "Traditional ATS-friendly",
    color: "#374151",
  },
];

export const templatesByCategory = templates.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<TemplateCategory, Template[]>);

export const categories: { name: TemplateCategory; description: string }[] = [
  { name: "Professional", description: "Corporate & Business" },
  { name: "Modern", description: "Contemporary Designs" },
  { name: "Creative", description: "Artistic & Unique" },
  { name: "Minimalist", description: "Clean & Simple" },
  { name: "Executive", description: "Senior Level" },
  { name: "Classic", description: "Traditional Format" },
];

export {
  ProfessionalWhite,
  ProfessionalTeal,
  ProfessionalNavy,
  ModernSidebar,
  ModernGrid,
  ModernAccent,
  CreativeTimeline,
  CreativeGradient,
  CreativeBold,
  MinimalistLine,
  MinimalistElegant,
  MinimalistClean,
  ExecutiveDark,
  ClassicTraditional,
};
