import StockService from './stockService.js';

class CronService {
  static init() {
    console.log('⏰ Initializing stock management service...');
    
    const checkAndResetStock = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === 6 && currentMinute === 0) {
        console.log('🕕 Running daily stock reset...');
        StockService.resetDailyStock().catch(error => {
          console.error('❌ Daily stock reset failed:', error);
        });
      }
    };

    setInterval(checkAndResetStock, 60000); // 60000ms = 1 minute
    
    checkAndResetStock();

    setInterval(() => {
      StockService.getLowStockItems()
        .then(lowStockItems => {
          if (lowStockItems.length > 0) {
            console.log('📢 Low stock alert:', lowStockItems.map(item => 
              `${item.name}: ${item.currentStock}/${item.dailyStock}`
            ));
          }
        })
        .catch(error => {
          console.error('❌ Low stock check failed:', error);
        });
    }, 1800000); // 1800000ms = 30 minutes

    console.log('✅ Stock management service initialized');
    console.log('   - Daily stock reset: 6:00 AM');
    console.log('   - Low stock checks: Every 30 minutes');
  }
}

export default CronService;