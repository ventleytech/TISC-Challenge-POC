import { Module } from '@nestjs/common';
import { InspectionsController } from './inspections.controller';

@Module({
  controllers: [InspectionsController],
})
export class InspectionsModule {}
