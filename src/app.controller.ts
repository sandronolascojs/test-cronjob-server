import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'

@Controller()
export class AppController {
  constructor() {}

  @HttpCode(HttpStatus.OK)
  @Get('health')
  getHello(): string {
    return 'Ok'
  }
}
