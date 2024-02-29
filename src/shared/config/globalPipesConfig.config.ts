import { ValidationPipe } from '@nestjs/common'

export const globalPipesConfig = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
})
