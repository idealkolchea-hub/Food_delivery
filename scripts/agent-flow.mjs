import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const logPath = path.join(repoRoot, 'agent-flow', 'records.jsonl');
const gatesDir = path.join(repoRoot, 'agent-flow', 'gates');
const latestGatePath = path.join(gatesDir, 'latest.json');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = rest[index + 1];
    options[key] = value;
    index += 1;
  }

  return { command, options };
}

function readEntries() {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function appendEntry(options) {
  const required = ['phase', 'actor', 'problem', 'hypothesis', 'change', 'result', 'status'];
  const missing = required.filter((field) => !options[field]);

  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  const entry = {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    phase: options.phase,
    actor: options.actor,
    problem: options.problem,
    hypothesis: options.hypothesis,
    change: options.change,
    result: options.result,
    status: options.status,
  };

  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
  console.log(`Recorded ${entry.actor} entry for ${entry.phase}.`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'pipe',
      shell: false,
      env: process.env,
    });

    let output = '';

    const onData = (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('close', (code) => {
      resolve({
        command: [command, ...args].join(' '),
        code: code ?? 1,
        durationMs: Date.now() - startedAt,
        ok: code === 0,
        output,
      });
    });
  });
}

async function runGate() {
  ensureDir(gatesDir);

  const checks = [
    ['npm', ['run', 'build']],
    ['npx', ['playwright', 'test', 'tests/customer-flow.spec.ts']],
    ['npx', ['playwright', 'test', 'tests/restaurant-flow.spec.ts']],
  ];

  const results = [];

  for (const [command, args] of checks) {
    const result = await runCommand(command, args);
    results.push(result);
    if (!result.ok) {
      break;
    }
  }

  const artifact = {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    ok: results.every((entry) => entry.ok) && results.length === checks.length,
    results,
  };

  const filename = `${artifact.timestamp.replace(/[:.]/g, '-').replace('T', '_')}.json`;
  fs.writeFileSync(path.join(gatesDir, filename), `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(latestGatePath, `${JSON.stringify(artifact, null, 2)}\n`);

  console.log(`Saved gate artifact to agent-flow/gates/${filename}`);

  if (!artifact.ok) {
    process.exitCode = 1;
  }
}

function printSummary() {
  const entries = readEntries();

  if (!entries.length) {
    console.log('No Agent Flow records found.');
    return;
  }

  const lines = entries.map((entry, index) => (
    `${index + 1}. [${entry.phase}] ${entry.actor} - ${entry.status}\n` +
    `   problem: ${entry.problem}\n` +
    `   hypothesis: ${entry.hypothesis}\n` +
    `   change: ${entry.change}\n` +
    `   result: ${entry.result}`
  ));

  console.log(lines.join('\n'));
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === 'record') {
    appendEntry(options);
  } else if (command === 'summary') {
    printSummary();
  } else if (command === 'gate') {
    await runGate();
  } else {
    console.log('Usage: node scripts/agent-flow.mjs <record|summary|gate> [--field value]');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message || 'Agent Flow command failed.');
  process.exitCode = 1;
}
