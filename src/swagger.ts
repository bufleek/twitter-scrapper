/* eslint-disable node/no-unpublished-import */
import swaggerAutogen from 'swagger-autogen';

const options = {
  info: {
    title: 'Twitter Scraper API',
    version: '1.0.0',
    description: 'Tweets are scrapped every minute for easy testing',
  },
  host: 'localhost:3000',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [{name: 'Tweets', description: 'Endpoints to get tweets'}],
};

const routes = ['src/routers/*.ts'];

swaggerAutogen(null, routes, null)('src/docs.json', routes, options);
