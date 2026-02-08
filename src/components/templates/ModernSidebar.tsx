"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function ModernSidebar({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white flex shadow-lg print:shadow-none">
      {/* Sidebar */}
      <aside className="w-1/3 bg-slate-800 text-white p-6 print:bg-slate-800">
        <div className="mb-8">
          {basics?.image ? (
            <img
              src={basics.image}
              alt={basics?.name || "Profile"}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-slate-500"
            />
          ) : (
            <div className="w-24 h-24 bg-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-2 border-slate-500">
              {basics?.name?.split(" ").map(n => n[0]).join("") || "JD"}
            </div>
          )}
          <h1 className="text-xl font-bold text-center">{basics?.name || "Your Name"}</h1>
          <p className="text-slate-300 text-sm text-center mt-1">{basics?.label || "Title"}</p>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-600 pb-2">
            Contact
          </h2>
          <div className="space-y-2 text-sm">
            {basics?.email && <p className="text-slate-300 break-all">{basics.email}</p>}
            {basics?.phone && <p className="text-slate-300">{basics.phone}</p>}
            {basics?.location?.city && (
              <p className="text-slate-300">
                {basics.location.city}{basics.location.region && `, ${basics.location.region}`}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-600 pb-2">
              Skills
            </h2>
            <div className="space-y-2">
              {skills.filter(skill => skill.name).map((skill, index) => {
                const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{skill.name}</span>
                      <span className="text-[10px] text-slate-400">{skill.level || "Intermediate"}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-blue-400" : "bg-slate-600"}`} />
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-600 pb-2">
              Languages
            </h2>
            <div className="space-y-2">
              {languages.map((lang, index) => (
                <LanguageDots
                  key={index}
                  language={lang.language || ""}
                  fluency={lang.fluency}
                  dotColor="#60A5FA"
                  textColor="text-white"
                  subTextColor="text-slate-400"
                  emptyDotColor="#475569"
                />
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Summary */}
        {basics?.summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-slate-800"></span>
              About Me
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{basics.summary}</p>
          </section>
        )}

        {/* Experience */}
        {work && work.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-slate-800"></span>
              Experience
            </h2>
            <div className="space-y-4">
              {work.map((job, index) => (
                <div key={index} className="relative pl-4 border-l-2 border-slate-200">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 bg-slate-800 rounded-full"></div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900">{job.position}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{job.name}</p>
                  {job.highlights && (
                    <ul className="space-y-1">
                      {job.highlights.map((h, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <span className="mr-2 text-slate-400">▸</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-slate-800"></span>
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="relative pl-4 border-l-2 border-slate-200">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 bg-slate-800 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                  <p className="text-sm text-gray-600">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                  <p className="text-xs text-slate-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

