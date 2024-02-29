import { Module } from '@nestjs/common'

import { ShiftsService } from './shifts.service'

import { PrismaService } from 'src/shared/services/prisma.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [],
  providers: [ShiftsService, PrismaService],
})
export class ShiftsModule {}
