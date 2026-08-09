import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  @Get('health/ready')
  async getReadiness() {
    const health = await this.appService.getHealth();
    if (health.database !== 'connected') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
