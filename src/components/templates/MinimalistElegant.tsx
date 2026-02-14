"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function MinimalistElegant({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise, signature } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-12 shadow-lg print:shadow-none font-['Georgia',serif]">
      {/* Header */}
      <header className="text-center mb-10 pb-6 border-b border-gray-200">
        {basics?.image && (
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-200">
            <img
              src={basics.image}
              alt={basics.name || "Profile"}
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})`,
              }}
            />
          </div>
        )}
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
        {(basics?.profiles?.find(p => p.network === "LinkedIn")?.url || basics?.profiles?.find(p => p.network === "GitHub")?.url) && (
          <div className="flex justify-center gap-8 text-sm mt-2">
            {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
              <span className="flex items-center gap-1 text-blue-700">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            )}
            {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            )}
          </div>
        )}
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
                <p className="text-gray-500 italic">{job.name}{(job.city || job.country) && <span> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}</p>
                <p className="text-sm text-gray-400 mb-2">{formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}</p>
                {job.summary && (
                  <p className="text-sm text-gray-600 mb-2 italic">{job.summary}</p>
                )}
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

      {/* Internships */}
      {internships && internships.length > 0 && (
        <section className="mb-8">
          <h2 className="text-center text-sm tracking-[0.3em] text-gray-400 uppercase mb-6">
            Internships
          </h2>
          <div className="space-y-6">
            {internships.map((intern, index) => (
              <div key={index} className="text-center">
                <h3 className="font-semibold text-gray-800 text-lg">{intern.position}</h3>
                <p className="text-gray-500 italic">{intern.company}{(intern.city || intern.country) && <span> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}</p>
                <p className="text-sm text-gray-400 mb-2">{formatDate(intern.startDate)} — {formatDate(intern.endDate) || "Present"}</p>
                {intern.summary && (
                  <p className="text-sm text-gray-600 italic">{intern.summary}</p>
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
                <p className="text-gray-500 italic">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                <p className="text-sm text-gray-400">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <section className="mb-8">
          <h2 className="text-center text-sm tracking-[0.3em] text-gray-400 uppercase mb-6">
            Honors & Awards
          </h2>
          <div className="space-y-6 text-center max-w-lg mx-auto">
            {awards.map((award, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-800 uppercase tracking-widest">{award.title}</h3>
                <div className="flex justify-center gap-2 text-sm text-gray-400 italic mb-1">
                  {award.awarder && <span>{award.awarder}</span>}
                  {award.awarder && award.date && <span>•</span>}
                  {award.date && <span>{formatDate(award.date)}</span>}
                </div>
                {award.summary && (
                  <p className="text-sm text-gray-600 italic leading-relaxed">{award.summary}</p>
                )}
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
            <div className="space-y-2 max-w-sm mx-auto">
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
                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-gray-700" : "bg-gray-200"}`} />
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

        {/* Courses */}
        {courses && courses.length > 0 && (
          <section className="text-center mb-6">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Courses</h2>
            <div className="space-y-2 max-w-md mx-auto">
              {courses.map((course, index) => (
                <div key={index}>
                  <p className="font-medium text-gray-700">{course.name}</p>
                  {course.institution && <p className="text-sm text-gray-500 italic">{course.institution}</p>}
                  {(course.startDate || course.endDate) && (
                    <p className="text-xs text-gray-400">{formatDate(course.startDate)} — {formatDate(course.endDate)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hobbies */}
        {hobbies && hobbies.length > 0 && hobbies.some(h => h.name) && (
          <section className="mb-8 text-center">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Hobbies & Interests</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {hobbies.filter(h => h.name).map((hobby, index) => (
                <span key={index} className="text-sm text-gray-600 italic">{hobby.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {references && references.length > 0 && references.some(r => r.name) && (
          <section className="mb-8 text-center">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">References</h2>
            <div className="space-y-4">
              {references.filter(r => r.name).map((ref, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-800">{ref.name}</h3>
                  {(ref.role || ref.company) && (
                    <p className="text-sm text-gray-600 italic max-w-xl mx-auto">
                      {[ref.role, ref.company].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p className="text-xs text-gray-500 italic mt-1 max-w-xl mx-auto">
                      {[ref.email, ref.phone].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {ref.reference && <p className="text-sm text-gray-600 italic mt-1 max-w-xl mx-auto">{ref.reference}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Publications */}
        {publications && publications.length > 0 && publications.some(p => p.name) && (
          <section className="text-center mb-6">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Publications</h2>
            <div className="space-y-3">
              {publications.filter(p => p.name).map((pub, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{pub.name}</h3>
                  {pub.publisher && <p className="text-sm text-gray-600 italic">{pub.publisher}</p>}
                  {pub.releaseDate && <p className="text-xs text-gray-500 mt-1">{formatDate(pub.releaseDate)}</p>}
                  {pub.summary && <p className="text-sm text-gray-600 italic mt-1 max-w-xl mx-auto">{pub.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && projects.some(p => p.name) && (
          <section className="text-center mb-6">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Projects</h2>
            <div className="space-y-3">
              {projects.filter(p => p.name).map((project, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {(project.startDate || project.endDate) && <p className="text-xs text-gray-500 mt-1">{formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}</p>}
                  {project.description && <p className="text-sm text-gray-600 italic mt-1 max-w-xl mx-auto">{project.description}</p>}
                  {project.url && <a href={project.url} className="text-xs text-blue-400 mt-1 block">{project.url}</a>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certificates && certificates.length > 0 && certificates.some(c => c.name) && (
          <section className="text-center mb-6">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Certifications</h2>
            <div className="space-y-3">
              {certificates.filter(c => c.name).map((cert, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  {cert.issuer && <p className="text-sm text-gray-600 italic">{cert.issuer}</p>}
                  {(cert.date || cert.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(cert.date)}{cert.endDate ? ` — ${formatDate(cert.endDate)}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Volunteering */}
        {volunteer && volunteer.length > 0 && volunteer.some(v => v.organization) && (
          <section className="text-center mb-6">
            <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Volunteering</h2>
            <div className="space-y-3">
              {volunteer.filter(v => v.organization).map((vol, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{vol.organization}</h3>
                  {vol.position && <p className="text-sm text-gray-600 italic">{vol.position}</p>}
                  {(vol.startDate || vol.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {[vol.startDate, vol.endDate].filter(Boolean).join(" - ")}
                    </p>
                  )}
                  {vol.summary && <p className="text-sm text-gray-600 italic mt-1 max-w-xl mx-auto">{vol.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {strengths && strengths.length > 0 && strengths.some(s => s.name) && (<section className="text-center mb-6"><h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Strengths</h2><div className="space-y-3">{strengths.filter(s => s.name).map((s, i) => (<div key={i}><h3 className="font-semibold text-gray-900">{s.name}</h3>{s.description && <p className="text-sm text-gray-600 italic mt-1 max-w-xl mx-auto">{s.description}</p>}</div>))}</div></section>)}
        {industryExpertise && industryExpertise.length > 0 && industryExpertise.some(e => e.name) && (<section className="text-center mb-6"><h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Industry Expertise</h2><div className="max-w-md mx-auto space-y-2">{industryExpertise.filter(e => e.name).map((e, i) => (<div key={i}><div className="flex justify-between text-sm"><span className="font-medium text-gray-900">{e.name}</span><span className="text-gray-400">{e.level}</span></div><div className="w-full bg-gray-100 rounded-full h-1 mt-1"><div className="bg-gray-700 h-1 rounded-full" style={{ width: e.level === 'Expert' ? '100%' : e.level === 'Advanced' ? '75%' : e.level === 'Intermediate' ? '50%' : '25%' }}></div></div></div>))}</div></section>)}
        {philosophy && philosophy.quote && (<section className="text-center mb-6"><h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">My Life Philosophy</h2><blockquote className="italic text-gray-600 max-w-xl mx-auto">&ldquo;{philosophy.quote}&rdquo;</blockquote>{philosophy.author && <p className="text-sm text-gray-500 mt-2">— {philosophy.author}</p>}</section>)}
        {books && books.length > 0 && books.some(b => b.title) && (<section className="text-center mb-6"><h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Books</h2><div className="space-y-2">{books.filter(b => b.title).map((b, i) => (<div key={i}><h3 className="font-semibold text-gray-900">{b.title}</h3>{b.author && <p className="text-sm text-gray-600 italic">{b.author}</p>}</div>))}</div></section>)}
        {socialLinks && socialLinks.length > 0 && socialLinks.some(l => l.network) && (<section className="text-center mb-6"><h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Find Me Online</h2><div className="flex flex-wrap justify-center gap-4">{socialLinks.filter(l => l.network).map((l, i) => (<div key={i}><span className="font-semibold text-gray-900 text-sm">{l.network}</span>{l.username && <span className="text-sm text-gray-500 ml-1">{l.username}</span>}</div>))}</div></section>)}
        {signature && (<section className="text-center mb-6 pt-4"><p className="text-2xl italic text-gray-700" style={{ fontFamily: 'cursive' }}>{signature}</p></section>)}

        {/* Custom Sections */}
        {customSections && customSections.length > 0 && customSections.map((section, index) => (
          section.title && (
            <section key={index} className="text-center mb-6">
              <h2 className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">{section.title}</h2>
              {section.content && (
                <p className="text-gray-600 leading-relaxed italic max-w-2xl mx-auto whitespace-pre-line">{section.content}</p>
              )}
            </section>
          )
        ))}
      </div>
    </div>
  );
}

