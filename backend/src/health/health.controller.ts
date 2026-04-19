import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { Public } from '../iam/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check that the process is not using more than 150MB of memory heap
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Check that the process is not using more than 300MB of total RSS memory
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }
}