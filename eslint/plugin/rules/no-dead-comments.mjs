import ts from "typescript";

/**
 * Flags comments that hold no why: divider lines (`// ------`) and commented-out
 * code (a comment run that parses as statements and ends like code).
 */
const DIVIDER = /^[-=*#]{3,}$/;
const CODE_ENDING = /[;}]$/;

function parsesAsCode(text) {
  const source = ts.createSourceFile(
    "comment.tsx",
    text,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  return source.statements.length > 0 && source.parseDiagnostics.length === 0;
}

const rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow divider comments and commented-out code" },
    schema: [],
    messages: {
      divider: "Remove the divider line: structure comes from the code.",
      code: "Remove the commented-out code: git keeps history.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    return {
      Program() {
        const comments = sourceCode.getAllComments();
        let run = [];
        const flushRun = () => {
          if (run.length > 0) {
            const text = run.map((c) => c.value.trim()).join("\n");
            if (CODE_ENDING.test(text) && parsesAsCode(text)) {
              context.report({
                loc: {
                  start: run[0].loc.start,
                  end: run[run.length - 1].loc.end,
                },
                messageId: "code",
              });
            }
          }
          run = [];
        };
        for (const comment of comments) {
          const text = comment.value.trim();
          if (DIVIDER.test(text)) {
            flushRun();
            context.report({ loc: comment.loc, messageId: "divider" });
            continue;
          }
          if (comment.type === "Line") {
            const last = run[run.length - 1];
            if (last && last.loc.end.line + 1 !== comment.loc.start.line) {
              flushRun();
            }
            run.push(comment);
          } else {
            flushRun();
            // A block comment holds code only when it has no JSDoc stars.
            if (!comment.value.startsWith("*") && !/^@/.test(text)) {
              run = [comment];
              flushRun();
            }
          }
        }
        flushRun();
      },
    };
  },
};

export default rule;
