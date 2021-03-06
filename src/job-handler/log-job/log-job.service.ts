import { Injectable } from '@nestjs/common';
import { LogConfiguration } from '@nqframework/models';
import { BaseJobService } from '../base-job/base-job.service';

@Injectable()
export class LogJobService extends BaseJobService {
  ExecuteJob(config: LogConfiguration): { message: string } {
    console.log(config.message);
    return { message: config.message };
  }
}
