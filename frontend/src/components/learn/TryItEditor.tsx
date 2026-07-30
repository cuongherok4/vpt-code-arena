import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { learnApi, type RunCodeResponse } from '@/api/learn.api';
import { useTheme } from '@/hooks/useTheme';

// Judge0 language IDs
const LANG_MAP: Record<string, { id: number; defaultCode: string }> = {
  java:   { id: 62, defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}' },
  c:      { id: 50, defaultCode: '#include <stdio.h>\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}' },
  python: { id: 71, defaultCode: 'print("Hello, Python!")' },
};

interface Props {
  lang: string;
  initialCode?: string;
}

export const TryItEditor = ({ lang, initialCode }: Props) => {
  const { theme } = useTheme();
  const cfg = LANG_MAP[lang] ?? LANG_MAP.java;
  const [code, setCode] = useState(initialCode ?? cfg.defaultCode);
  const [result, setResult] = useState<RunCodeResponse | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const { mutate: run, isPending } = useMutation({
    mutationFn: () => learnApi.runCode(code, cfg.id),
    onSuccess: setResult,
  });

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    applyDiagnostics(result, editorRef.current, monacoRef.current);
  }, [result]);

  const output = formatCompilerOutput(result);
  const hasError = result && result.status !== 'Accepted';

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{lang} Editor</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => run()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Chạy thử
          </button>
        </div>
      </div>

      {/* Editor */}
      <Editor
        height="280px"
        language={lang === 'c' ? 'cpp' : lang}
        value={code}
        onChange={v => setCode(v ?? '')}
        onMount={handleEditorMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
      />

      {/* Output */}
      {result && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            {!hasError
              ? <CheckCircle size={14} className="text-green-400" />
              : <XCircle size={14} className="text-red-400" />
            }
            <span className={`text-xs ${hasError ? 'text-red-300' : 'text-slate-400'}`}>
              {result.status}{result.time ? ` · ${result.time}s` : ''}
            </span>
          </div>
          <pre className={`text-sm font-mono whitespace-pre-wrap rounded-lg p-3 ${hasError ? 'bg-red-950/30 text-red-100' : 'bg-black/30 text-slate-200'}`}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

function formatCompilerOutput(result: RunCodeResponse | null) {
  if (!result) return '';

  const parts: string[] = [];
  if (result.stdout) parts.push(result.stdout.trimEnd());
  if (result.stderr) parts.push(`stderr:\n${result.stderr.trimEnd()}`);
  if (result.compileOutput) parts.push(`compiler:\n${result.compileOutput.trimEnd()}`);
  if (!result.passed && result.expectedOutput) {
    parts.push(`expected:\n${result.expectedOutput.trimEnd()}`);
    parts.push(`actual:\n${(result.stdout ?? '').trimEnd() || '(empty)'}`);
  }

  return parts.join('\n\n') || '(Không có output)';
}

function applyDiagnostics(result: RunCodeResponse | null, editor: any, monaco: any) {
  const model = editor?.getModel?.();
  if (!model || !monaco) return;

  const text = [result?.compileOutput, result?.stderr].filter(Boolean).join('\n');
  if (!result || result.status === 'Accepted' || !text) {
    monaco.editor.setModelMarkers(model, 'judge0', []);
    return;
  }

  const diagnostic = extractDiagnostic(text);
  monaco.editor.setModelMarkers(model, 'judge0', diagnostic ? [{
    severity: monaco.MarkerSeverity.Error,
    message: diagnostic.message,
    startLineNumber: diagnostic.line,
    startColumn: diagnostic.column,
    endLineNumber: diagnostic.line,
    endColumn: diagnostic.column + 1,
  }] : []);
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

export default TryItEditor;
