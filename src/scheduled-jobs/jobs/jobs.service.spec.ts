import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { HandlerService } from '../../job-handler/handler.service';
import { JobsService } from './jobs.service';
import { CronJob } from 'cron';
import { LoggerService } from '../../logger/logger.service';

jest.mock('cron');
describe('JobsService', () => {
  let service: JobsService;
  let registry: SchedulerRegistry;
  let handler: HandlerService;
  let module: TestingModule
  const executeHandlerMock = jest.fn();
  const executeJobMock = jest.fn();
  const errorMock = jest.fn();

  const mockExistingJobs = new Map<string, any>([
    ['test org id:1', { stop: jest.fn() }],
    ['test org id:2', { stop: jest.fn() }],
  ]);

  const mockChanges = [
    {
      name: 'existing mock job',
      organizationId: 'test org id',
      id: 1,
      active: false,
      cronInterval: '* * * * *',
    },
    {
      name: 'new mock job',
      organizationId: 'test org id',
      id: 3,
      active: true,
      configuration: { type: 'mock type' },
      cronInterval: '* * * * *',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: SchedulerRegistry,
          useValue: {
            deleteCronJob: jest.fn(),
            getCronJobs: jest.fn().mockImplementation(() => mockExistingJobs),
            addCronJob: jest.fn(),
          },
        },
        {
          provide: HandlerService,
          useValue: { executeJob: executeJobMock, getHandlerFromConfig: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { error: errorMock, setContext: jest.fn(), log: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    registry = module.get<SchedulerRegistry>(SchedulerRegistry);
    handler = module.get<HandlerService>(HandlerService);
  });

  it('should delete existing jobs from update', async () => {
    await service.deleteExistingJobs(mockChanges as any);
    expect(registry.getCronJobs).toHaveBeenCalledTimes(1);
    expect(mockExistingJobs.get('test org id:1').stop).toHaveBeenCalledTimes(1);
    expect(mockExistingJobs.get('test org id:2').stop).not.toHaveBeenCalled();
    expect(registry.deleteCronJob).toHaveBeenCalledWith('test org id:1');
  });

  it('should create jobs from changes snapshot', async () => {
    (handler.getHandlerFromConfig as jest.Mock).mockImplementation(() => ({
      ExecuteJob: executeHandlerMock,
    }));
    await service.createJobs([mockChanges[1]] as any);
    expect(handler.getHandlerFromConfig).toHaveBeenCalledTimes(1);
    expect(registry.addCronJob).toHaveBeenCalledWith(
      'test org id:3',
      expect.any(Object),
    );
    expect(CronJob).toHaveBeenCalledTimes(1);
    (CronJob as jest.Mock).mock.calls[0][1]();
    expect(handler.executeJob).toHaveBeenCalledTimes(1);
  });

  it('should handle error thrown from job', async () => {
    (handler.getHandlerFromConfig as jest.Mock).mockImplementation(() => ({
    }));
    executeJobMock.mockImplementation(() => {
      throw new Error('test error');
    });
    await service.createJobs([mockChanges[1]] as any);
    (CronJob as jest.Mock).mock.calls[0][1]();
    expect(handler.executeJob).toHaveBeenCalledTimes(1);
    expect(errorMock).toHaveBeenCalledTimes(1);
  });

  it('should not create a job if no handler is returned', async () => {
    (handler.getHandlerFromConfig as jest.Mock).mockImplementation(() => null);
    await service.createJobs([mockChanges[1]] as any);
    expect(handler.getHandlerFromConfig).toHaveBeenCalledTimes(1);
    expect(registry.addCronJob).not.toHaveBeenCalled();
    expect(CronJob).toHaveBeenCalledTimes(0);
  });
});
