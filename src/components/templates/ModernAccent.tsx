"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function ModernAccent({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none">
      {/* Top Accent Bar */}
      <div className="h-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500"></div>

      <div className="p-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{basics?.name || "Your Name"}</h1>
          <p className="text-xl text-rose-500 font-medium mb-4">{basics?.label || "Professional Title"}</p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            {basics?.email && (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">✉</span>
                {basics.email}
              </span>
            )}
            {basics?.phone && (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">☎</span>
                {basics.phone}
              </span>
            )}
            {basics?.location?.city && (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">📍</span>
                {basics.location.city}{basics.location.region && `, ${basics.location.region}`}
              </span>
            )}
          </div>
        </header>

        {/* Summary */}
        {basics?.summary && (
          <section className="mb-8 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg border-l-4 border-rose-500">
            <p className="text-gray-700 leading-relaxed">{basics.summary}</p>
          </section>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Experience */}
            {work && work.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-rose-200">
                  <span className="text-rose-500">●</span> Experience
                </h2>
                <div className="space-y-5">
                  {work.map((job, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900">{job.position}</h3>
                          <p className="text-rose-500">{job.name}</p>
                        </div>
                        <span className="text-sm text-gray-500">{job.startDate} — {job.endDate || "Present"}</span>
                      </div>
                      {job.highlights && (
                        <ul className="mt-2 space-y-1">
                          {job.highlights.map((h, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2 text-rose-400">▪</span>{h}
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
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-rose-200">
                  <span className="text-rose-500">●</span> Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                      <p className="text-sm text-gray-600">{edu.studyType} in {edu.area}</p>
                      <p className="text-xs text-gray-500">{edu.startDate} — {edu.endDate}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {skills && skills.length > 0 && (
              <section className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-sm font-bold text-gray-900 mb-3 pb-1 border-b border-rose-200">
                  <span className="text-rose-500">●</span> Skills
                </h2>
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <p className="text-xs font-semibold text-gray-700 mb-1">{skill.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.keywords?.map((kw, idx) => (
                          <span key={idx} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded border">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <section className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-sm font-bold text-gray-900 mb-3 pb-1 border-b border-rose-200">
                  <span className="text-rose-500">●</span> Languages
                </h2>
                <div className="space-y-2">
                  {languages.map((lang, index) => (
                    <LanguageDots
                      key={index}
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#E11D48"
                      textColor="text-gray-700"
                      subTextColor="text-gray-500"
                      emptyDotColor="#E5E7EB"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

