import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DataSource, Repository } from 'typeorm';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import axios from 'axios';

export const WHATSAPP_MESSAGE_SENDER_CRON_PATTERN = '*/1 * * * *';

@Processor(MessageQueue.cronQueue)
export class WhatsappMessageSenderCronJob {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly exceptionHandlerService: ExceptionHandlerService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  @Process(WhatsappMessageSenderCronJob.name)
  @SentryCronMonitor(
    WhatsappMessageSenderCronJob.name,
    WHATSAPP_MESSAGE_SENDER_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const activeWorkspaces = await this.workspaceRepository.find({
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      },
    });

    for (const activeWorkspace of activeWorkspaces) {
      try {
        const schemaName = getWorkspaceSchemaName(activeWorkspace.id);
        const now = new Date().toISOString();

        // Using parameterized queries isn't straightforward with multiple dynamic values here
        // But since we control schemaName and dates, we safely interpolate. 
        // We'll update pending messages to 'processing'
        const [pendingMessages] = await this.coreDataSource.query(
          `UPDATE ${schemaName}."whatsappMessage" SET "status" = 'processing' 
          WHERE "status" = 'pending' AND ("scheduledAt" IS NULL OR "scheduledAt" <= '${now}')
          RETURNING *`,
        );

        if (!pendingMessages || pendingMessages.length === 0) {
          continue;
        }

        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/whatsapp';

        for (const message of pendingMessages) {
          try {
            await axios.post(n8nWebhookUrl, {
              workspaceId: activeWorkspace.id,
              messageId: message.id,
              phoneNumber: message.phoneNumber,
              messageBody: message.messageBody,
              direction: message.direction,
              personId: message.personId,
            });

            await this.coreDataSource.query(
              `UPDATE ${schemaName}."whatsappMessage" SET "status" = 'sent', "updatedAt" = '${now}' WHERE id = '${message.id}'`,
            );
          } catch (err) {
            await this.coreDataSource.query(
              `UPDATE ${schemaName}."whatsappMessage" SET "status" = 'failed', "updatedAt" = '${now}' WHERE id = '${message.id}'`,
            );
            this.exceptionHandlerService.captureExceptions([err as Error]);
          }
        }
      } catch (error) {
        if (
          error.code === '42P01' &&
          error.message.includes('whatsappMessage" does not exist')
        ) {
          // Schema doesn't have the table yet, ignore
        } else {
          this.exceptionHandlerService.captureExceptions([error as Error], {
            workspace: { id: activeWorkspace.id },
          });
        }
      }
    }
  }
}
