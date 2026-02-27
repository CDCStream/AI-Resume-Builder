"use client";

import { OrbitingCircles } from "./orbiting-circles";

export const CompanyLogos = {
  Google: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Microsoft: () => (
    <svg viewBox="0 0 23 23" className="w-full h-full">
      <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
      <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
      <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
    </svg>
  ),
  Amazon: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <path fill="#FF9800" d="M43.5,29c-0.8,0-1.5,0.7-1.5,1.5v1c0,0.8,0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5v-1C45,29.7,44.3,29,43.5,29z"/>
      <path fill="#FF9800" d="M42.5,36H4.5C3.7,36,3,36.7,3,37.5S3.7,39,4.5,39h38c0.8,0,1.5-0.7,1.5-1.5S43.3,36,42.5,36z"/>
      <path fill="#FF9800" d="M43.3,26.6c-1.9,1.1-4.3,2-7.3,2.8c-4.5,1.1-9.5,1.6-14.5,1.6c-7.5,0-14.5-1.4-20.2-4c-0.5-0.2-1.1,0-1.3,0.5c-0.2,0.5,0,1.1,0.5,1.3c6,2.7,13.3,4.2,21.1,4.2c5.2,0,10.4-0.5,15.2-1.7c3.3-0.8,6-1.9,8.2-3.2c0.5-0.3,0.6-0.9,0.4-1.3C45,26.4,44.4,26.2,43.3,26.6z"/>
      <path fill="#37474F" d="M24,10c-8.3,0-15,4-15,9s6.7,9,15,9s15-4,15-9S32.3,10,24,10z M24,25c-6.1,0-11-2.7-11-6s4.9-6,11-6s11,2.7,11,6S30.1,25,24,25z"/>
      <path fill="#37474F" d="M24,13c-4.4,0-8,1.8-8,4s3.6,4,8,4s8-1.8,8-4S28.4,13,24,13z"/>
    </svg>
  ),
  Meta: () => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <defs>
        <linearGradient id="meta-gradient" x1="50%" x2="50%" y1="97.078%" y2="0%">
          <stop offset="0%" stopColor="#0062E0"/>
          <stop offset="100%" stopColor="#19AFFF"/>
        </linearGradient>
      </defs>
      <path fill="url(#meta-gradient)" d="M18 2C9.163 2 2 9.163 2 18c0 7.995 5.858 14.628 13.5 15.825v-11.2h-4.062v-4.625H15.5v-3.525c0-4.01 2.388-6.225 6.043-6.225 1.75 0 3.582.313 3.582.313v3.938h-2.018c-1.988 0-2.607 1.233-2.607 2.498v3.001h4.438l-.71 4.625h-3.728v11.2C28.143 32.628 34 25.995 34 18c0-8.837-7.163-16-16-16z"/>
    </svg>
  ),
  Apple: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#000000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  Netflix: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#E50914" d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
    </svg>
  ),
  Spotify: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  Airbnb: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#FF5A5F" d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.414-4.408-.264-1.223-.063-2.187.556-2.871.427-.472.988-.737 1.612-.766.672-.03 1.397.208 2.051.672.647-.464 1.379-.702 2.051-.672.624.029 1.185.294 1.612.766.619.684.82 1.648.556 2.871-.266 1.224-1.061 2.711-2.414 4.408-.541.679-1.128 1.398-1.805 2.192-.677-.794-1.264-1.513-1.805-2.192zm-.001-13.564c-2.142-2.661-4.328-4.328-6.126-4.711-.898-.192-1.731-.078-2.408.33-.901.543-1.466 1.57-1.466 2.67 0 .554.139 1.142.416 1.75.277.608.693 1.235 1.237 1.87 1.076 1.254 2.666 2.472 4.5 3.603.344-.498.727-.99 1.152-1.473.79-.899 1.651-1.706 2.54-2.408-.982-.697-1.994-1.548-2.898-2.585-.449-.515-.799-.983-1.028-1.363-.191-.317-.283-.548-.283-.671 0-.13.046-.195.133-.233.127-.055.337-.036.591.018 1.098.234 2.64 1.308 4.14 3.203 1.5-1.895 3.042-2.969 4.14-3.203.254-.054.464-.073.591-.018.087.038.133.103.133.233 0 .123-.092.354-.283.671-.229.38-.579.848-1.028 1.363-.904 1.037-1.916 1.888-2.898 2.585.889.702 1.75 1.509 2.54 2.408.425.483.808.975 1.152 1.473 1.834-1.131 3.424-2.349 4.5-3.603.544-.635.96-1.262 1.237-1.87.277-.608.416-1.196.416-1.75 0-1.1-.565-2.127-1.466-2.67-.677-.408-1.51-.522-2.408-.33-1.798.383-3.984 2.05-6.126 4.711z"/>
    </svg>
  ),
};

interface CompanyOrbitProps {
  className?: string;
}

export function CompanyOrbit({ className }: CompanyOrbitProps) {
  return (
    <div className={`relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden ${className}`}>
      {/* Center text */}
      <div className="z-10 flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">Trusted by</span>
        <span className="text-lg text-gray-500 mt-1">top companies worldwide</span>
      </div>

      {/* Inner orbit - smaller companies */}
      <OrbitingCircles
        className="size-[40px] border-none bg-white shadow-lg"
        duration={25}
        delay={0}
        radius={100}
        path={false}
      >
        <div className="p-2">
          <CompanyLogos.Google />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[40px] border-none bg-white shadow-lg"
        duration={25}
        delay={12.5}
        radius={100}
        path={false}
      >
        <div className="p-2">
          <CompanyLogos.Microsoft />
        </div>
      </OrbitingCircles>

      {/* Middle orbit */}
      <OrbitingCircles
        className="size-[48px] border-none bg-white shadow-lg"
        duration={30}
        delay={0}
        radius={160}
        reverse
        path={false}
      >
        <div className="p-2.5">
          <CompanyLogos.Amazon />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[48px] border-none bg-white shadow-lg"
        duration={30}
        delay={10}
        radius={160}
        reverse
        path={false}
      >
        <div className="p-2.5">
          <CompanyLogos.Meta />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[48px] border-none bg-white shadow-lg"
        duration={30}
        delay={20}
        radius={160}
        reverse
        path={false}
      >
        <div className="p-2.5">
          <CompanyLogos.Apple />
        </div>
      </OrbitingCircles>

      {/* Outer orbit */}
      <OrbitingCircles
        className="size-[52px] border-none bg-white shadow-lg"
        duration={35}
        delay={0}
        radius={220}
        path={false}
      >
        <div className="p-3">
          <CompanyLogos.Netflix />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[52px] border-none bg-white shadow-lg"
        duration={35}
        delay={11.6}
        radius={220}
        path={false}
      >
        <div className="p-3">
          <CompanyLogos.Spotify />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[52px] border-none bg-white shadow-lg"
        duration={35}
        delay={23.3}
        radius={220}
        path={false}
      >
        <div className="p-3">
          <CompanyLogos.Airbnb />
        </div>
      </OrbitingCircles>
    </div>
  );
}

export default CompanyOrbit;
