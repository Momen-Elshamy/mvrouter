import { RoleSeeder } from './roleSeeder';

export class DatabaseSeeder {
  static async runAll() {
    console.log('🚀 Starting database seeding...\n');
    
    try {
      // Run role seeder
      await RoleSeeder.seed();
      
      console.log('\n✅ All seeders completed successfully');
    } catch (error) {
      console.error('\n❌ Seeding failed:', error);
      throw error;
    }
  }

  static async run() {
    await this.runAll();
  }
}

// Run if called directly
if (require.main === module) {
  DatabaseSeeder.run()
    .then(() => {
      console.log('\n🎉 Database seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database seeding failed:', error);
      process.exit(1);
    });
} 