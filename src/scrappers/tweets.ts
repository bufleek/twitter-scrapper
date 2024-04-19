import {PrismaClient} from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import {BaseScrapper} from './base';

const prisma = new PrismaClient();

interface RawTweet {
  socialContext: string;
  user: {
    username: string;
    handle: string;
    link: string;
    verified: boolean;
    avatar: string;
  };
  content: {
    text: string;
    images: string[];
    hasVideo: boolean;
  };
  metrics: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

interface Tweet {
  id: number;
  authorId: number;
  content: string;
  images: string[];
  hasVideo: boolean;
  likes: number;
  retweets: number;
  replies: number;
  localImages: string[];
}

export class TweetsScrapper extends BaseScrapper {
  public async scrap() {
    await this.launch();
    try {
      const page = (await this.browser.pages())[0];
      await page.setViewport({width: 1280, height: 926});
      page.setDefaultNavigationTimeout(60000);

      // TODO: Login

      await page.goto('https://twitter.com/coindesk', {
        waitUntil: 'networkidle0',
      });

      await page.waitForSelector("article[data-testid='tweet']");

      // TODO: Support scroll to load more tweets
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      const tweets = await page.$$eval(
        "article[data-testid='tweet']",
        elements => {
          try {
            {
              return elements.map(element => {
                const tweet = {
                  socialContext: element.querySelector(
                    "*[data-testid='socialContext']"
                  )?.textContent,
                  user: {
                    username: element.querySelector(
                      'div[data-testid="User-Name"] div:nth-child(1) a[role="link"]'
                    )?.textContent,
                    handle: element.querySelector(
                      'div[data-testid="User-Name"] div:nth-child(2) a[role="link"]'
                    )?.textContent,
                    link: element
                      .querySelector(
                        'div[data-testid="User-Name"] div:nth-child(2) a[role="link"]'
                      )
                      ?.getAttribute('href'),
                    verified: !!element.querySelector(
                      'div[data-testid="User-Name"] div svg[aria-label="Verified account"]'
                    ),
                    avatar: element
                      .querySelector('div[data-testid="Tweet-User-Avatar"] img')
                      ?.getAttribute('src'),
                  },
                  content: {
                    text: element.querySelector('div[data-testid="tweetText"]')
                      ?.textContent,
                    images: [
                      "div[data-testid='card.layoutLarge.media'] img",
                      'div[data-testid="tweetPhoto"] img',
                    ]
                      .map(
                        selector =>
                          element.querySelector(selector)?.getAttribute('src')
                      )
                      .filter(Boolean),
                    hasVideo: !!element.querySelector(
                      'div[data-testid="videoPlayer"]'
                    ),
                  },
                  metrics: {
                    replies: parseInt(
                      element
                        .querySelector('div[data-testid="reply"]')
                        ?.textContent?.replace(/\D/g, '') || '0'
                    ),
                    retweets: parseInt(
                      element
                        .querySelector('div[data-testid="retweet"]')
                        ?.textContent?.replace(/\D/g, '') || '0'
                    ),
                    likes: parseInt(
                      element
                        .querySelector('div[data-testid="like"]')
                        ?.textContent?.replace(/\D/g, '') || '0'
                    ),
                  },
                };
                return tweet as RawTweet;
              });
            }
          } catch (error) {
            return null;
          }
        }
      );

      await page.close();

      // save tweets
      await this.saveTweets(tweets?.filter(Boolean) as RawTweet[]);

      try {
        await this.browser.close();
      } catch (error) {
        console.error(error);
      }
      return tweets;
    } catch (error) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error(error);
      }
      throw error;
    }
  }

  private async saveImage(tweet: Tweet) {
    // saves images to disk
    const folder = 'tweets/images';
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, {recursive: true});
    }

    for (const image of tweet.images) {
      try {
        const response = await axios.get(image, {responseType: 'arraybuffer'});
        fs.writeFileSync(`${folder}/${tweet.id}.jpg`, response.data);

        // save image to db
        tweet.localImages.push(`${folder}/${tweet.id}.jpg`);
      } catch (error) {
        console.error(error);
      }
    }

    // update tweet with images
    await prisma.tweet.update({
      where: {id: tweet.id},
      data: {localImages: tweet.localImages},
    });
  }

  private async saveTweets(tweets: RawTweet[]) {
    for (const tweet of tweets) {
      let account = await prisma.account.findFirst({
        where: {handle: tweet.user.handle},
      });
      if (!account) {
        account = await prisma.account.create({
          data: {
            username: tweet.user.username,
            handle: tweet.user.handle,
            link: tweet.user.link,
            verified: tweet.user.verified,
            avatar: tweet.user.avatar,
          },
        });
      }

      // check if tweet already exists
      const existingTweet = await prisma.tweet.findFirst({
        where: {content: tweet.content.text, authorId: account.id},
      });

      if (existingTweet) {
        continue;
      } else {
        const _tweet = await prisma.tweet.create({
          data: {
            // socialContext: tweet.socialContext,
            content: tweet.content.text,
            images: tweet.content.images,
            hasVideo: tweet.content.hasVideo,
            replies: tweet.metrics.replies,
            retweets: tweet.metrics.retweets,
            likes: tweet.metrics.likes,
            authorId: account.id,
          },
        });

        // save images
        await this.saveImage(_tweet);

        // send email if tweet has video
        if (_tweet.hasVideo) {
          await this.sendEmail({
            to: '',
          });
        }
      }
    }
  }

  private async sendEmail({to}: {to: string}) {
    // send email
    console.log(`Sending email to ${to}`);
  }
}
