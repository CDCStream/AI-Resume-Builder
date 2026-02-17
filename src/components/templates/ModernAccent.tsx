"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { renderSections, useOrderedSections, ThemeConfig } from "./SharedSections";

interface TemplateProps {
  resume: Resume;
}

export default function ModernAccent({ resume }: TemplateProps) {
  const { basics } = resume;
  const theme: ThemeConfig = { headingClass: "text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3", textClass: "text-sm text-gray-600", subTextClass: "text-xs text-gray-500", accentColor: "#059669", dotFilledClass: "bg-emerald-500", dotEmptyClass: "bg-emerald-200", tagClass: "text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full" };
  const orderedSections = useOrderedSections(resume);

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none">
      <header className="p-10 border-b-4 border-emerald-500">
        <div className="flex items-start gap-6">
          {basics?.image && (
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-200">
              <img src={basics.image} alt={basics.name || "Profile"} className="w-full h-full object-cover"
                style={{ transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})` }} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{basics?.name || "Your Name"}</h1>
            <p className="text-lg text-emerald-600 font-medium mb-3">{basics?.label || "Professional Title"}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {basics?.email && <span>✉ {basics.email}</span>}
              {basics?.phone && <span>☎ {basics.phone}</span>}
              {basics?.location?.city && <span>📍 {basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="p-10">
        {renderSections(resume, orderedSections, theme)}
      </div>
    </div>
  );
}
