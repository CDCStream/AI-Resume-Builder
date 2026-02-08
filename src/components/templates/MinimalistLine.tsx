"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function MinimalistLine({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-16 font-['Inter',sans-serif] text-gray-900 shadow-lg print:shadow-none">
      {/* Header - Centered */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-light tracking-wide mb-2">
          {basics?.name?.toUpperCase() || "YOUR NAME"}
        </h1>
        <p className="text-gray-500 text-lg tracking-widest mb-4">
          {basics?.label?.toUpperCase() || "PROFESSIONAL TITLE"}
        </p>
        <div className="w-16 h-px bg-gray-300 mx-auto mb-4"></div>
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>{basics.phone}</span>}
          {basics?.location?.city && (
            <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {basics?.summary && (
        <section className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 leading-relaxed italic">
            "{basics.summary}"
          </p>
        </section>
      )}

      {/* Experience */}
      {work && work.length > 0 && (
        <section className="mb-10">
          <h2 className="text-center text-xs font-medium tracking-[0.3em] text-gray-400 mb-6">
            EXPERIENCE
          </h2>
          <div className="space-y-6">
            {work.map((job, index) => (
              <div key={index} className="text-center">
                <h3 className="font-medium text-gray-900">{job.position}</h3>
                <p className="text-sm text-gray-500 mb-1">{job.name}</p>
                <p className="text-xs text-gray-400 mb-2">
                  {job.startDate} — {job.endDate || "Present"}
                </p>
                {job.highlights && job.highlights.length > 0 && (
                  <div className="text-sm text-gray-600 max-w-xl mx-auto">
                    {job.highlights.map((h, idx) => (
                      <span key={idx}>
                        {h}{idx < job.highlights!.length - 1 && " · "}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-10">
          <h2 className="text-center text-xs font-medium tracking-[0.3em] text-gray-400 mb-6">
            EDUCATION
          </h2>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="text-center">
                <h3 className="font-medium text-gray-900">{edu.institution}</h3>
                <p className="text-sm text-gray-500">{edu.studyType} in {edu.area}</p>
                <p className="text-xs text-gray-400">{edu.startDate} — {edu.endDate}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-10">
          <h2 className="text-center text-xs font-medium tracking-[0.3em] text-gray-400 mb-6">
            SKILLS
          </h2>
          <div className="text-center text-sm text-gray-600">
            {skills.flatMap(s => s.keywords || []).join(" · ")}
          </div>
        </section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <section>
          <h2 className="text-center text-xs font-medium tracking-[0.3em] text-gray-400 mb-6">
            LANGUAGES
          </h2>
          <div className="flex justify-center gap-8">
            {languages.map((lang, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{lang.language}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((dot) => {
                      const fluencyLevels: Record<string, number> = {
                        "Native": 5, "Fluent": 5, "Proficient": 5, "Advanced": 4,
                        "Intermediate": 3, "Basic": 2, "Beginner": 1,
                      };
                      const filled = fluencyLevels[lang.fluency || "Intermediate"] || 3;
                      return (
                        <span
                          key={dot}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: dot <= filled ? "#4B5563" : "#E5E7EB" }}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{lang.fluency}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

