import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WhatsappMessageSenderCronJob } from 'src/modules/whatsapp-message/crons/jobs/whatsapp-message-sender.cron.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity], 'core'),
  ],
  providers: [WhatsappMessageSenderCronJob],
  exports: [WhatsappMessageSenderCronJob],
})
export class WhatsappMessageModule {}
