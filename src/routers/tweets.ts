import {Router} from 'express';
import {TweetsScrapper} from '../scrappers/tweets';

const router = Router();

router.get('/tweets', async (req, res) => {
  try {
    const tweets = await new TweetsScrapper().scrap();
    console.log(tweets);
    res.status(200).send(tweets);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send({error: e.toString()});
  }
});

export default router;
