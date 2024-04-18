import bodyParser from 'body-parser';
import express from 'express';
import cron from 'node-cron';
import * as swaggerUi from 'swagger-ui-express';
import docs from './docs.json';
import tweetsRouter from './routers/tweets';
import {TweetsScrapper} from './scrappers/tweets';

const app = express();
app.use(bodyParser.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(docs));
app.use(tweetsRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

cron.schedule('* * * * *', async () => {
  console.log('Executing cron job');
  await new TweetsScrapper().scrap();
});
