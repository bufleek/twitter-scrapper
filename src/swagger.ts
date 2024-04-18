/* eslint-disable node/no-unpublished-import */
import swaggerAutogen from 'swagger-autogen';

const options = {
  openapi: '3.0.0',
  definition: {
    info: {
      title: 'Twitter Scraper API',
      version: '1.0.0',
    },
    schemes: ['http', 'https'],
    servers: ['http://localhost:3000'],
  },
};
const apis = ['routers/*.js', 'routes/*.ts'];

swaggerAutogen(options)('docs.json', apis);
