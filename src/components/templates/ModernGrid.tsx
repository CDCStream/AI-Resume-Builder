"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function ModernGrid({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-gray-50 p-8 shadow-lg print:shadow-none">
      {/* Header Card */}
      <header className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {basics?.name?.split(" ").map(n => n[0]).join("") || "JD"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{basics?.name || "Your Name"}</h1>
            <p className="text-indigo-600 font-medium">{basics?.label || "Professional Title"}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {basics?.email && <span>{basics.email}</span>}
              {basics?.phone && <span>{basics.phone}</span>}
              {basics?.location?.city && (
                <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
              )}
            </div>
          </div>
        </div>
        {basics?.summary && (
          <p className="mt-4 text-gray-600 leading-relaxed border-t pt-4">{basics.summary}</p>
        )}
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Experience */}
          {work && work.length > 0 && (
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">💼</span>
                Experience
              </h2>
              <div className="space-y-4">
                {work.map((job, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.position}</h3>
                        <p className="text-sm text-indigo-600">{job.name}</p>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {job.startDate} — {job.endDate || "Present"}
                      </span>
                    </div>
                    {job.highlights && (
                      <ul className="mt-2 space-y-1">
                        {job.highlights.map((h, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="mr-2 text-indigo-400">→</span>{h}
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
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">🎓</span>
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                    <p className="text-sm text-gray-600">{edu.studyType} in {edu.area}</p>
                    <p className="text-xs text-gray-500 mt-1">{edu.startDate} — {edu.endDate}</p>
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
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">⚡</span>
                Skills
              </h2>
              <div className="space-y-3">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-700 mb-1">{skill.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {skill.keywords?.map((kw, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
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
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">🌍</span>
                Languages
              </h2>
              <div className="space-y-3">
                {languages.map((lang, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg">
                    <LanguageDots
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#6366F1"
                      textColor="text-gray-700"
                      subTextColor="text-gray-500"
                      emptyDotColor="#E5E7EB"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

