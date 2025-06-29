import { PrismaClient, ProjectStatus } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('Database connected');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  // Create new project
  async createProject(data: {
    userId: string;
    userEmail?: string;
    prompt: string;
  }) {
    return await this.prisma.project.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        prompt: data.prompt,
        status: ProjectStatus.PENDING,
      },
    });
  }

  // Update project with script
  async updateProjectScript(projectId: string, script: string) {
    return await this.prisma.project.update({
      where: { id: projectId },
      data: {
        script,
        status: ProjectStatus.GENERATING,
      },
    });
  }

  // Update project with results
  async updateProjectResult(projectId: string, data: {
    status: ProjectStatus;
    blendFile?: string;
    previewImage?: string;
    executionTime?: number;
    errorMessage?: string;
  }) {
    return await this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  // Get project by ID
  async getProject(projectId: string) {
    return await this.prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  // Get user's projects
  async getUserProjects(userId: string, limit = 20) {
    return await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        prompt: true,
        status: true,
        blendFile: true,
        previewImage: true,
        createdAt: true,
        executionTime: true,
      },
    });
  }

  // Delete project
  async deleteProject(projectId: string, userId: string) {
    return await this.prisma.project.deleteMany({
      where: {
        id: projectId,
        userId: userId, // Ensure user owns the project
      },
    });
  }

  // Get all projects (for admin/demo)
  async getAllProjects(limit = 50) {
    return await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        prompt: true,
        status: true,
        blendFile: true,
        previewImage: true,
        createdAt: true,
        executionTime: true,
        userEmail: true, // Show email for demo purposes
      },
    });
  }

  // Simple stats for demo
  async getStats() {
    const [total, completed, failed] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.prisma.project.count({ where: { status: ProjectStatus.FAILED } }),
    ]);

    return {
      totalProjects: total,
      completedProjects: completed,
      failedProjects: failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

// Export singleton instance
export const db = new DatabaseService();
export { ProjectStatus };