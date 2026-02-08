"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalWhite({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-12 font-['Inter',sans-serif] text-gray-800 shadow-lg print:shadow-none print:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {basics?.name || "Your Name"}
        </h1>
        <p className="text-lg text-gray-600 mb-3">
          {basics?.label || "Professional Title"}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {basics?.email && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {basics.email}
            </span>
          )}
          {basics?.phone && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {basics.phone}
            </span>
          )}
          {basics?.location?.city && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {basics.location.city}{basics.location.region && `, ${basics.location.region}`}
            </span>
          )}
        </div>
      </header>

      {/* Summary */}
      {basics?.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
            Summary
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {basics.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {work && work.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Experience
          </h2>
          <div className="space-y-4">
            {work.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.position}</h3>
                    <p className="text-sm text-gray-600">{job.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                  </span>
                </div>
                {job.summary && (
                  <p className="text-sm text-gray-600 mt-1">{job.summary}</p>
                )}
                {job.highlights && job.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {job.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2 text-gray-400">•</span>
                        {highlight}
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
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                  <p className="text-sm text-gray-600">
                    {edu.studyType && <span className="font-medium">{edu.studyType}</span>}
                    {edu.studyType && edu.area && " • "}
                    {edu.area}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Skills
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {skills.filter(skill => skill.name).map((skill, index) => {
              const levelMap: Record<string, number> = {
                "Expert": 5,
                "Advanced": 4,
                "Intermediate": 3,
                "Beginner": 2,
                "Basic": 1,
              };
              const filledDots = levelMap[skill.level || "Intermediate"] || 3;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{skill.name}</span>
                    <span className="text-xs text-gray-500">{skill.level || "Intermediate"}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div
                        key={dot}
                        className={`w-2 h-2 rounded-full ${
                          dot <= filledDots ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Languages
          </h2>
          <LanguageGrid
            languages={languages}
            dotColor="#3B82F6"
            textColor="text-gray-900"
            subTextColor="text-gray-500"
            emptyDotColor="#E5E7EB"
            columns={2}
          />
        </section>
      )}
    </div>
  );
}

