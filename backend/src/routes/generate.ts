import express, { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/geminiService';
import { BlenderService } from '../services/blenderService';
import { db, ProjectStatus } from '../services/databaseService';
import { requireAuth, getAuth } from '@clerk/express';

const generateRouter = express.Router();
const geminiService = new GeminiService();
const blenderService = new BlenderService();

interface GenerateBody {
  prompt: string;
}

interface ScriptOnlyBody {
  prompt: string;
}

/* ─────────────────────────────────────────
 POST /generate ➜ create full project
 ───────────────────────────────────────── */
generateRouter.post(
  '/',
  requireAuth(), // Add Clerk auth middleware
  async (
    req: Request<{}, any, GenerateBody>,
    res: Response,
    _next: NextFunction
  ) => {
    try {
      const { prompt } = req.body;
      
      // Get user info from Clerk auth
      const { userId } = getAuth(req);
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - no user ID found' 
        });
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Prompt is required and must be a non-empty string' 
        });
      }

      const trimmedPrompt = prompt.trim();
      console.log(`Received generation request from ${userId}: "${trimmedPrompt}"`);

      const project = await db.createProject({
        userId,
        prompt: trimmedPrompt
      });

      try {
        const script = await geminiService.generateBlenderScript(trimmedPrompt);
        await db.updateProjectScript(project.id, script);
        
        const result = await blenderService.executeScript(script);

        if (result.success) {
          await db.updateProjectResult(project.id, {
            status: ProjectStatus.COMPLETED,
            blendFile: result.blendFile,
            previewImage: result.previewImage,
            executionTime: result.executionTime
          });

          return res.json({
            success: true,
            projectId: project.id,
            blendFile: result.blendFile,
            previewImage: result.previewImage,
            executionTime: result.executionTime,
            prompt: trimmedPrompt
          });
        } else {
          await db.updateProjectResult(project.id, {
            status: ProjectStatus.FAILED,
            errorMessage: result.error,
            executionTime: result.executionTime
          });

          return res.status(500).json({
            success: false,
            error: result.error,
            projectId: project.id
          });
        }
      } catch (err: any) {
        await db.updateProjectResult(project.id, {
          status: ProjectStatus.FAILED,
          errorMessage: err.message
        });
        throw err;
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      res.status(500).json({ 
        success: false, 
        error: err.message ?? 'Internal server error' 
      });
    }
  }
);

/* ─────────────────────────────────────────
 POST /generate/script-only ➜ return only the script
 ───────────────────────────────────────── */
generateRouter.post(
  '/script-only',
  requireAuth(), // Add Clerk auth middleware
  async (
    req: Request<{}, any, ScriptOnlyBody>,
    res: Response,
    _next: NextFunction
  ) => {
    try {
      const { prompt } = req.body;
      
      // Get user info from Clerk auth (optional for script-only)
      const { userId } = getAuth(req);
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - authentication required' 
        });
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Prompt is required' 
        });
      }

      const trimmedPrompt = prompt.trim();
      console.log(`Script generation request from ${userId}: "${trimmedPrompt}"`);
      
      const script = await geminiService.generateBlenderScript(trimmedPrompt);

      res.json({
        success: true,
        script,
        prompt: trimmedPrompt
      });
    } catch (err: any) {
      console.error('Script generation error:', err);
      res.status(500).json({ 
        success: false, 
        error: err.message ?? 'Failed to generate script' 
      });
    }
  }
);

export { generateRouter };