"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";
import { formatDate } from "./utils";
import { ReactNode, useMemo } from "react";

interface TemplateProps {
  resume: Resume;
}

export default function ProfessionalWhite({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise, sectionOrder } = resume;

  // Get section order (use default if not set)
  const orderedSections = useMemo(() => {
    return sectionOrder || defaultSectionOrder;
  }, [sectionOrder]);

  // Section render functions
  const renderSection = (sectionType: SectionType): ReactNode => {
    switch (sectionType) {
      case "summary":
        if (!basics?.summary) return null;
        return (
          <section key="summary" className="mb-6" data-section="summary">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
              Summary
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {basics.summary}
            </p>
          </section>
        );

      case "experience":
        if (!work || work.length === 0) return null;
        return (
          <section key="experience" className="mb-6" data-section="experience">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Experience
            </h2>
            <div className="space-y-4">
              {work.map((job, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.position}</h3>
                      <p className="text-sm text-gray-600">
                        {job.name}
                        {(job.city || job.country) && <span className="text-gray-400"> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}
                      </p>
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
        );

      case "internships":
        if (!internships || internships.length === 0) return null;
        return (
          <section key="internships" className="mb-6" data-section="internships">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Internships
            </h2>
            <div className="space-y-4">
              {internships.map((intern, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{intern.position}</h3>
                      <p className="text-sm text-gray-600">
                        {intern.company}
                        {(intern.city || intern.country) && <span className="text-gray-400"> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
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
        );

      case "education":
        if (!education || education.length === 0) return null;
        return (
          <section key="education" className="mb-6" data-section="education">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start">
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
                </div>
              ))}
            </div>
          </section>
        );

      case "awards":
        if (!awards || awards.length === 0) return null;
        return (
          <section key="awards" className="mb-6" data-section="awards">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Awards
            </h2>
            <div className="space-y-3">
              {awards.map((award, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{award.title}</h3>
                      {award.awarder && <p className="text-sm text-gray-600">{award.awarder}</p>}
                      {award.summary && <p className="text-sm text-gray-600 mt-1">{award.summary}</p>}
                    </div>
                    {award.date && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(award.date)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "skills":
        if (!skills || skills.length === 0) return null;
        return (
          <section key="skills" className="mb-6" data-section="skills">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Skills
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {skills.filter(skill => skill.name).map((skill, index) => {
                const levelMap: Record<string, number> = {
                  "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1,
                };
                const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                return (
                  <div key={index} className="resume-item">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{skill.name}</span>
                      <span className="text-xs text-gray-500">{skill.level || "Intermediate"}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className={`w-2 h-2 rounded-full ${dot <= filledDots ? "bg-blue-500" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "languages":
        if (!languages || languages.length === 0) return null;
        return (
          <section key="languages" className="mb-6" data-section="languages">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Languages
            </h2>
            <LanguageGrid languages={languages} />
          </section>
        );

      case "courses":
        if (!courses || courses.length === 0) return null;
        return (
          <section key="courses" className="mb-6" data-section="courses">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Courses
            </h2>
            <div className="space-y-3">
              {courses.map((course, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.name}</h3>
                      {course.institution && <p className="text-sm text-gray-600">{course.institution}</p>}
                    </div>
                    {(course.startDate || course.endDate) && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(course.startDate)} — {formatDate(course.endDate) || "Present"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "hobbies":
        if (!hobbies || hobbies.length === 0) return null;
        return (
          <section key="hobbies" className="mb-6" data-section="hobbies">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Hobbies & Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby, index) => (
                <span key={index} className="resume-item px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {hobby.name}
                </span>
              ))}
            </div>
          </section>
        );

      case "references":
        if (!references || references.length === 0) return null;
        return (
          <section key="references" className="mb-6" data-section="references">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              References
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {references.map((ref, index) => (
                <div key={index} className="resume-item p-3 border border-gray-200 rounded-lg" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                  {ref.role && <p className="text-sm text-gray-600">{ref.role}</p>}
                  {ref.company && <p className="text-sm text-gray-500">{ref.company}</p>}
                  {ref.email && <p className="text-xs text-blue-500">{ref.email}</p>}
                  {ref.phone && <p className="text-xs text-gray-500">{ref.phone}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case "publications":
        if (!publications || publications.length === 0) return null;
        return (
          <section key="publications" className="mb-6" data-section="publications">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Publications
            </h2>
            <div className="space-y-3">
              {publications.map((pub, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <h3 className="font-semibold text-gray-900 text-sm">{pub.name}</h3>
                  {pub.publisher && <p className="text-sm text-gray-600">{pub.publisher}</p>}
                  {pub.releaseDate && <p className="text-xs text-gray-500">{formatDate(pub.releaseDate)}</p>}
                  {pub.summary && <p className="text-sm text-gray-600 mt-1">{pub.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!projects || projects.length === 0 || !projects.some(p => p.name)) return null;
        return (
          <section key="projects" className="mb-6" data-section="projects">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.filter(p => p.name).map((project, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                  {(project.startDate || project.endDate) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}
                    </p>
                  )}
                  {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
                  {project.url && <a href={project.url} className="text-xs text-blue-500 mt-1 block">{project.url}</a>}
                </div>
              ))}
            </div>
          </section>
        );

      case "certifications":
        if (!certificates || certificates.length === 0 || !certificates.some(c => c.name)) return null;
        return (
          <section key="certifications" className="mb-6" data-section="certifications">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Certifications
            </h2>
            <div className="space-y-3">
              {certificates.filter(c => c.name).map((cert, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
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
        );

      case "volunteering":
        if (!volunteer || volunteer.length === 0 || !volunteer.some(v => v.organization)) return null;
        return (
          <section key="volunteering" className="mb-6" data-section="volunteering">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Volunteering
            </h2>
            <div className="space-y-3">
              {volunteer.filter(v => v.organization).map((vol, index) => (
                <div key={index} className="resume-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{vol.organization}</h3>
                      {vol.position && <p className="text-sm text-gray-600">{vol.position}</p>}
                      {vol.summary && <p className="text-sm text-gray-600 mt-1">{vol.summary}</p>}
                    </div>
                    {(vol.startDate || vol.endDate) && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(vol.startDate)} — {formatDate(vol.endDate) || "Present"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "strengths":
        if (!strengths || strengths.length === 0 || !strengths.some(s => s.name)) return null;
        return (
          <section key="strengths" className="mb-6" data-section="strengths">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Strengths
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {strengths.filter(s => s.name).map((strength, index) => (
                <div key={index} className="resume-item p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 text-sm">{strength.name}</h3>
                  {strength.description && (
                    <p className="text-xs text-gray-600 mt-1">{strength.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "industryExpertise":
        if (!industryExpertise || industryExpertise.length === 0 || !industryExpertise.some(e => e.name)) return null;
        return (
          <section key="industryExpertise" className="mb-6" data-section="industryExpertise">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Industry Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {industryExpertise.filter(e => e.name).map((expertise, index) => (
                <span key={index} className="resume-item px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {expertise.name}
                  {expertise.level && ` (${expertise.level})`}
                </span>
              ))}
            </div>
          </section>
        );

      case "philosophy":
        if (!philosophy?.quote) return null;
        return (
          <section key="philosophy" className="mb-6" data-section="philosophy">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Life Philosophy
            </h2>
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
              "{philosophy.quote}"
              {philosophy.author && (
                <cite className="block text-sm text-gray-500 mt-1 not-italic">— {philosophy.author}</cite>
              )}
            </blockquote>
          </section>
        );

      case "books":
        if (!books || books.length === 0 || !books.some(b => b.title)) return null;
        return (
          <section key="books" className="mb-6" data-section="books">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Books
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {books.filter(b => b.title).map((book, index) => (
                <div key={index} className="resume-item flex gap-2">
                  <span className="text-gray-400">📚</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{book.title}</p>
                    {book.author && <p className="text-xs text-gray-500">{book.author}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "socialLinks":
        if (!socialLinks || socialLinks.length === 0 || !socialLinks.some(l => l.network)) return null;
        return (
          <section key="socialLinks" className="mb-6" data-section="socialLinks">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Find Me Online
            </h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.filter(l => l.network).map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-item flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <span className="font-medium">{link.network}</span>
                  {link.username && <span className="text-gray-500">@{link.username}</span>}
                </a>
              ))}
            </div>
          </section>
        );

      case "custom":
        if (!customSections || customSections.length === 0 || !customSections.some(s => s.title)) return null;
        return (
          <div key="custom">
            {customSections.filter(s => s.title).map((section, index) => (
              <section key={index} className="mb-6" data-section={`custom-${index}`}>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  {section.title}
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-12 font-['Inter',sans-serif] text-gray-800 shadow-lg print:shadow-none print:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex items-start gap-6">
          {basics?.image && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
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
          <div className="flex-1">
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
            {(basics?.profiles?.find(p => p.network === "LinkedIn")?.url || basics?.profiles?.find(p => p.network === "GitHub")?.url) && (
              <div className="flex flex-wrap gap-4 text-sm mt-1">
                {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                )}
                {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
                  <span className="flex items-center gap-1 text-gray-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Render sections in order */}
      {orderedSections.map((sectionType) => renderSection(sectionType))}
    </div>
  );
}

