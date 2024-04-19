import {PrismaClient} from '@prisma/client';
import {Router} from 'express';
import {TweetsScrapper} from '../scrappers/tweets';

const prisma = new PrismaClient();

export const router = Router();

router.get('/tweets', async (req, res) => {
  /**
   * #swagger.tags = ['Tweets']
    #swagger.description = 'This endpoint returns the tweets from the database. Scrapper runs every minute'
    #swagger.summary = 'This endpoint returns the tweets from the database. `Scrapper runs every minute'`

    #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { description: 'Number of tweets per page', required: false, type: 'integer', default: 10}
   */
  let page = req.query.page ? parseInt(req.query.page as string) : 1;
  if (page < 1) {
    page = 1;
  }
  let take = req.query.limit ? parseInt(req.query.limit as string) : 10;
  if (take < 1) {
    take = 10;
  }
  if (take > 100) {
    take = 100;
  }
  const tweets = await prisma.tweet.findMany({
    orderBy: {id: 'desc'},
    skip: (page - 1) * take,
    take,
  });

  res.status(200).json(tweets);
});

router.get('/live-scrap', async (req, res) => {
  // #swagger.tags = ['Tweets']
  // #swagger.description = 'This endpoint is provided for testing convenience. It `live scraps` the tweets'
  // #swagger.summary = 'This endpoint is provided for testing convenience. It `live scraps` the tweets'
  try {
    const tweets = await new TweetsScrapper().scrap();

    res.status(200).json(tweets);
  } catch (error: any) {
    res.status(500).json({error: error.toString()});
  }
});

// serve image files
router.get('/tweets/images/:image', (req, res) => {
  const {image} = req.params;
  res.sendFile(image, {root: 'tweets/images'});
});

export default router;
