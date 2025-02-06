import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'

export default class SwaggerController {
  public async parse({ request, response }: HttpContextContract) {
    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger)

    return response.created(result)
  }
}
