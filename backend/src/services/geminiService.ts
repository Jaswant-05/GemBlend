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

CRITICAL: Use ONLY the exact syntax below. Test all properties before using.
ABSOLUTELY FORBIDDEN - THESE WILL CAUSE ERRORS:
- NO render engine changes (bpy.context.scene.render.engine)
- NO render operations (bpy.ops.render)
- NO scene settings (scene.render.*)
- NO file operations
- NO camera/light creation
- NO scene clearing operations

BASIC OBJECTS:
bpy.ops.mesh.primitive_cube_add(location=(x, y, z))
obj = bpy.context.active_object
obj.scale = (x, y, z)
obj.rotation_euler = (x, y, z)
obj.name = "ObjectName"

SAFE MATERIAL CREATION - ALWAYS USE TRY/EXCEPT:
mat = bpy.data.materials.new(name="MaterialName")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')

# Always safe - Base Color
bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)

# Advanced properties - use safely:
try:
    bsdf.inputs['Metallic'].default_value = 0.8  # 0.0 to 1.0
except KeyError:
    pass

try:
    bsdf.inputs['Roughness'].default_value = 0.2  # 0.0 to 1.0  
except KeyError:
    pass

try:
    bsdf.inputs['Transmission'].default_value = 0.9  # 0.0 to 1.0
except KeyError:
    pass

try:
    bsdf.inputs['IOR'].default_value = 1.45  # 1.0 to 2.0
except KeyError:
    pass

try:
    bsdf.inputs['Emission Strength'].default_value = 2.0  # For glowing materials
except KeyError:
    pass

obj.data.materials.append(mat)

ADVANCED MATERIAL EXAMPLES:

# Metallic surface
mat_metal = bpy.data.materials.new(name="Metal")
mat_metal.use_nodes = True
bsdf = mat_metal.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.7, 0.7, 0.8, 1.0)
try:
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.1
except KeyError:
    pass
obj.data.materials.append(mat_metal)

# Glass material
mat_glass = bpy.data.materials.new(name="Glass")
mat_glass.use_nodes = True
bsdf = mat_glass.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.8, 0.9, 1.0, 1.0)
try:
    bsdf.inputs['Transmission'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.0
    bsdf.inputs['IOR'].default_value = 1.45
except KeyError:
    pass
obj.data.materials.append(mat_glass)

# Neon/Emissive material
mat_neon = bpy.data.materials.new(name="Neon")
mat_neon.use_nodes = True
bsdf = mat_neon.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.0, 1.0, 0.5, 1.0)
try:
    bsdf.inputs['Emission Strength'].default_value = 5.0
except KeyError:
    pass
obj.data.materials.append(mat_neon)

# Rough concrete
mat_concrete = bpy.data.materials.new(name="Concrete")
mat_concrete.use_nodes = True
bsdf = mat_concrete.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.6, 0.6, 0.6, 1.0)
try:
    bsdf.inputs['Roughness'].default_value = 0.9
except KeyError:
    pass
obj.data.materials.append(mat_concrete)

ADVANCED OBJECT OPERATIONS:

# Duplicate objects
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
original = bpy.context.active_object
for i in range(5):
    bpy.ops.object.duplicate()
    obj = bpy.context.active_object
    obj.location = (i * 2, 0, 0)

# Array of objects with variation
import random
for x in range(-10, 11, 2):
    for y in range(-10, 11, 2):
        if random.random() > 0.3:  # 70% chance to place object
            bpy.ops.mesh.primitive_cube_add(location=(x, y, 0))
            obj = bpy.context.active_object
            obj.scale = (random.uniform(0.5, 2.0), random.uniform(0.5, 2.0), random.uniform(1, 5))

# Complex shapes using primitives
# Tower structure
for i in range(10):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, i * 2))
    obj = bpy.context.active_object
    obj.scale = (2 - i * 0.1, 2 - i * 0.1, 1)

SAFE PRIMITIVES:
- bpy.ops.mesh.primitive_cube_add(location=(x,y,z), scale=(x,y,z))
- bpy.ops.mesh.primitive_uv_sphere_add(location=(x,y,z), radius=r)
- bpy.ops.mesh.primitive_cylinder_add(location=(x,y,z), radius=r, depth=d)
- bpy.ops.mesh.primitive_plane_add(location=(x,y,z), size=s)
- bpy.ops.mesh.primitive_cone_add(location=(x,y,z), radius1=r1, depth=d)
- bpy.ops.mesh.primitive_torus_add(location=(x,y,z), major_radius=r1, minor_radius=r2)

ADVANCED POSITIONING:
- obj.location = (x, y, z)
- obj.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))  # Use degrees
- obj.scale = (x, y, z)

SAFE IMPORTS:
import bpy
import math
import random

COLOR PALETTE (use these for consistency):
# Cyberpunk colors
NEON_BLUE = (0.0, 0.5, 1.0, 1.0)
NEON_PINK = (1.0, 0.0, 0.5, 1.0)
NEON_GREEN = (0.0, 1.0, 0.3, 1.0)
CYBER_PURPLE = (0.5, 0.0, 1.0, 1.0)
DARK_METAL = (0.2, 0.2, 0.3, 1.0)
BRIGHT_WHITE = (0.9, 0.9, 1.0, 1.0)

RULES:
1. Always wrap advanced material properties in try/except
2. Use math.radians() for rotations in degrees
3. Use random for variation but keep it controlled
4. Create 20-50 objects for complex scenes (more allowed now)
5. Use coordinate ranges -20 to +20 for large scenes
6. Layer objects at different heights for depth
7. Group similar objects together spatially

OUTPUT: Only Python code. No explanations. Start with imports.

Generate script:`;
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