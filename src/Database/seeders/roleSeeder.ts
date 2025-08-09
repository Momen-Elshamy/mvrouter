import Connection from '../Connection';
import Role from '../Models/Role';

export class RoleSeeder {
  static async seed() {
    try {
      console.log('🌱 Starting role seeding...');
      
      // Connect to database
      await Connection.getInstance().connect();

      // Check if roles already exist
      const existingRoles = await Role.find();
      
      if (existingRoles.length === 0) {
        // Create default roles
        const roles = await Role.create([
          {
            name: 'user',
            description: 'Regular user with basic permissions',
          },
          {
            name: 'admin',
            description: 'Administrator with full permissions',
          },
        ]);
        
        console.log('✅ Default roles created successfully:');
        roles.forEach(role => {
          console.log(`  - ${role.name}: ${role.description}`);
        });
      } else {
        console.log('ℹ️ Roles already exist, skipping seeding');
        existingRoles.forEach(role => {
          console.log(`  - ${role.name}: ${role.description}`);
        });
      }
    } catch (error) {
      console.error('❌ Error seeding roles:', error);
      throw error;
    }
  }

  static async run() {
    await this.seed();
  }
}

// Run if called directly
if (require.main === module) {
  RoleSeeder.run()
    .then(() => {
      console.log('✅ Role seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Role seeding failed:', error);
      process.exit(1);
    });
} 