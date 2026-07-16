-- Phase 3.1 - Exam problem domain and seed data.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'problems' AND column_name = 'time_limit'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'problems' AND column_name = 'time_limit_ms'
    ) THEN
        ALTER TABLE problems RENAME COLUMN time_limit TO time_limit_ms;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'problems' AND column_name = 'memory_limit'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'problems' AND column_name = 'memory_limit_kb'
    ) THEN
        ALTER TABLE problems RENAME COLUMN memory_limit TO memory_limit_kb;
    END IF;
END $$;

ALTER TABLE problems
    ADD COLUMN IF NOT EXISTS solution_code TEXT,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE problems
    ALTER COLUMN time_limit_ms SET DEFAULT 2000,
    ALTER COLUMN memory_limit_kb SET DEFAULT 256000;

UPDATE problems
SET memory_limit_kb = memory_limit_kb * 1000
WHERE memory_limit_kb > 0 AND memory_limit_kb < 1024;

CREATE INDEX IF NOT EXISTS idx_problems_public_filters
    ON problems(is_published, difficulty, topic, title);

INSERT INTO problems (
    id, title, description, difficulty, topic, test_cases,
    time_limit_ms, memory_limit_kb, solution_code, is_published, created_at, updated_at
)
VALUES
(
    '11111111-1111-4111-8111-111111111101',
    'Hello Arena',
    'Viết chương trình in ra chính xác chuỗi "Hello Arena".',
    'EASY',
    'basic',
    '{"cases":[{"input":"","expected":"Hello Arena\n"}]}',
    1000,
    128000,
    'print("Hello Arena")',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111102',
    'Tong hai so',
    'Cho hai số nguyên a và b trên cùng một dòng. In ra tổng của chúng.',
    'EASY',
    'math',
    '{"cases":[{"input":"2 3\n","expected":"5\n"},{"input":"-4 10\n","expected":"6\n"},{"input":"0 0\n","expected":"0\n"}]}',
    1000,
    128000,
    'a, b = map(int, input().split()); print(a + b)',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111103',
    'So chan hay le',
    'Cho một số nguyên n. In EVEN nếu n chẵn, ngược lại in ODD.',
    'EASY',
    'condition',
    '{"cases":[{"input":"4\n","expected":"EVEN\n"},{"input":"7\n","expected":"ODD\n"},{"input":"0\n","expected":"EVEN\n"}]}',
    1000,
    128000,
    'n = int(input()); print("EVEN" if n % 2 == 0 else "ODD")',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111104',
    'Max trong mang',
    'Cho n và n số nguyên. In ra giá trị lớn nhất.',
    'EASY',
    'array',
    '{"cases":[{"input":"5\n1 9 3 2 7\n","expected":"9\n"},{"input":"3\n-5 -2 -9\n","expected":"-2\n"}]}',
    1000,
    128000,
    'input(); print(max(map(int, input().split())))',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111105',
    'Dao nguoc chuoi',
    'Cho một chuỗi không chứa xuống dòng. In ra chuỗi đảo ngược.',
    'MEDIUM',
    'string',
    '{"cases":[{"input":"arena\n","expected":"anera\n"},{"input":"abcde\n","expected":"edcba\n"},{"input":"a\n","expected":"a\n"}]}',
    1000,
    128000,
    's = input(); print(s[::-1])',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111106',
    'Dem tan suat',
    'Cho n và n số nguyên. In mỗi giá trị khác nhau cùng số lần xuất hiện theo thứ tự tăng dần.',
    'MEDIUM',
    'map',
    '{"cases":[{"input":"6\n1 2 1 3 2 1\n","expected":"1 3\n2 2\n3 1\n"},{"input":"4\n5 5 5 5\n","expected":"5 4\n"}]}',
    2000,
    256000,
    'from collections import Counter\ninput(); c = Counter(map(int, input().split()))\nfor k in sorted(c): print(k, c[k])',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111107',
    'Fibonacci modulo',
    'Cho n. In F(n) modulo 1000000007, với F(0)=0, F(1)=1.',
    'MEDIUM',
    'dynamic-programming',
    '{"cases":[{"input":"0\n","expected":"0\n"},{"input":"7\n","expected":"13\n"},{"input":"50\n","expected":"586268941\n"}]}',
    2000,
    256000,
    'MOD=1000000007\nn=int(input())\na,b=0,1\nfor _ in range(n): a,b=b,(a+b)%MOD\nprint(a)',
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-4111-8111-111111111108',
    'Duong di ngan nhat',
    'Cho đồ thị vô hướng không trọng số n đỉnh, m cạnh và hai đỉnh s, t. In độ dài đường đi ngắn nhất từ s tới t, hoặc -1 nếu không có đường đi.',
    'HARD',
    'graph',
    '{"cases":[{"input":"4 3 1 4\n1 2\n2 3\n3 4\n","expected":"3\n"},{"input":"4 2 1 4\n1 2\n2 3\n","expected":"-1\n"}]}',
    3000,
    256000,
    'from collections import deque\nn,m,s,t=map(int,input().split())\ng=[[] for _ in range(n+1)]\nfor _ in range(m):\n a,b=map(int,input().split()); g[a].append(b); g[b].append(a)\nd=[-1]*(n+1); d[s]=0; q=deque([s])\nwhile q:\n u=q.popleft()\n for v in g[u]:\n  if d[v]<0: d[v]=d[u]+1; q.append(v)\nprint(d[t])',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    topic = EXCLUDED.topic,
    test_cases = EXCLUDED.test_cases,
    time_limit_ms = EXCLUDED.time_limit_ms,
    memory_limit_kb = EXCLUDED.memory_limit_kb,
    solution_code = EXCLUDED.solution_code,
    is_published = EXCLUDED.is_published,
    updated_at = NOW();
