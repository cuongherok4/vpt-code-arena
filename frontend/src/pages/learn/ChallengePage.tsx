import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Zap, Play, Send, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { learnApi, type RunCodeResponse } from '@/api/learn.api';
import { useTheme } from '@/hooks/useTheme';

const LANG_MAP: Record<string, { id: number; defaultCode: string }> = {
  java:   { id: 62, defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Code here\n    }\n}' },
  c:      { id: 50, defaultCode: '#include <stdio.h>\nint main() {\n    // Code here\n    return 0;\n}' },
  python: { id: 71, defaultCode: '# Code here\n' },
};

const ChallengePage = () => {
  const { id, lang = 'java' } = useParams<{ id: string; lang: string }>();
  useOutletContext<{ lang: string }>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const cfg = LANG_MAP[lang] ?? LANG_MAP.java;
  const [code, setCode] = useState(cfg.defaultCode);
  const [result, setResult] = useState<RunCodeResponse | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => learnApi.getLesson(id!),
    enabled: !!id,
  });

  const runMutation = useMutation({
    mutationFn: () => learnApi.runCode(code, cfg.id),
    onSuccess: setResult,
  });

  const submitMutation = useMutation({
    mutationFn: () => learnApi.submitChallenge(id!, code, cfg.id),
    onSuccess: (res) => {
      setResult(res);
      if (res.passed) {
        queryClient.invalidateQueries({ queryKey: ['chapters'] });
        queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      }
    },
  });

  const isBusy = runMutation.isPending || submitMutation.isPending;
  const output = formatCompilerOutput(result);
  const hasError = result && !result.passed;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    applyDiagnostics(result, editorRef.current, monacoRef.current);
  }, [result]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/learn/${lang}/lesson/${id}`} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          <h1 className="text-lg font-bold text-white">{lesson?.title ?? 'Challenge'}</h1>
        </div>
      </div>

      {/* Challenge description */}
      {lesson?.challengeDescription && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-5 text-sm text-slate-300">
          <span className="font-semibold text-yellow-300 block mb-1">Yêu cầu:</span>
          {lesson.challengeDescription}
        </div>
      )}

      {/* Passed badge */}
      {lesson?.challengePassed && (
        <div className="flex items-center gap-2 mb-4 text-sm text-green-400">
          <CheckCircle size={14} /> Challenge đã được giải quyết!
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 shrink-0">
          <span className="text-xs text-slate-400 uppercase tracking-wider">{lang}</span>
          <div className="flex items-center gap-2">
            {runMutation.isPending && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Loader2 size={12} className="animate-spin" />
                Đang kiểm tra
              </span>
            )}
            <button
              onClick={() => runMutation.mutate()}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {runMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Chạy thử
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {submitMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit
            </button>
          </div>
        </div>

        <Editor
          height="380px"
          language={lang === 'c' ? 'cpp' : lang}
          value={code}
          onChange={v => setCode(v ?? '')}
          onMount={handleEditorMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
        />

        {/* Output */}
        {result && (
          <div className="border-t border-white/10 p-4 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              {result.passed
                ? <><CheckCircle size={14} className="text-green-400" /><span className="text-xs text-green-400 font-medium">Passed!</span></>
                : <><XCircle size={14} className="text-red-400" /><span className="text-xs text-red-400">{result.status}</span></>
              }
              {result.time && <span className="text-xs text-slate-500">· {result.time}s</span>}
            </div>
            <pre className={`text-sm font-mono whitespace-pre-wrap rounded-lg p-3 max-h-40 overflow-y-auto ${hasError ? 'bg-red-950/30 text-red-100' : 'bg-black/30 text-slate-200'}`}>
              {output}
            </pre>
          </div>
        )}
      </div>
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

export default ChallengePage;
