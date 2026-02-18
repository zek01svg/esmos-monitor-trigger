import { app } from '@azure/functions';
import './functions/esmos-monitor-trigger';

app.setup({
  enableHttpStream: true,
});
