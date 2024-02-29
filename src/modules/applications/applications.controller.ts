import { Controller, Get } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getApplications() {
    const now = new Date()
    const shifts = await this.prismaService.shift.findMany({
      where: {
        hiredProviderId: null,
        archived: false,
        status: 'Pending',
      },
      select: {
        id: true,
        shiftDate: true,
        shiftTime: true,
        applications: {
          select: {
            applicant: {
              select: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
        facility: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    })

    return shifts
  }
}
