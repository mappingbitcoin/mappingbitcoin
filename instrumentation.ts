export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { startBitcoinVenueCron } = await import('@/utils/sync/CronJob');
        startBitcoinVenueCron();
    }
}
