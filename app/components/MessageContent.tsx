import ReactMarkdown from "react-markdown";
import { Highlight, themes } from "prism-react-renderer";
import remarkGfm from "remark-gfm";

export function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-slate max-w-none"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <div className="relative">
              <Highlight
                theme={themes.vsLight}
                code={String(children).replace(/\n$/, "")}
                language={match[1]}
              >
                {({
                  className,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <pre className="rounded-lg !bg-gray-50 !p-4 overflow-x-auto">
                    {tokens.map((line, i) => (
                      <div
                        key={i}
                        {...getLineProps({ line })}
                        className="table-row"
                      >
                        <span className="table-cell pr-4 text-gray-500 text-sm select-none">
                          {i + 1}
                        </span>
                        <span className="table-cell">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          ) : (
            <code className="bg-gray-100 rounded px-1 py-0.5" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
