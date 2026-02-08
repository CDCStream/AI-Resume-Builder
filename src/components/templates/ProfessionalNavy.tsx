"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalNavy({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none flex">
      {/* Navy Sidebar */}
      <aside className="w-72 bg-navy-900 bg-[#1e3a5f] text-white p-6">
        <div className="mb-8 text-center">
          {basics?.image ? (
            <img
              src={basics.image}
              alt={basics?.name || "Profile"}
              className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-white/30"
            />
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
          </div>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 pb-1 border-b border-blue-400/30">
              Core Skills
            </h2>
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-white mb-1">{skill.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {skill.keywords?.map((kw, idx) => (
                      <span key={idx} className="text-xs bg-white/10 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
        {/* Summary */}
        {basics?.summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">About Me</h2>
            <p className="text-gray-600 leading-relaxed">{basics.summary}</p>
          </section>
        )}

        {/* Experience */}
        {work && work.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Professional Experience</h2>
            <div className="space-y-5">
              {work.map((job, index) => (
                <div key={index} className="border-l-3 border-[#1e3a5f] pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.position}</h3>
                      <p className="text-[#1e3a5f]">{job.name}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {job.startDate} — {job.endDate || "Present"}
                    </span>
                  </div>
                  {job.highlights && (
                    <ul className="mt-2 space-y-1">
                      {job.highlights.map((h, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2 text-[#1e3a5f]">•</span>{h}
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
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Education</h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="border-l-3 border-[#1e3a5f] pl-4">
                  <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                  <p className="text-sm text-gray-600">{edu.studyType} in {edu.area}</p>
                  <p className="text-xs text-gray-500">{edu.startDate} — {edu.endDate}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

