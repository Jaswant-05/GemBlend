import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { clerkMiddleware } from '@clerk/express';
import fs from 'fs/promises';
//Import database
import { db } from './services/databaseService';
// Import routes
import { generateRouter } from './routes/generate';
import { projectsRouter } from './routes/projects';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(clerkMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create required directories
async function setupDirectories() {
  const outputDir = process.env.OUTPUT_DIR || './output';
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`✓ Output directory ready: ${outputDir}`);
  } catch (error) {
    console.error(`✗ Failed to create output directory:`, error);
  }
}

// Serve static files (generated outputs) - FIXED PATH
const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');
app.use('/output', express.static(outputDir));
console.log(`📁 Serving static files from: ${outputDir}`);

// Routes
app.use('/api/generate', generateRouter);
app.use('/api/projects', projectsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.connect();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Blender installation
app.get('/api/test-blender', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('blender --version');
    res.json({
      success: true,
      blenderVersion: stdout.split('\n')[0],
      message: 'Blender is installed and accessible'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Blender not found or not accessible',
      message: 'Please install Blender and ensure it\'s in your PATH'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await setupDirectories();
    await db.connect();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Output directory: ${outputDir}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🗃️ Database: Connected`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();