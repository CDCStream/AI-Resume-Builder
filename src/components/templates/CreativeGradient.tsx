"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { renderSections, useOrderedSections, ThemeConfig } from "./SharedSections";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeGradient({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise, sectionOrder } = resume;

  const theme: ThemeConfig = { headingClass: "text-lg font-bold text-purple-700 mb-3", textClass: "text-sm text-gray-600", subTextClass: "text-xs text-gray-500", accentColor: "#7C3AED", dotFilledClass: "bg-purple-500", dotEmptyClass: "bg-purple-200", tagClass: "text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full" };
const orderedSections = useOrderedSections(resume);


  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg print:shadow-none overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>

      <div className="relative p-10">
        {/* Header */}
        <header className="text-center mb-10">
          {basics?.image && (
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-cyan-400/50">
              <img
                src={basics.image}
                alt={basics.name || "Profile"}
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})`,
                }}
              />
            </div>
          )}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {basics?.name || "Your Name"}
          </h1>
          <p className="text-xl text-cyan-300 mb-4">{basics?.label || "Professional Title"}</p>
          <div className="flex justify-center gap-6 text-sm text-slate-300">
            {basics?.email && <span>{basics.email}</span>}
            {basics?.phone && <span>{basics.phone}</span>}
            {basics?.location?.city && (
              <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
            )}
          </div>
          {(basics?.profiles?.find(p => p.network === "LinkedIn")?.url || basics?.profiles?.find(p => p.network === "GitHub")?.url) && (
            <div className="flex justify-center gap-6 text-sm mt-2">
              {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              )}
              {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
                <span className="flex items-center gap-1 text-slate-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              )}
            </div>
          )}
        </header>

        {renderSections(resume, orderedSections, theme)}
      </div>
    </div>
  );
}
