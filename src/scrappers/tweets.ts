import {PrismaClient} from '@prisma/client';
import {BaseScrapper} from './base';

const prisma = new PrismaClient();

interface Tweet {
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

export class TweetsScrapper extends BaseScrapper {
  public async scrap() {
    await this.launch();
    try {
      const page = (await this.browser.pages())[0];
      await page.setViewport({width: 1280, height: 926});
      page.setDefaultNavigationTimeout(60000);
      await page.goto('https://twitter.com/coindesk', {
        waitUntil: 'networkidle0',
      });

      await page.waitForSelector("article[data-testid='tweet']");

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
                return tweet as Tweet;
              });
            }
          } catch (error) {
            return null;
          }
        }
      );

      await page.close();

      // save tweets
      await this.saveTweets(tweets?.filter(Boolean) as Tweet[]);
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

  private async saveTweets(tweets: Tweet[]) {
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

      await prisma.tweet.create({
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
    }
  }
}
