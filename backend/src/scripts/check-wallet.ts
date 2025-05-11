import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { WalletMonitorService } from '../common/wallet-monitor.service'

async function main() {
    // Создаём контекст приложения, но не поднимаем HTTP-сервер
    const app = await NestFactory.createApplicationContext(AppModule)
    const walletService = app.get(WalletMonitorService)

    console.log('▶️  Manual wallet journal check started')
    await walletService.checkWalletJournal()
    console.log('✅  Done.')

    await app.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
