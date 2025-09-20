"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`prose prose-base max-w-none 
      prose-headings:text-dark-900 prose-headings:font-semibold prose-headings:tracking-tight
      prose-h1:text-heading-3 prose-h1:mb-4 prose-h1:mt-6 prose-h1:first:mt-0
      prose-h2:text-heading-4 prose-h2:mb-3 prose-h2:mt-5 prose-h2:first:mt-0
      prose-h3:text-heading-5 prose-h3:mb-2 prose-h3:mt-4 prose-h3:first:mt-0
      prose-h4:text-body-large prose-h4:mb-2 prose-h4:mt-3 prose-h4:first:mt-0
      prose-h5:text-body-medium prose-h5:mb-2 prose-h5:mt-3 prose-h5:first:mt-0
      prose-h6:text-body-medium prose-h6:mb-2 prose-h6:mt-2 prose-h6:first:mt-0
      
      prose-p:text-dark-700 prose-p:mb-4 prose-p:leading-relaxed prose-p:first:mt-0 prose-p:last:mb-0
      
      prose-strong:text-dark-900 prose-strong:font-semibold
      prose-em:text-dark-800 prose-em:italic
      
      prose-a:text-dark-900 prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2
      hover:prose-a:text-dark-600 hover:prose-a:decoration-dark-600
      
      prose-ul:text-dark-700 prose-ul:mb-4 prose-ul:pl-6 prose-ul:first:mt-0 prose-ul:last:mb-0
      prose-ol:text-dark-700 prose-ol:mb-4 prose-ol:pl-6 prose-ol:first:mt-0 prose-ol:last:mb-0
      prose-li:text-dark-700 prose-li:mb-1 prose-li:leading-relaxed
      prose-li:marker:text-dark-500
      
      prose-blockquote:text-dark-600 prose-blockquote:border-l-4 prose-blockquote:border-dark-200
      prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:bg-light-50
      prose-blockquote:italic
      
      prose-code:text-dark-900 prose-code:bg-light-200 prose-code:px-1.5 prose-code:py-0.5
      prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none
      prose-code:after:content-none
      
      prose-pre:text-dark-900 prose-pre:bg-dark-900 prose-pre:text-light-100 prose-pre:p-4
      prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
      prose-pre:border prose-pre:border-dark-200
      
      prose-img:rounded-lg prose-img:shadow-sm prose-img:my-4 prose-img:border prose-img:border-light-300
      
      prose-table:text-dark-700 prose-table:text-sm prose-table:my-4
      prose-th:text-dark-900 prose-th:bg-light-100 prose-th:font-semibold prose-th:px-3 prose-th:py-2
      prose-th:border prose-th:border-light-300 prose-th:first:rounded-tl-lg prose-th:last:rounded-tr-lg
      prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-light-300 prose-td:border-t-0
      prose-td:last:border-r-0 prose-td:first:border-l-0
      prose-tr:last:prose-td:first:rounded-bl-lg prose-tr:last:prose-td:last:rounded-br-lg
      
      prose-hr:border-light-300 prose-hr:my-6 ${className}`}>
      <ReactMarkdown
        components={{
          // Custom components for enhanced styling
          h1: ({ children }) => (
            <h1 className="text-heading-3 font-semibold text-dark-900 mb-4 mt-6 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-heading-4 font-semibold text-dark-900 mb-3 mt-5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-heading-5 font-semibold text-dark-900 mb-2 mt-4 first:mt-0 tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-body text-dark-700 mb-4 leading-relaxed first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="text-dark-700 mb-4 pl-6 space-y-1 first:mt-0 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-dark-700 mb-4 pl-6 space-y-1 first:mt-0 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-dark-700 leading-relaxed marker:text-dark-500">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-dark-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-dark-800">
              {children}
            </em>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-dark-900 underline decoration-2 underline-offset-2 hover:text-dark-600 hover:decoration-dark-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-dark-200 pl-4 py-2 my-4 bg-light-50 italic text-dark-600">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="text-dark-900 bg-light-200 px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="text-dark-900 bg-dark-900 text-light-100 p-4 rounded-lg overflow-x-auto my-4 border border-dark-200">
              {children}
            </pre>
          ),
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt} 
              className="rounded-lg shadow-sm my-4 border border-light-300 max-w-full h-auto"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm text-dark-700 border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-dark-900 bg-light-100 font-semibold px-3 py-2 border border-light-300 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border border-light-300 border-t-0">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="border-light-300 my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

