"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeTimeline({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-gradient-to-br from-violet-50 to-white shadow-lg print:shadow-none overflow-hidden">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-8 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-1">{basics?.name || "Your Name"}</h1>
          <p className="text-violet-200 text-lg mb-4">{basics?.label || "Professional Title"}</p>
          <div className="flex flex-wrap gap-4 text-sm text-violet-100">
            {basics?.email && <span>✉ {basics.email}</span>}
            {basics?.phone && <span>☎ {basics.phone}</span>}
            {basics?.location?.city && (
              <span>📍 {basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Summary */}
        {basics?.summary && (
          <section className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-violet-100">
            <p className="text-gray-600 leading-relaxed">{basics.summary}</p>
          </section>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main content - 2 columns */}
          <div className="col-span-2 space-y-8">
            {/* Experience Timeline */}
            {work && work.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-violet-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm">💼</span>
                  Experience
                </h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-violet-200"></div>
                  <div className="space-y-6">
                    {work.map((job, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-2 top-1 w-4 h-4 bg-violet-500 rounded-full border-2 border-white shadow"></div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-violet-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{job.position}</h3>
                              <p className="text-sm text-violet-600">{job.name}</p>
                            </div>
                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                              {job.startDate} — {job.endDate || "Present"}
                            </span>
                          </div>
                          {job.highlights && (
                            <ul className="space-y-1 mt-2">
                              {job.highlights.map((h, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start">
                                  <span className="mr-2 text-violet-400">→</span>{h}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-violet-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm">🎓</span>
                  Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-violet-100">
                      <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                      <p className="text-sm text-gray-600">{edu.studyType} in {edu.area}</p>
                      <p className="text-xs text-violet-500 mt-1">{edu.startDate} — {edu.endDate}</p>
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
              <section className="bg-white rounded-lg p-4 shadow-sm border border-violet-100">
                <h2 className="text-sm font-bold text-violet-800 mb-3 flex items-center gap-2">
                  <span>⚡</span> Skills
                </h2>
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <p className="text-xs font-medium text-gray-700 mb-1">{skill.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.keywords?.map((kw, idx) => (
                          <span key={idx} className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded">
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
              <section className="bg-white rounded-lg p-4 shadow-sm border border-violet-100">
                <h2 className="text-sm font-bold text-violet-800 mb-3 flex items-center gap-2">
                  <span>🌍</span> Languages
                </h2>
                <div className="space-y-2">
                  {languages.map((lang, index) => (
                    <LanguageDots
                      key={index}
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#8B5CF6"
                      textColor="text-gray-700"
                      subTextColor="text-violet-500"
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

