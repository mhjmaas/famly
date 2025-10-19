import { createApp } from './app';

const DEFAULT_PORT = 4000;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

const app = createApp();

app.listen(port, () => {
  console.log(`Famly API listening on port ${port}`);
});
