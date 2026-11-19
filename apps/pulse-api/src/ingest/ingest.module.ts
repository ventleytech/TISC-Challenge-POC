import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  providers: [IngestService, KafkaConsumerService],
  exports: [IngestService],
})
export class IngestModule {}
