import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { HttpService } from '@nestjs/axios'

import { PrismaService } from 'src/shared/services/prisma.service'
import { env } from 'src/shared/config/env.config'
import { EmailType } from 'src/shared/types/enums/emailType.enum'
import { FOURTY_EIGHT_HOURS } from 'src/shared/types/constants/time.constants'

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  @Cron('0 */3 * * * *')
  async removeExpiredApplications() {
    const applications = await this.getApplicationsToExpire()

    if (applications.length > 0) {
      const applicationsToDelete = applications.map(
        (application) => application.id,
      )

      const metadataProviders = applications.map((application) => {
        return {
          email: application.applicant.user.email,
          facilityName: application.shift.facility.name,
          shiftDate: application.shift.shiftDate.toISOString().split('T')[0],
          shiftTime: application.shift.shiftTime,
          shiftUrl: `${env.FRONTEND_URL}/shift/${application.shift.id}`,
        }
      })

      const metadataFacilities = applications.map((application) => {
        return {
          email: application.shift.facility.user.email,
          facilityName: application.shift.facility.name,
          providerName: application.applicantName,
          shiftDate: application.shift.shiftDate.toISOString().split('T')[0],
          shiftTime: application.shift.shiftTime,
        }
      })

      await this.deleteApplicationsAndDisconnect(applicationsToDelete).then(
        () => {
          this.httpService
            .post(
              `${env.EMAIL_SERVICE_URL}/send-application-expired`,
              {
                type: EmailType.SHIFT_APPLICATION_EXPIRED,
                providers: metadataProviders,
                facilities: metadataFacilities,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            )
            .subscribe()
        },
      )
    }
    this.logger.log(`Deleted ${applications.length} applications expired`)
  }

  private async deleteApplicationsAndDisconnect(
    applicationsToDelete: string[],
  ) {
    const applications = await this.prismaService.application.findMany({
      where: {
        id: {
          in: applicationsToDelete,
        },
      },
      select: {
        shiftId: true,
        applicantId: true,
      },
    })

    const uniqueShiftIds = [...new Set(applications.map((app) => app.shiftId))]
    const uniqueProviderIds = [
      ...new Set(applications.map((app) => app.applicantId)),
    ]

    const shiftUpdates = uniqueShiftIds.map((shiftId) =>
      this.prismaService.shift.update({
        where: { id: shiftId },
        data: {
          applicants: {
            disconnect: applications
              .filter((app) => app.shiftId === shiftId)
              .map((app) => ({ id: app.applicantId })),
          },
        },
      }),
    )
    const deleteApplications = this.prismaService.application.deleteMany({
      where: {
        id: {
          in: applicationsToDelete,
        },
      },
    })
    const providerUpdates = uniqueProviderIds.map((providerId) =>
      this.prismaService.provider.update({
        where: { id: providerId },
        data: {
          shiftsApplied: {
            disconnect: applications
              .filter((app) => app.applicantId === providerId)
              .map((app) => ({ id: app.shiftId })),
          },
        },
      }),
    )

    await this.prismaService.$transaction([
      ...shiftUpdates,
      deleteApplications,
      ...providerUpdates,
    ])
  }

  private async getApplicationsToExpire() {
    const applicationsExpired = await this.prismaService.application.findMany({
      where: {
        createdAt: {
          lte: new Date(Date.now() - FOURTY_EIGHT_HOURS),
        },
        shift: {
          status: 'Pending',
          hiredProviderId: null,
          shiftDate: {
            gt: new Date(),
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
        applicantName: true,
        shift: {
          select: {
            id: true,
            shiftTime: true,
            shiftDate: true,
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
        },
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
    })

    return applicationsExpired
  }
}
