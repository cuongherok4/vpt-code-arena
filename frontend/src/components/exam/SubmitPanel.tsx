import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Loader2, Send } from 'lucide-react';
import type { ExamLanguage, SubmissionDto } from '@/api/exam.api';
import { useTheme } from '@/hooks/useTheme';

const LANGUAGE_OPTIONS: Array<{ value: ExamLanguage; label: string; monaco: string; defaultCode: string }> = [
  {
    value: 'java',
    label: 'Java',
    monaco: 'java',
    defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Code here\n    }\n}',
  },
  {
    value: 'c',
    label: 'C',
    monaco: 'cpp',
    defaultCode: '#include <stdio.h>\nint main() {\n    // Code here\n    return 0;\n}',
  },
  {
    value: 'python',
    label: 'Python',
    monaco: 'python',
    defaultCode: '# Code here\n',
  },
];

interface SubmitPanelProps {
  isSubmitting: boolean;
  latestSubmission?: SubmissionDto;
  onLanguageChange?: (language: ExamLanguage) => void;
  onSubmit: (sourceCode: string, language: ExamLanguage) => void;
}

export const SubmitPanel = ({ isSubmitting, latestSubmission, onLanguageChange, onSubmit }: SubmitPanelProps) => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState<ExamLanguage>('python');
  const currentLanguage = useMemo(() => LANGUAGE_OPTIONS.find(item => item.value === language) ?? LANGUAGE_OPTIONS[2], [language]);
  const [codeByLanguage, setCodeByLanguage] = useState<Record<ExamLanguage, string>>({
    java: LANGUAGE_OPTIONS[0].defaultCode,
    c: LANGUAGE_OPTIONS[1].defaultCode,
    python: LANGUAGE_OPTIONS[2].defaultCode,
  });
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const code = codeByLanguage[language];
  const running = isSubmitting || latestSubmission?.result === 'PENDING';

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const selectLanguage = (nextLanguage: ExamLanguage) => {
    setLanguage(nextLanguage);
    onLanguageChange?.(nextLanguage);
  };

  useEffect(() => {
    const model = editorRef.current?.getModel?.();
    if (!model || !monacoRef.current) return;

    const output = latestSubmission?.errorOutput ?? '';
    if (!latestSubmission || latestSubmission.result === 'AC' || latestSubmission.result === 'PENDING' || !output) {
      monacoRef.current.editor.setModelMarkers(model, 'exam', []);
      return;
    }

    const diagnostic = extractDiagnostic(output);
    monacoRef.current.editor.setModelMarkers(model, 'exam', diagnostic ? [{
      severity: monacoRef.current.MarkerSeverity.Error,
      message: diagnostic.message,
      startLineNumber: diagnostic.line,
      startColumn: diagnostic.column,
      endLineNumber: diagnostic.line,
      endColumn: diagnostic.column + 1,
    }] : []);
  }, [latestSubmission]);

  return (
    <section className="min-w-0 overflow-hidden border border-white/10 bg-slate-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {LANGUAGE_OPTIONS.map(item => (
            <button
              key={item.value}
              type="button"
              onClick={() => selectLanguage(item.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                language === item.value ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSubmit(code, language)}
          disabled={running || !code.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {latestSubmission?.result === 'PENDING' ? 'Đang chấm' : 'Nộp bài'}
        </button>
      </div>

      <Editor
        height="min(440px, 58vh)"
        language={currentLanguage.monaco}
        value={code}
        onChange={value => setCodeByLanguage(prev => ({ ...prev, [language]: value ?? '' }))}
        onMount={handleEditorMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />

      {latestSubmission && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span className={statusClass(latestSubmission.result)}>{statusText(latestSubmission.result)}</span>
            {latestSubmission.executionTime != null && <span className="text-slate-500">· {latestSubmission.executionTime} ms</span>}
            {latestSubmission.memoryUsed != null && <span className="text-slate-500">· {latestSubmission.memoryUsed} KB</span>}
          </div>
          {latestSubmission.errorOutput && latestSubmission.result !== 'AC' && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                {latestSubmission.result === 'CE' ? 'Compiler' : 'Error'}
              </div>
              <pre className="max-h-44 overflow-y-auto rounded-lg bg-red-950/30 p-3 text-sm text-red-100 whitespace-pre-wrap">
                {latestSubmission.errorOutput}
              </pre>
            </div>
          )}
          {latestSubmission.output != null && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</div>
              <pre className="max-h-44 overflow-y-auto rounded-lg bg-slate-900 p-3 text-sm text-slate-100 whitespace-pre-wrap">
                {latestSubmission.output || '(Không có output)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

function statusText(status: SubmissionDto['result']) {
  return ({
    PENDING: 'Đang chấm',
    AC: 'Accepted',
    WA: 'Wrong Answer',
    TLE: 'Time Limit Exceeded',
    RE: 'Runtime Error',
    CE: 'Compilation Error',
  })[status];
}

function statusClass(status: SubmissionDto['result']) {
  if (status === 'AC') return 'font-semibold text-emerald-300';
  if (status === 'PENDING') return 'font-semibold text-sky-300';
  return 'font-semibold text-red-300';
}

function extractDiagnostic(output: string) {
  for (const lineText of output.split('\n')) {
    const fileMatch = lineText.match(/(?:Main\.java|main\.c|script\.py):(\d+):(?:(\d+):)?\s*(.*)/i);
    if (fileMatch) {
      return {
        line: Number(fileMatch[1]),
        column: fileMatch[2] ? Number(fileMatch[2]) : 1,
        message: fileMatch[3] || lineText,
      };
    }

    const pythonMatch = lineText.match(/File\s+"[^"]+",\s+line\s+(\d+)/i);
    if (pythonMatch) {
      return { line: Number(pythonMatch[1]), column: 1, message: lineText };
    }
  }

  return null;
}

export default SubmitPanel;
