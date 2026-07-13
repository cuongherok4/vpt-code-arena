import express from 'express';
import Queue from 'bull';

const app = express();
app.use(express.json());

const submissionQueue = new Queue('submissions', process.env.REDIS_URL || 'redis://localhost:6379');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'judge-service' });
});

submissionQueue.process(async (job) => {
  console.log('Processing submission job:', job.id);
  // TODO: Integrate with Judge0 API
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Judge service running on port ${PORT}`);
});
