import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
//import { swaggerMock } from 'App/SwaggerParser/mocks'

export default class SwaggerController {
  public async parse({ request, response }: HttpContextContract) {
    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger)
    //const resultMock = swaggerMock()

    return response.created(result)
  }
}
