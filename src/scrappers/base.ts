import * as puppeteer from 'puppeteer';

export class BaseScrapper {
  protected browser!: puppeteer.Browser;

  public async launch() {
    this.browser = await puppeteer.launch({
      headless: 'shell',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });
  }
}
