import bodyParser from 'body-parser';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import docs from './docs.json';
import tweetsRouter from './routers/tweets';

const app = express();
app.use(bodyParser.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(docs));
app.use(tweetsRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
