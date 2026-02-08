"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeBold({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-amber-50 shadow-lg print:shadow-none">
      {/* Header */}
      <header className="bg-orange-600 text-white p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-700 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative">
          <h1 className="text-4xl font-black tracking-tight mb-1">
            {basics?.name?.toUpperCase() || "YOUR NAME"}
          </h1>
          <p className="text-orange-200 text-xl font-medium mb-4">{basics?.label || "Professional Title"}</p>
          <div className="flex flex-wrap gap-4 text-sm text-orange-100">
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
          <section className="mb-8 -mt-6 relative z-10">
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-600">
              <p className="text-gray-700 leading-relaxed">{basics.summary}</p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Experience */}
            {work && work.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-orange-600 mb-4">EXPERIENCE</h2>
                <div className="space-y-4">
                  {work.map((job, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{job.position}</h3>
                          <p className="text-orange-600 font-medium">{job.name}</p>
                        </div>
                        <span className="text-sm text-white bg-orange-600 px-3 py-1 rounded-full">
                          {job.startDate} — {job.endDate || "Present"}
                        </span>
                      </div>
                      {job.highlights && (
                        <ul className="mt-3 space-y-1">
                          {job.highlights.map((h, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2 text-orange-500 font-bold">→</span>{h}
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
                <h2 className="text-2xl font-black text-orange-600 mb-4">EDUCATION</h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                      <p className="text-gray-600">{edu.studyType} in {edu.area}</p>
                      <p className="text-sm text-orange-500 mt-1">{edu.startDate} — {edu.endDate}</p>
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
              <section className="bg-orange-600 text-white p-4 rounded-xl">
                <h2 className="text-lg font-black mb-3">SKILLS</h2>
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <p className="text-sm font-bold text-orange-100 mb-1">{skill.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.keywords?.map((kw, idx) => (
                          <span key={idx} className="text-xs bg-white/20 px-2 py-0.5 rounded">
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
              <section className="bg-white p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-black text-orange-600 mb-3">LANGUAGES</h2>
                <div className="space-y-2">
                  {languages.map((lang, index) => (
                    <LanguageDots
                      key={index}
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#F97316"
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

