"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function MinimalistElegant({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-12 shadow-lg print:shadow-none font-['Georgia',serif]">
      {/* Header */}
      <header className="text-center mb-10 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-normal text-gray-800 tracking-wide mb-2">
          {basics?.name || "Your Name"}
        </h1>
        <p className="text-gray-500 text-lg italic mb-4">{basics?.label || "Professional Title"}</p>
        <div className="flex justify-center gap-8 text-sm text-gray-500">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>{basics.phone}</span>}
          {basics?.location?.city && (
            <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {basics?.summary && (
        <section className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-gray-600 leading-loose italic">"{basics.summary}"</p>
        </section>
      )}

      {/* Experience */}
      {work && work.length > 0 && (
        <section className="mb-8">
          <h2 className="text-center text-sm tracking-[0.3em] text-gray-400 uppercase mb-6">
            Experience
          </h2>
          <div className="space-y-6">
            {work.map((job, index) => (
              <div key={index} className="text-center">
                <h3 className="font-semibold text-gray-800 text-lg">{job.position}</h3>
                <p className="text-gray-500 italic">{job.name}</p>
                <p className="text-sm text-gray-400 mb-2">{job.startDate} — {job.endDate || "Present"}</p>
                {job.highlights && (
                  <div className="text-sm text-gray-600 max-w-lg mx-auto">
                    {job.highlights.map((h, idx) => (
                      <p key={idx} className="mb-1">{h}</p>
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
        <section className="mb-8">
          <h2 className="text-center text-sm tracking-[0.3em] text-gray-400 uppercase mb-6">
            Education
          </h2>
          <div className="space-y-4 text-center">
            {education.map((edu, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-800">{edu.institution}</h3>
                <p className="text-gray-500 italic">{edu.studyType} in {edu.area}</p>
                <p className="text-sm text-gray-400">{edu.startDate} — {edu.endDate}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills & Languages in two columns */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-200">
        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="text-center">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Skills</h2>
            <div className="text-sm text-gray-600">
              {skills.flatMap(s => s.keywords || []).join(" · ")}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <section className="text-center">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Languages</h2>
            <div className="space-y-2 max-w-xs mx-auto">
              {languages.map((lang, index) => (
                <LanguageDots
                  key={index}
                  language={lang.language || ""}
                  fluency={lang.fluency}
                  dotColor="#1F2937"
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

