import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import propertiesRouter from './routes/properties';
import usersRouter from './routes/users';
import sessionsRouter from './routes/sessions';
import icalRouter from './routes/ical';
import webhookRouter from './routes/webhook';
import notificationsRouter from './routes/notifications';
import photosRouter from './routes/photos';
import issuesRouter from './routes/issues';
import messagesRouter from './routes/messages';
import cleanersRouter from './routes/cleaners';
import guestRouter from './routes/guest';
import standardsRouter from './routes/standards';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.ADMIN_URL ?? 'http://localhost:5173',
  credentials: true,
}));

// better-auth handler must come BEFORE express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/properties', propertiesRouter);
app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);
app.use('/ical', icalRouter);
app.use('/webhook', webhookRouter);
app.use('/notifications', notificationsRouter);
app.use('/photos', photosRouter);
app.use('/issues', issuesRouter);
app.use('/messages', messagesRouter);
app.use('/admin/cleaners', cleanersRouter);
app.use('/guest', guestRouter);
app.use('/standards', standardsRouter);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

export default app;
