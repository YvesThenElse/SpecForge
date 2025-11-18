import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { FileService } from './services/FileService';
import { LLMService } from './services/LLMService';
import { createRouter } from './routes';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const fileService = new FileService();
const llmService = new LLMService(process.env.OPENAI_API_KEY || '', fileService);

// Active project state (shared across all applications)
let activeProject: { path: string; name: string } | null = null;

// API Routes (pass io for WebSocket broadcasting)
const apiRouter = createRouter(fileService, llmService, io);
app.use('/api', apiRouter);

// Active project endpoints
app.get('/api/active-project', (req, res) => {
  res.json({ project: activeProject });
});

app.post('/api/active-project', (req, res) => {
  const { path, name } = req.body;
  activeProject = path ? { path, name: name || path.split(/[/\\]/).pop() || 'Unknown' } : null;

  // Broadcast to all connected clients
  io.emit('project:activated', activeProject);

  console.log(`📌 Active project set to: ${activeProject?.name || 'None'}`);
  res.json({ project: activeProject });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current active project to newly connected client
  if (activeProject) {
    socket.emit('project:activated', activeProject);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Subscribe to project updates
  socket.on('subscribe:project', (projectId: string) => {
    console.log(`Client ${socket.id} subscribed to project ${projectId}`);
    socket.join(`project:${projectId}`);
  });

  // Unsubscribe from project
  socket.on('unsubscribe:project', (projectId: string) => {
    console.log(`Client ${socket.id} unsubscribed from project ${projectId}`);
    socket.leave(`project:${projectId}`);
  });
});

// Broadcast specification updates to all connected clients
export function broadcastSpecificationUpdate(projectId: string, specification: any) {
  io.to(`project:${projectId}`).emit('specification:updated', specification);
}

export function broadcastSpecificationCreated(projectId: string, specification: any) {
  io.to(`project:${projectId}`).emit('specification:created', specification);
}

export function broadcastSpecificationDeleted(projectId: string, specificationId: string) {
  io.to(`project:${projectId}`).emit('specification:deleted', specificationId);
}

export function broadcastMarkdownUpdated(projectId: string, fileName: string, content: string) {
  io.to(`project:${projectId}`).emit('markdown:updated', { fileName, content });
}

// Start server
const PORT = process.env.PORT || 3003;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  🎯 SpecForge Backend Server');
  console.log('========================================');
  console.log(`  ✅ Server running on http://localhost:${PORT}`);
  console.log(`  ✅ API available at http://localhost:${PORT}/api`);
  console.log(`  ✅ WebSocket server ready`);
  console.log('');
  console.log('  Available endpoints:');
  console.log(`    GET  /api/health`);
  console.log(`    POST /api/projects/init`);
  console.log(`    POST /api/projects/info`);
  console.log(`    POST /api/specifications/all`);
  console.log(`    POST /api/analyze`);
  console.log(`    POST /api/markdown/read`);
  console.log(`    POST /api/markdown/write`);
  console.log('');
  console.log(`  Environment:`);
  console.log(`    OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log('========================================');
  console.log('');
});

export { io, fileService, llmService };
