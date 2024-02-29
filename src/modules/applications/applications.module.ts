import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { ApplicationsService } from './applications.service'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [],
  providers: [ApplicationsService, PrismaService],
})
export class ApplicationsModule {}
