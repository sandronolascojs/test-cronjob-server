import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import helmet from 'helmet'

import { AppModule } from './app.module'

import { globalPipesConfig } from './shared/config/globalPipesConfig.config'
import { corsConfig } from './shared/config/cors.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const port = process.env.PORT || 3000

  app.setGlobalPrefix('api')
  app.useGlobalPipes(globalPipesConfig)
  app.use(helmet())
  app.enableCors(corsConfig)

  await app.listen(port)
  const url = await app.getUrl()
  Logger.log(`Server running on ${url}`, 'Bootstrap')
}
bootstrap()
