import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { DatabaseService } from './database.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      // Use MongoDB's native `ping` command for health checking
      const result = await this.databaseService.$runCommandRaw({ ping: 1 });

      if (result.ok === 1) {
        return this.getStatus('db', true);
      } else {
        throw new Error('Ping command failed');
      }
    } catch (e) {
      throw new HealthCheckError('Prisma check failed', e);
    }
  }
}
