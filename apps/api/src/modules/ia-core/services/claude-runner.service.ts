import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

export interface ClaudeOptions {
  model: string;
  timeoutMs?: number;
  idleTimeoutMs?: number;
  allowedTools?: string;
}

@Injectable()
export class ClaudeRunnerService {
  private readonly logger = new Logger(ClaudeRunnerService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../../');

  /**
   * Runs Claude in text-only mode (pure reasoning).
   */
  async runText(prompt: string, options: ClaudeOptions): Promise<string> {
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
    const model = options.model;
    const allowedTools = options.allowedTools ?? 'none';

    return new Promise((resolve, reject) => {
      const args = [
        '-p', '-',
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--strict-mcp-config',
        '--model', model
      ];
      if (allowedTools) args.push('--allowedTools', allowedTools);

      this.logger.log(`Spawning claude text | model: ${model} | tools: ${allowedTools}`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdin.write(prompt, 'utf8');
      child.stdin.end();

      let stdout = '';
      let stderr = '';
      let settled = false;

      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(stdout);
      };

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Timeout ${model} after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      child.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
      child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
      child.on('close', code => {
        if (code === 0) done();
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-400)}`));
      });
      child.on('error', done);
    });
  }

  /**
   * Runs Claude in agentic mode (supports tool calling like WebSearch).
   */
  async runAgentic(prompt: string, options: ClaudeOptions): Promise<string> {
    const totalTimeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
    const idleTimeoutMs = options.idleTimeoutMs ?? 60 * 1000;
    const model = options.model;
    const allowedTools = options.allowedTools ?? 'WebSearch';

    return new Promise((resolve, reject) => {
      const args = [
        '-p', '-',
        '--output-format', 'stream-json',
        '--verbose',
        '--dangerously-skip-permissions',
        '--strict-mcp-config',
        '--model', model,
        '--allowedTools', allowedTools,
      ];

      this.logger.log(`Spawning claude agentic | model: ${model} | tools: ${allowedTools} | idle: ${idleTimeoutMs / 1000}s | total: ${totalTimeoutMs / 1000}s`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdin.write(prompt, 'utf8');
      child.stdin.end();

      let stderr = '';
      let lineBuffer = '';
      let settled = false;

      const done = (err?: Error, result?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(totalTimer);
        clearTimeout(idleTimer);
        if (err) reject(err);
        else resolve(result!);
      };

      const totalTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Total timeout ${model} after ${totalTimeoutMs / 1000}s`));
      }, totalTimeoutMs);

      let idleTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
      }, idleTimeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          child.kill('SIGTERM');
          done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
        }, idleTimeoutMs);

        lineBuffer += chunk.toString();
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'result') {
              if (event.subtype === 'success') {
                done(undefined, event.result ?? '');
              } else {
                done(new Error(`claude result error: ${JSON.stringify(event).slice(0, 200)}`));
              }
            }
          } catch { /* partial or non-JSON line */ }
        }
      });

      child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
      child.on('close', (code) => {
        if (settled) return;
        if (code === 0) done(new Error('claude closed without result event'));
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-400)}`));
      });
      child.on('error', done);
    });
  }
}
