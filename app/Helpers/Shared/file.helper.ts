import Response from 'App/Models/Response'
import Drive from '@ioc:Adonis/Core/Drive'

export async function deleteIfOnceUsed(location: string, fileName: string) {
  const amountUsed =
    (
      await Response.query().where('body', fileName).andWhere('is_file', true).count('* as total')
    )[0].$extras.total - 1
  if (!amountUsed) await Drive.delete(`${location}/${fileName}`)
}

export function getFileName(path: string) {
  return path.split('/').at(-1)!
}
