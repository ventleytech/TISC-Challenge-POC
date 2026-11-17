import { Global, Module } from '@nestjs/common';
import { loadSettings, PulseApiSettings } from './settings';

export const PULSE_API_SETTINGS = Symbol('PULSE_API_SETTINGS');

@Global()
@Module({
  providers: [
    {
      provide: PULSE_API_SETTINGS,
      useFactory: (): PulseApiSettings => loadSettings(),
    },
  ],
  exports: [PULSE_API_SETTINGS],
})
export class SettingsModule {}
