"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalTeal({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none">
      {/* Teal Header */}
      <header className="bg-teal-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-1">{basics?.name || "Your Name"}</h1>
        <p className="text-teal-100 text-lg mb-4">{basics?.label || "Professional Title"}</p>
        <div className="flex flex-wrap gap-4 text-sm text-teal-50">
          {basics?.email && <span>✉ {basics.email}</span>}
          {basics?.phone && <span>☎ {basics.phone}</span>}
          {basics?.location?.city && (
            <span>📍 {basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Summary */}
        {basics?.summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-teal-600 border-b-2 border-teal-600 pb-1 mb-3">
              Professional Summary
            </h2>
            <p className="text-gray-600 leading-relaxed">{basics.summary}</p>
          </section>
        )}

        {/* Experience */}
        {work && work.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-teal-600 border-b-2 border-teal-600 pb-1 mb-3">
              Work Experience
            </h2>
            <div className="space-y-4">
              {work.map((job, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.position}</h3>
                      <p className="text-teal-600">{job.name}</p>
                    </div>
                    <span className="text-sm text-gray-500 bg-teal-50 px-2 py-1 rounded">
                      {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                    </span>
                  </div>
                  {job.highlights && (
                    <ul className="mt-2 space-y-1">
                      {job.highlights.map((h, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2 text-teal-500">▸</span>{h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {education && education.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-teal-600 border-b-2 border-teal-600 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                    <p className="text-sm text-gray-600">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                    <p className="text-xs text-gray-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-teal-600 border-b-2 border-teal-600 pb-1 mb-3">
                Skills
              </h2>
              <div className="space-y-2">
                {skills.filter(skill => skill.name).map((skill, index) => {
                  const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                  const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{skill.name}</span>
                        <span className="text-xs text-gray-400">{skill.level || "Intermediate"}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <div key={dot} className={`w-2 h-2 rounded-full ${dot <= filledDots ? "bg-teal-500" : "bg-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Languages */}
        {languages && languages.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-teal-600 border-b-2 border-teal-600 pb-1 mb-3">
              Languages
            </h2>
            <LanguageGrid
              languages={languages}
              dotColor="#0D9488"
              textColor="text-gray-700"
              subTextColor="text-gray-500"
              emptyDotColor="#E5E7EB"
              columns={2}
            />
          </section>
        )}
      </div>
    </div>
  );
}

