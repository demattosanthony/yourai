import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyTable,
  TypographyTh,
  TypographyTd,
  TypographyTr,
  TypographyList,
  TypographyLi,
  TypographyInlineCode,
} from "./Typography";

const MarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
  const components = {
    h1: ({ node, ...props }: any) => <TypographyH1 {...props} />,
    h2: ({ node, ...props }: any) => <TypographyH2 {...props} />,
    h3: ({ node, ...props }: any) => <TypographyH3 {...props} />,
    h4: ({ node, ...props }: any) => <TypographyH4 {...props} />,
    p: ({ node, ...props }: any) => <TypographyP {...props} />,
    blockquote: ({ node, ...props }: any) => (
      <TypographyBlockquote {...props} />
    ),
    table: ({ node, ...props }: any) => <TypographyTable {...props} />,
    thead: ({ node, ...props }: any) => <thead {...props} />,
    tbody: ({ node, ...props }: any) => <tbody {...props} />,
    tr: ({ node, ...props }: any) => <TypographyTr {...props} />,
    th: ({ node, ...props }: any) => <TypographyTh {...props} />,
    td: ({ node, ...props }: any) => <TypographyTd {...props} />,
    ul: ({ node, ...props }: any) => <TypographyList {...props} />,
    li: ({ node, ...props }: any) => <TypographyLi {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-md"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <TypographyInlineCode {...props}>{children}</TypographyInlineCode>
      );
    },
    em: ({ node, ...props }: any) => <em {...props} />,
    strong: ({ node, ...props }: any) => <strong {...props} />,
    delete: ({ node, ...props }: any) => <del {...props} />,
    a: ({ node, ...props }: any) => (
      <a className="text-blue-500 hover:underline" {...props} />
    ),
    img: ({ node, ...props }: any) => (
      <img className="max-w-full h-auto" {...props} />
    ),
  };

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkGfm]}
      className={"flex flex-col gap-4"}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownViewer;
