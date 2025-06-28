import { PrismaClient } from '@prisma/client';

// Define the enum manually
enum ProjectStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING', 
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create some demo projects
  const demoProjects = [
    {
      userId: 'demo_user_1',
      userEmail: 'demo@example.com',
      prompt: 'Create a red cube',
      status: ProjectStatus.COMPLETED,
      blendFile: '/output/demo1/scene.blend',
      previewImage: '/output/demo1/preview.png',
      executionTime: 2500,
    },
    {
      userId: 'demo_user_1',
      userEmail: 'demo@example.com',
      prompt: 'Make a simple house with a red roof',
      status: ProjectStatus.COMPLETED,
      blendFile: '/output/demo2/scene.blend',
      previewImage: '/output/demo2/preview.png',
      executionTime: 4200,
    },
    {
      userId: 'demo_user_2',
      userEmail: 'test@example.com',
      prompt: 'Create 5 colorful spheres in a circle',
      status: ProjectStatus.COMPLETED,
      blendFile: '/output/demo3/scene.blend',
      previewImage: '/output/demo3/preview.png',
      executionTime: 3100,
    },
    {
      userId: 'demo_user_2',
      userEmail: 'test@example.com',
      prompt: 'Build a medieval castle with towers',
      status: ProjectStatus.COMPLETED,
      blendFile: '/output/demo4/scene.blend',
      previewImage: '/output/demo4/preview.png',
      executionTime: 5800,
    },
    {
      userId: 'demo_user_3',
      userEmail: 'artist@example.com',
      prompt: 'Create a futuristic car with chrome details',
      status: ProjectStatus.COMPLETED,
      blendFile: '/output/demo5/scene.blend',
      previewImage: '/output/demo5/preview.png',
      executionTime: 7200,
    },
  ];

  for (const project of demoProjects) {
    await prisma.project.create({
      data: project,
    });
  }

  console.log(`✅ Created ${demoProjects.length} demo projects`);
  console.log('📊 Demo data includes:');
  console.log('   - Red cube example');
  console.log('   - Simple house');
  console.log('   - Colorful spheres');
  console.log('   - Medieval castle');
  console.log('   - Futuristic car');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });