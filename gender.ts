import { prismaClient } from './Services/database.service'

prismaClient.prisma.photos.findMany({}).then(response => { console.log('response', response) }).catch(e => { console.log(e) })

// .userRoles.create({ data: { role: 'WRITER' } }).then(e => { console.log(e) }).catch(e => { console.log(e) })
