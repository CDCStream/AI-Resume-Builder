"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalNavy({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise, signature } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none flex">
      {/* Navy Sidebar */}
      <aside className="w-72 bg-navy-900 bg-[#1e3a5f] text-white p-6">
        <div className="mb-8 text-center">
          {basics?.image ? (
            <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white/30">
              <img
                src={basics.image}
                alt={basics?.name || "Profile"}
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})`,
                }}
              />
            </div>
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
            {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
              <p className="text-blue-300 flex items-center gap-1.5 break-all">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </p>
            )}
            {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
              <p className="text-blue-100 flex items-center gap-1.5 break-all">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 pb-1 border-b border-blue-400/30">
              Core Skills
            </h2>
            <div className="space-y-2">
              {skills.filter(skill => skill.name).map((skill, index) => {
                const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{skill.name}</span>
                      <span className="text-[10px] text-blue-200">{skill.level || "Intermediate"}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-blue-300" : "bg-white/20"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
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
                      <p className="text-[#1e3a5f]">{job.name}{(job.city || job.country) && <span className="text-gray-500"> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                    </span>
                  </div>
                  {job.summary && (
                    <p className="text-sm text-gray-600 mt-1">{job.summary}</p>
                  )}
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

        {/* Internships */}
        {internships && internships.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Internships</h2>
            <div className="space-y-4">
              {internships.map((intern, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{intern.position}</h3>
                      <p className="text-[#1e3a5f]">{intern.company}{(intern.city || intern.country) && <span className="text-gray-500"> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(intern.startDate)} — {formatDate(intern.endDate) || "Present"}
                    </span>
                  </div>
                  {intern.summary && (
                    <p className="text-sm text-gray-600 mt-1">{intern.summary}</p>
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
                  <p className="text-sm text-gray-600">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                  <p className="text-xs text-gray-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Honors & Awards</h2>
            <div className="space-y-4">
              {awards.map((award, index) => (
                <div key={index} className="border-l-3 border-amber-500 pl-4 bg-amber-50/30 p-3 rounded-r-lg">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900">{award.title}</h3>
                    {award.date && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                        {formatDate(award.date)}
                      </span>
                    )}
                  </div>
                  {award.awarder && <p className="text-sm text-[#1e3a5f] font-medium mb-1">{award.awarder}</p>}
                  {award.summary && <p className="text-sm text-gray-600 italic">{award.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        {courses && courses.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Courses</h2>
            <div className="space-y-2">
              {courses.map((course, index) => (
                <div key={index} className="border-l-3 border-[#1e3a5f] pl-4">
                  <h3 className="font-semibold text-gray-900">{course.name}</h3>
                  {course.institution && <p className="text-sm text-gray-600">{course.institution}</p>}
                  {(course.startDate || course.endDate) && (
                    <p className="text-xs text-gray-500">{formatDate(course.startDate)} — {formatDate(course.endDate)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hobbies */}
        {hobbies && hobbies.length > 0 && hobbies.some(h => h.name) && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Hobbies & Interests</h2>
            <div className="flex flex-wrap gap-2">
              {hobbies.filter(h => h.name).map((hobby, index) => (
                <span key={index} className="text-sm bg-blue-50 text-[#1e3a5f] px-3 py-1 rounded-full">{hobby.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {references && references.length > 0 && references.some(r => r.name) && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">References</h2>
            <div className="space-y-3">
              {references.filter(r => r.name).map((ref, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                  {(ref.role || ref.company) && (
                    <p className="text-sm text-gray-600">
                      {[ref.role, ref.company].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {[ref.email, ref.phone].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {ref.reference && <p className="text-sm text-gray-600 mt-1">{ref.reference}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Publications */}
        {publications && publications.length > 0 && publications.some(p => p.name) && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Publications</h2>
            <div className="space-y-3">
              {publications.filter(p => p.name).map((pub, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{pub.name}</h3>
                  {pub.publisher && <p className="text-sm text-gray-600">{pub.publisher}</p>}
                  {pub.releaseDate && <p className="text-xs text-gray-500 mt-1">{formatDate(pub.releaseDate)}</p>}
                  {pub.summary && <p className="text-gray-600 leading-relaxed mt-1">{pub.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && projects.some(p => p.name) && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Projects</h2>
            <div className="space-y-3">
              {projects.filter(p => p.name).map((project, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {(project.startDate || project.endDate) && <p className="text-xs text-gray-500 mt-1">{formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}</p>}
                  {project.description && <p className="text-gray-600 leading-relaxed mt-1">{project.description}</p>}
                  {project.url && <a href={project.url} className="text-xs text-blue-500 mt-1 block">{project.url}</a>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certificates && certificates.length > 0 && certificates.some(c => c.name) && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Certifications</h2>
            <div className="space-y-3">
              {certificates.filter(c => c.name).map((cert, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
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
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Volunteering</h2>
            <div className="space-y-3">
              {volunteer.filter(v => v.organization).map((vol, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{vol.organization}</h3>
                  {vol.position && <p className="text-sm text-gray-600">{vol.position}</p>}
                  {(vol.startDate || vol.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {[vol.startDate, vol.endDate].filter(Boolean).join(" - ")}
                    </p>
                  )}
                  {vol.summary && <p className="text-gray-600 leading-relaxed mt-1">{vol.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {strengths && strengths.length > 0 && strengths.some(s => s.name) && (<section className="mb-6"><h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Strengths</h2><div className="space-y-3">{strengths.filter(s => s.name).map((s, i) => (<div key={i}><h3 className="font-semibold text-gray-900">{s.name}</h3>{s.description && <p className="text-gray-600 leading-relaxed mt-1">{s.description}</p>}</div>))}</div></section>)}
        {industryExpertise && industryExpertise.length > 0 && industryExpertise.some(e => e.name) && (<section className="mb-6"><h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Industry Expertise</h2><div className="space-y-2">{industryExpertise.filter(e => e.name).map((e, i) => (<div key={i}><div className="flex justify-between text-sm"><span className="font-medium text-gray-900">{e.name}</span><span className="text-gray-500">{e.level}</span></div><div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-[#1e3a5f] h-1.5 rounded-full" style={{ width: e.level === 'Expert' ? '100%' : e.level === 'Advanced' ? '75%' : e.level === 'Intermediate' ? '50%' : '25%' }}></div></div></div>))}</div></section>)}
        {philosophy && philosophy.quote && (<section className="mb-6"><h2 className="text-lg font-bold text-[#1e3a5f] mb-4">My Life Philosophy</h2><blockquote className="italic text-gray-600 border-l-2 border-[#1e3a5f]/30 pl-3">&ldquo;{philosophy.quote}&rdquo;</blockquote>{philosophy.author && <p className="text-sm text-gray-500 mt-2 text-right">— {philosophy.author}</p>}</section>)}
        {books && books.length > 0 && books.some(b => b.title) && (<section className="mb-6"><h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Books</h2><div className="space-y-2">{books.filter(b => b.title).map((b, i) => (<div key={i}><h3 className="font-semibold text-gray-900 text-sm">{b.title}</h3>{b.author && <p className="text-xs text-gray-500">{b.author}</p>}</div>))}</div></section>)}
        {socialLinks && socialLinks.length > 0 && socialLinks.some(l => l.network) && (<section className="mb-6"><h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Find Me Online</h2><div className="space-y-2">{socialLinks.filter(l => l.network).map((l, i) => (<div key={i} className="flex items-center gap-2"><span className="font-semibold text-gray-900 text-sm">{l.network}</span>{l.username && <span className="text-sm text-gray-500">{l.username}</span>}</div>))}</div></section>)}
        {signature && (<section className="mb-6 text-center pt-4"><p className="text-2xl italic text-gray-700" style={{ fontFamily: 'cursive' }}>{signature}</p></section>)}

        {/* Custom Sections */}
        {customSections && customSections.length > 0 && customSections.map((section, index) => (
          section.title && (
            <section key={index} className="mb-6">
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">{section.title}</h2>
              {section.content && (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
              )}
            </section>
          )
        ))}
      </main>
    </div>
  );
}

