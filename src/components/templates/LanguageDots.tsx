"use client";

interface LanguageDotsProps {
  language: string;
  fluency?: string;
  dotColor?: string;
  textColor?: string;
  subTextColor?: string;
  emptyDotColor?: string;
  size?: "sm" | "md";
}

const fluencyLevels: Record<string, number> = {
  "Native": 5,
  "Fluent": 5,
  "Proficient": 5,
  "Advanced": 4,
  "Intermediate": 3,
  "Basic": 2,
  "Beginner": 1,
};

export function LanguageDots({
  language,
  fluency = "Intermediate",
  dotColor = "#3B82F6",
  textColor = "text-gray-900",
  subTextColor = "text-gray-500",
  emptyDotColor = "#D1D5DB",
  size = "sm",
}: LanguageDotsProps) {
  const filledDots = fluencyLevels[fluency] || 3;
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`font-medium ${textColor} ${size === "sm" ? "text-sm" : "text-base"}`}>
          {language}
        </p>
        <p className={`${subTextColor} ${size === "sm" ? "text-xs" : "text-sm"}`}>
          {fluency}
        </p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`${dotSize} rounded-full`}
            style={{
              backgroundColor: dot <= filledDots ? dotColor : emptyDotColor,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Grid version for displaying multiple languages
interface LanguageGridProps {
  languages: Array<{ language?: string; fluency?: string }>;
  dotColor?: string;
  textColor?: string;
  subTextColor?: string;
  emptyDotColor?: string;
  columns?: 1 | 2;
}

export function LanguageGrid({
  languages,
  dotColor = "#3B82F6",
  textColor = "text-gray-900",
  subTextColor = "text-gray-500",
  emptyDotColor = "#D1D5DB",
  columns = 2,
}: LanguageGridProps) {
  return (
    <div className={`grid ${columns === 2 ? "grid-cols-2" : "grid-cols-1"} gap-x-6 gap-y-3`}>
      {languages.map((lang, index) => (
        <LanguageDots
          key={index}
          language={lang.language || ""}
          fluency={lang.fluency}
          dotColor={dotColor}
          textColor={textColor}
          subTextColor={subTextColor}
          emptyDotColor={emptyDotColor}
        />
      ))}
    </div>
  );
}

