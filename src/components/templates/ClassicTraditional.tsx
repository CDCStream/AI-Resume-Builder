"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { renderSections, useOrderedSections, ThemeConfig } from "./SharedSections";

interface TemplateProps {
  resume: Resume;
}

export default function ClassicTraditional({ resume }: TemplateProps) {
  const { basics } = resume;
  const theme: ThemeConfig = { headingClass: "text-lg font-serif font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-800", textClass: "text-sm text-gray-700", subTextClass: "text-xs text-gray-500", accentColor: "#1F2937", dotFilledClass: "bg-gray-800", dotEmptyClass: "bg-gray-300", tagClass: "text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded" };
  const orderedSections = useOrderedSections(resume);

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-12 shadow-lg print:shadow-none font-serif">
      <header className="text-center mb-8 pb-6 border-b-2 border-gray-900">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-wide">{basics?.name || "Your Name"}</h1>
        <p className="text-lg text-gray-600 mb-3">{basics?.label || "Professional Title"}</p>
        <div className="flex justify-center flex-wrap gap-6 text-sm text-gray-500">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>{basics.phone}</span>}
          {basics?.location?.city && <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>}
        </div>
      </header>

      {renderSections(resume, orderedSections, theme)}
    </div>
  );
}
