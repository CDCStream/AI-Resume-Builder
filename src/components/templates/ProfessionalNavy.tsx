"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { renderSections, useOrderedSections, ThemeConfig } from "./SharedSections";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalNavy({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise, sectionOrder } = resume;

  const theme: ThemeConfig = { headingClass: "text-sm font-semibold text-blue-900 uppercase tracking-wider mb-3", textClass: "text-sm text-gray-600", subTextClass: "text-xs text-gray-500", accentColor: "#1E3A5F", dotFilledClass: "bg-blue-900", dotEmptyClass: "bg-blue-200", tagClass: "text-sm text-blue-800 bg-blue-50 px-3 py-1 rounded" };
const orderedSections = useOrderedSections(resume);


  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none flex">
      {/* Navy Sidebar */}
      <aside className="w-72 bg-navy-900 bg-[#1e3a5f] text-white p-6">
        <div className="mb-8 text-center">
          {basics?.image ? (
            <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white/30">
              <img
                src={basics.image}
                alt={basics?.name || "Profile"}
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})`,
                }}
              />
            </div>
          ) : (
            <div className="w-28 h-28 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
              {basics?.name?.split(" ").map(n => n[0]).join("") || "JD"}
            </div>
          )}
          <h1 className="text-xl font-bold">{basics?.name || "Your Name"}</h1>
          <p className="text-blue-200 text-sm mt-1">{basics?.label || "Title"}</p>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 pb-1 border-b border-blue-400/30">
            Contact
          </h2>
          <div className="space-y-2 text-sm text-blue-100">
            {basics?.email && <p className="break-all">{basics.email}</p>}
            {basics?.phone && <p>{basics.phone}</p>}
            {basics?.location?.city && (
              <p>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</p>
            )}
            {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
              <p className="text-blue-300 flex items-center gap-1.5 break-all">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </p>
            )}
            {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
              <p className="text-blue-100 flex items-center gap-1.5 break-all">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 pb-1 border-b border-blue-400/30">
              Core Skills
            </h2>
            <div className="space-y-2">
              {skills.filter(skill => skill.name).map((skill, index) => {
                const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{skill.name}</span>
                      <span className="text-[10px] text-blue-200">{skill.level || "Intermediate"}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-blue-300" : "bg-white/20"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 pb-1 border-b border-blue-400/30">
              Languages
            </h2>
            <div className="space-y-2">
              {languages.map((lang, index) => (
                <LanguageDots
                  key={index}
                  language={lang.language || ""}
                  fluency={lang.fluency}
                  dotColor="#93C5FD"
                  textColor="text-white"
                  subTextColor="text-blue-200"
                  emptyDotColor="#1E3A5F"
                />
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {renderSections(resume, orderedSections, theme)}
      </main>
    </div>
  );
}
