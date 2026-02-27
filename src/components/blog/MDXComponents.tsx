import Image from 'next/image';

interface YouTubeProps {
  id: string;
  title?: string;
}

function YouTube({ id, title = "YouTube Video" }: YouTubeProps) {
  return (
    <div className="relative w-full aspect-video my-8 rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
}

function BlogImage({ src, alt, caption }: BlogImageProps) {
  return (
    <figure className="my-8">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'error';
  children: React.ReactNode;
}

function Callout({ type = 'info', children }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    tip: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
    error: '❌',
  };

  return (
    <div className={`my-6 p-4 rounded-lg border-l-4 ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  );
}

export const MDXComponents = {
  YouTube,
  BlogImage,
  Callout,
  h1: (props: any) => <h1 className="text-4xl font-bold text-gray-900 mt-12 mb-6" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold text-gray-900 mt-10 mb-4" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-3" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-semibold text-gray-900 mt-6 mb-2" {...props} />,
  p: (props: any) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
  a: (props: any) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
  li: (props: any) => <li className="text-gray-700" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-6" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props} />
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
  img: (props: any) => (
    <img className="rounded-xl shadow-lg my-6 w-full" {...props} />
  ),
};
