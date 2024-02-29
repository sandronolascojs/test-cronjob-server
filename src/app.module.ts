import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { AppController } from './app.controller'

import { ApplicationsModule } from './modules/applications/applications.module'
import { ShiftsModule } from './modules/shifts/shifts.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ShiftsModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {}
