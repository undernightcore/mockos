/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import { validator } from '@ioc:Adonis/Core/Validator'

validator.rule('json', (value, _, options) => {
  try {
    JSON.parse(value)
  } catch (e) {
    options.errorReporter.report(
      options.pointer,
      'json',
      'json validation failed',
      options.arrayExpressionPointer
    )
  }
})
