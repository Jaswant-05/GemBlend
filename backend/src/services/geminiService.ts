// GeminiService.ts
import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
    console.log('🤖 GeminiService initialized');
  }

  async generateBlenderScript(prompt: string): Promise<string> {
    try {
      const enhancedPrompt = this.buildPrompt(prompt);
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: enhancedPrompt
      });

      const rawScript = response.text?.trim();
      if (!rawScript || typeof rawScript !== 'string') {
        throw new Error('Empty or invalid script returned by Gemini');
      }

      const cleaned = this.cleanScript(rawScript);
      if (!cleaned) {
        throw new Error('Script is empty after cleaning');
      }

      return cleaned;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private buildPrompt(userPrompt: string): string {
    return `You are an expert Blender Python scripter. Generate a Blender Python script for: "${userPrompt}"

CRITICAL REQUIREMENTS:
- Use ONLY bpy module (Blender Python API)
- Create 3D objects using ONLY these primitives:
- Position objects using location=(x, y, z)
- Scale objects using obj.scale = (x, y, z)
- Add materials using:
  mat = bpy.data.materials.new(name="MaterialName")
  mat.use_nodes = True
  bsdf = mat.node_tree.nodes.get('Principled BSDF')
  bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
  obj.data.materials.append(mat)

FORBIDDEN:
- NO file operations (save, render, import)
- NO scene clearing (select_all, delete)
- NO camera or light creation
- NO modifiers, animations, or mesh editing

OUTPUT FORMAT:
- Return ONLY Python code
- NO markdown fences ()
- NO explanations or text
- Start with: import bpy
- Include brief comments in code

Generate the script now:`;
  }

  private cleanScript(content: string): string {
    // Remove markdown code blocks
    content = content.replace(/```python\s*/g, '');
    content = content.replace(/```\s*/g, '');
    
    // Remove any text that isn't Python code
    const lines = content.split('\n');
    let cleanedLines = [];
    let foundImport = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Start collecting lines after we find import bpy
      if (trimmed.startsWith('import bpy')) {
        foundImport = true;
      }
      
      // Skip lines before import bpy
      if (!foundImport) {
        continue;
      }
      
      // Filter out forbidden operations
      const forbiddenPatterns = [
        'bpy.ops.wm.save_as_mainfile',
        'bpy.ops.render.render',
        'bpy.context.scene.render.filepath',
        'bpy.ops.object.select_all',
        'bpy.ops.object.delete',
        'bpy.ops.wm.open_mainfile',
        'bpy.data.filepath',
        'scene.render.filepath'
      ];
      
      const hasForbidden = forbiddenPatterns.some(pattern => trimmed.includes(pattern));
      if (hasForbidden) {
        continue;
      }
      
      cleanedLines.push(line);
    }
    
    return cleanedLines.join('\n').trim();
  }

  async testAPI(): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: 'Say "API test successful" in exactly those words.'
      });
      
      const result = response.text?.trim();
      if (!result || !result.includes('API test successful')) {
        return { success: false, error: `Unexpected response: ${result}` };
      }
      
      return { success: true, model: 'gemini-2.5-pro' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}