import { Global, Module } from '@nestjs/common';
import { ClaudeRunnerService } from './services/claude-runner.service';

@Global()
@Module({
  providers: [ClaudeRunnerService],
  exports: [ClaudeRunnerService],
})
export class IACoreModule {}
