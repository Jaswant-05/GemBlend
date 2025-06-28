import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../services/databaseService';

const projectsRouter = express.Router();

type ListProjectsQuery = { userId?: string; limit?: string };
type UserQuery = { userId?: string };

/* ─────────────────────────────────────────
   Admin Routes
   ───────────────────────────────────────── */

projectsRouter.get(
  '/admin/all',
  async (
    req: Request<{}, any, any, { limit?: string }>,
    res: Response
  ) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const projects = await db.getAllProjects(limit);

      res.json({ success: true, projects, total: projects.length });
    } catch (error: any) {
      console.error('Get all projects error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to get projects' });
    }
  }
);

projectsRouter.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message ?? 'Failed to get stats' });
  }
});

/* ─────────────────────────────────────────
   User Project Routes
   ───────────────────────────────────────── */

projectsRouter.get(
  '/',
  async (
    req: Request<{}, any, any, ListProjectsQuery>,
    res: Response
  ) => {
    try {
      const { userId, limit } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

      const projectLimit = limit ? parseInt(limit, 10) : 20;
      const projects = await db.getUserProjects(userId, projectLimit);

      res.json({ success: true, projects, total: projects.length });
    } catch (error: any) {
      console.error('Get projects error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to get projects' });
    }
  }
);

projectsRouter.get(
  '/:projectId',
  async (
    req: Request<{ projectId: string }, any, any, UserQuery>,
    res: Response
  ) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

      const project = await db.getProject(projectId);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (project.userId !== userId) return res.status(403).json({ success: false, error: 'Access denied' });

      res.json({ success: true, project });
    } catch (error: any) {
      console.error('Get project error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to get project' });
    }
  }
);

projectsRouter.get(
  '/:projectId/download/:fileType',
  async (
    req: Request<{ projectId: string; fileType: string }, any, any, UserQuery>,
    res: Response
  ) => {
    try {
      const { projectId, fileType } = req.params;
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

      if (!['blend', 'image'].includes(fileType)) {
        return res.status(400).json({ success: false, error: 'Invalid file type. Use "blend" or "image"' });
      }

      const project = await db.getProject(projectId);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (project.userId !== userId) return res.status(403).json({ success: false, error: 'Access denied' });

      const filePath = fileType === 'blend' ? project.blendFile : project.previewImage;
      if (!filePath) {
        return res.status(404).json({ success: false, error: `${fileType} file not available for this project` });
      }

      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      await fs.access(fullPath); // Check existence

      const filename = path.basename(fullPath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', fileType === 'blend' ? 'application/octet-stream' : 'image/png');
      res.sendFile(fullPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'File not found on disk' });
      }
      console.error('Download error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Download failed' });
    }
  }
);

projectsRouter.delete(
  '/:projectId',
  async (
    req: Request<{ projectId: string }>,
    res: Response
  ) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.body as { userId?: string };
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

      const result = await db.deleteProject(projectId, userId);
      if (result.count === 0) {
        return res.status(404).json({ success: false, error: 'Project not found or access denied' });
      }

      try {
        const projectDir = path.join(process.env.OUTPUT_DIR ?? './output', projectId);
        await fs.rm(projectDir, { recursive: true, force: true });
      } catch (e) {
        console.warn(`Warning: Failed to delete project files for ${projectId}:`, e);
      }

      res.json({ success: true, message: `Project ${projectId} deleted` });
    } catch (error: any) {
      console.error('Delete project error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to delete project' });
    }
  }
);

export { projectsRouter };
