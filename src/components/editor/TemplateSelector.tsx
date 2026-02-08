"use client";

import { templates, categories, templatesByCategory, TemplateCategory } from "@/components/templates";
import { useState } from "react";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

// Professional SVG Icons for each category
const CategoryIcons: Record<TemplateCategory, React.ReactNode> = {
  Professional: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Modern: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Creative: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Minimalist: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  Executive: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Classic: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

export default function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTemplates = activeCategory === "all"
    ? templates
    : templatesByCategory[activeCategory] || [];

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Template Gallery</h3>
            <p className="text-xs text-gray-500 mt-0.5">{templates.length} professional designs</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {isExpanded ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Collapse
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Browse All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Selection - Always Visible */}
      {selectedTemplateData && !isExpanded && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* Template Preview Mini */}
            <div
              className="w-16 h-20 rounded-lg shadow-md border border-gray-200 flex-shrink-0 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${selectedTemplateData.color}22 0%, ${selectedTemplateData.color}44 100%)` }}
            >
              <div className="w-full h-3 opacity-80" style={{ backgroundColor: selectedTemplateData.color }}></div>
              <div className="p-1.5 space-y-1">
                <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
                <div className="h-0.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-0.5 w-10 bg-gray-200 rounded-full"></div>
                <div className="h-0.5 w-7 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: selectedTemplateData.color }}
                />
                <span className="text-sm font-semibold text-gray-900">{selectedTemplateData.name}</span>
              </div>
              <p className="text-xs text-gray-500">{selectedTemplateData.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {selectedTemplateData.category}
                </span>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Gallery */}
      {isExpanded && (
        <div className="flex">
          {/* Sidebar - Category List */}
          <div className="w-44 border-r border-gray-100 bg-gray-50/30">
            <div className="p-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                  activeCategory === "all"
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="flex-1 text-left">All Templates</span>
                <span className="text-[10px] text-gray-400 font-normal">{templates.length}</span>
              </button>

              <div className="mt-1 space-y-0.5">
                {categories.map((cat) => {
                  const count = templatesByCategory[cat.name]?.length || 0;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                        activeCategory === cat.name
                          ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                          : "text-gray-600 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      <span className="text-gray-400">{CategoryIcons[cat.name]}</span>
                      <span className="flex-1 text-left">{cat.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template.id);
                  }}
                  className={`group relative p-2.5 rounded-xl text-left transition-all duration-200 ${
                    selectedTemplate === template.id
                      ? "bg-blue-50 ring-2 ring-blue-500 shadow-sm"
                      : "bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200"
                  }`}
                >
                  {/* Mini Preview */}
                  <div
                    className="w-full h-12 rounded-lg mb-2 shadow-sm border border-gray-200/50 overflow-hidden transition-transform group-hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${template.color}15 0%, ${template.color}30 100%)` }}
                  >
                    <div className="w-full h-2" style={{ backgroundColor: template.color, opacity: 0.9 }}></div>
                    <div className="p-1 flex gap-1">
                      <div className="w-1/3 space-y-0.5">
                        <div className="h-0.5 w-full bg-gray-300/60 rounded-full"></div>
                        <div className="h-0.5 w-3/4 bg-gray-200/60 rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="h-0.5 w-full bg-gray-200/60 rounded-full"></div>
                        <div className="h-0.5 w-4/5 bg-gray-200/60 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="flex items-start gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full mt-0.5 ring-1 ring-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-900 truncate leading-tight">{template.name}</p>
                      <p className="text-[9px] text-gray-500 truncate">{template.description}</p>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} in {activeCategory === 'all' ? 'all categories' : activeCategory}
              </p>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
