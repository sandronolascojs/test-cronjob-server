import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { HttpService } from '@nestjs/axios'

import { PrismaService } from 'src/shared/services/prisma.service'
import { EmailType } from 'src/shared/types/enums/emailType.enum'

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  @Cron('0 */5 * * * *')
  async removeExpiredShifts() {
    const shifts = await this.getShiftsToExpire()
    if (shifts.length > 0) {
      const shiftsToDelete = shifts.map((shift) => shift.id)

      const metadataFacilities = shifts.map((shift) => {
        return {
          email: shift.facility.user.email,
          facilityName: shift.facility.name,
          shiftDate: shift.shiftDate.toISOString().split('T')[0],
          shiftTime: shift.shiftTime,
        }
      })

      const metadataApplicants: Array<{
        email: string
        facilityName: string
        shiftDate: string
        shiftTime: string
      }> = []

      for (const shift of shifts) {
        if (shift.applications.length > 0) {
          for (const application of shift.applications) {
            metadataApplicants.push({
              email: application.applicant.user.email,
              facilityName: shift.facility.name,
              shiftDate: shift.shiftDate.toISOString().split('T')[0],
              shiftTime: shift.shiftTime,
            })
          }
        }
      }

      await this.removeShifts(shiftsToDelete).then(() => {
        this.httpService
          .post(
            `${process.env.EMAIL_SERVICE_URL}/send-shift-expired`,
            {
              type: EmailType.SHIFT_EXPIRED,
              providers: metadataApplicants,
              facilities: metadataFacilities,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .subscribe()
      })
    }
    this.logger.log(`Removed ${shifts.length} expired shifts`)
  }

  private async getShiftsToExpire() {
    const now = new Date()
    const shifts = await this.prismaService.shift.findMany({
      where: {
        hiredProviderId: null,
        archived: false,
        status: 'Pending',
        shiftDate: {
          lt: now,
        },
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

  private async removeShifts(shiftsToDelete: string[]) {
    await this.prismaService.$transaction([
      this.prismaService.shift.updateMany({
        where: {
          id: {
            in: shiftsToDelete,
          },
        },
        data: {
          archived: true,
          status: 'Canceled',
        },
      }),
    ])
  }
}
