import { Module } from '@nestjs/common';
import { RequestRouterService } from './request-router/request-router.service';
import { ConnectorGateway } from './gateway/connector.gateway';
import { ConnectorServerService } from './connector-server/connector-server.service';
import { LoggerModule } from '../logger/logger.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { Organization } from '../organization/organization.module';

@Module({
  imports: [LoggerModule, AnalyticsModule, Organization],
  providers: [RequestRouterService, ConnectorGateway, ConnectorServerService],
  exports: [RequestRouterService],
})
export class DbConnectionModule {}
