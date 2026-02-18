import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const transport = pino.transport({
  targets: [
    {
      target: '@logtail/pino',
      options: {
        sourceToken: process.env.BETTER_STACK_LOGS_TOKEN!,
        options: { endpoint: process.env.BETTER_STACK_LOGS_DSN! },
      },
      level: 'info',
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: process.env.NODE_ENV === 'development',
      },
      level: 'info',
    },
  ],
});

const logger = pino(transport);

export default logger;
