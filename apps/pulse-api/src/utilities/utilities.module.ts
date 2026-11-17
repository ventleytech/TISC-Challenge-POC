import { Module } from '@nestjs/common';
import { UtilitiesController } from './utilities.controller';

@Module({
  controllers: [UtilitiesController],
})
export class UtilitiesModule {}
