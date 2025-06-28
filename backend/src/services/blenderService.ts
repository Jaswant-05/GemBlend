// BlenderService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface BlenderResult {
  success: boolean;
  projectId: string;
  blendFile?: string;
  previewImage?: string;
  error?: string;
  executionTime?: number;
}

export class BlenderService {
  private execAsync = promisify(exec);
  private outputDir: string;
  private timeout: number;

  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this.timeout = parseInt(process.env.BLENDER_TIMEOUT || '30000');
    console.log(`🔧 BlenderService initialized:`);
    console.log(`   Output directory: ${this.outputDir}`);
    console.log(`   Timeout: ${this.timeout}ms`);
  }

  async executeScript(scriptContent: string): Promise<BlenderResult> {
    const projectId = uuidv4();
    const startTime = Date.now();

    try {
      const projectDir = path.join(this.outputDir, projectId);
      await fs.mkdir(projectDir, { recursive: true });

      const fullScript = this.buildScript(scriptContent, projectDir);
      const scriptPath = path.join(projectDir, 'script.py');
      await fs.writeFile(scriptPath, fullScript);

      const command = `blender --background --python "${scriptPath}"`;
      console.log(`▶️ Executing Blender for project ${projectId}`);
      
      const { stdout, stderr } = await this.execAsync(command, { timeout: this.timeout });
      
      if (stdout) console.log('Blender stdout:', stdout);
      if (stderr) console.log('Blender stderr:', stderr);

      // Clean up script file
      await fs.unlink(scriptPath);

      const blendFile = path.join(projectDir, 'scene.blend');
      const previewImage = path.join(projectDir, 'preview.png');

      const [blendExists, imageExists] = await Promise.allSettled([
        fs.access(blendFile),
        fs.access(previewImage)
      ]);

      if (blendExists.status === 'fulfilled' && imageExists.status === 'fulfilled') {
        console.log(`✅ SUCCESS: Project ${projectId} completed`);
        return {
          success: true,
          projectId,
          blendFile: `/output/${projectId}/scene.blend`,
          previewImage: `/output/${projectId}/preview.png`,
          executionTime: Date.now() - startTime
        };
      }

      const missingFiles = [];
      if (blendExists.status === 'rejected') missingFiles.push('scene.blend');
      if (imageExists.status === 'rejected') missingFiles.push('preview.png');

      return {
        success: false,
        projectId,
        error: `Missing output files: ${missingFiles.join(', ')}`,
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      console.error(`❌ Blender execution failed for ${projectId}:`, error);
      return {
        success: false,
        projectId,
        error: error.code === 'ETIMEDOUT' ? 'Execution timed out' : error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  private buildScript(userScript: string, outputDir: string): string {
    const blendPath = path.join(outputDir, 'scene.blend').replace(/\\/g, '/');
    const renderPath = path.join(outputDir, 'preview.png').replace(/\\/g, '/');

    // Remove any existing import bpy from user script to avoid duplicates
    const cleanUserScript = userScript.replace(/^\s*import\s+bpy\s*$/gm, '').trim();

    return `import bpy
import os
import math
import random

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Clear data blocks
for mesh in bpy.data.meshes:
    bpy.data.meshes.remove(mesh)
for material in bpy.data.materials:
    bpy.data.materials.remove(material)

# Execute user script
${cleanUserScript}

# Add camera if none exists
if not any(obj.type == 'CAMERA' for obj in bpy.data.objects):
    bpy.ops.object.camera_add(location=(7, -7, 5))
    camera = bpy.context.active_object
    camera.rotation_euler = (1.1, 0, 0.785)

# Add light if none exists
if not any(obj.type == 'LIGHT' for obj in bpy.data.objects):
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    light = bpy.context.active_object
    light.data.energy = 3

# Set active camera
for obj in bpy.data.objects:
    if obj.type == 'CAMERA':
        bpy.context.scene.camera = obj
        break

# Save blend file
bpy.ops.wm.save_as_mainfile(filepath="${blendPath}")

# Configure render settings
scene = bpy.context.scene
scene.render.filepath = "${renderPath}"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.image_settings.file_format = 'PNG'

# Render scene
bpy.ops.render.render(write_still=True)
`;
  }

  async testBlender(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await this.execAsync('blender --version', { timeout: 10000 });
      return {
        success: true,
        version: stdout.split('\n')[0]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}