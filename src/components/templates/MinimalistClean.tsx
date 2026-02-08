"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function MinimalistClean({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-14 shadow-lg print:shadow-none">
      {/* Header - Left aligned, minimal */}
      <header className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 mb-1">
          {basics?.name || "Your Name"}
        </h1>
        <p className="text-gray-400 text-lg mb-4">{basics?.label || "Professional Title"}</p>
        <div className="flex gap-6 text-sm text-gray-500">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>{basics.phone}</span>}
          {basics?.location?.city && (
            <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {basics?.summary && (
        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">{basics.summary}</p>
        </section>
      )}

      {/* Experience */}
      {work && work.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">
            Experience
          </h2>
          <div className="space-y-5">
            {work.map((job, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <div className="text-sm text-gray-400">
                  {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                </div>
                <div className="col-span-3">
                  <h3 className="font-medium text-gray-900">{job.position}</h3>
                  <p className="text-gray-500 text-sm mb-2">{job.name}</p>
                  {job.highlights && (
                    <ul className="space-y-1">
                      {job.highlights.map((h, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <div className="text-sm text-gray-400">
                  {formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}
                </div>
                <div className="col-span-3">
                  <h3 className="font-medium text-gray-900">{edu.institution}</h3>
                  <p className="text-sm text-gray-500">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills & Languages */}
      <div className="grid grid-cols-2 gap-8">
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-100">
              Skills
            </h2>
            <div className="space-y-2">
              {skills.filter(skill => skill.name).map((skill, index) => {
                const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{skill.name}</span>
                      <span className="text-xs text-gray-400">{skill.level || "Intermediate"}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-gray-500" : "bg-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-100">
              Languages
            </h2>
            <div className="space-y-2">
              {languages.map((lang, index) => (
                <LanguageDots
                  key={index}
                  language={lang.language || ""}
                  fluency={lang.fluency}
                  dotColor="#6B7280"
                  textColor="text-gray-600"
                  subTextColor="text-gray-400"
                  emptyDotColor="#E5E7EB"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

