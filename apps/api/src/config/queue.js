import fastq from 'fastq';

// --- Worker Functions ---

// 1. File Processor Worker
const fileWorker = async (task) => {
  console.log(`[Queue] Processing File ID: ${task.fileId} (${task.type})`);
  
  // Simulate heavy processing (e.g., resizing, virus scanning)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`[Queue] Finished File ID: ${task.fileId}`);
};

// 2. Email Worker
const emailWorker = async (task) => {
  console.log(`[Queue] Sending Email to: ${task.to}`);
  // In real app, import your sendEmail function here
  await new Promise(resolve => setTimeout(resolve, 500)); 
};

// --- Queues ---

// Concurrency: 1 (Process files one by one to save CPU)
export const fileQueue = fastq.promise(fileWorker, 1);

// Concurrency: 5 (Send emails in parallel)
export const emailQueue = fastq.promise(emailWorker, 5);

// Usage: 
// import { fileQueue } from '../config/queue.js';
// fileQueue.push({ fileId: '123', type: 'resize' });