import { HttpError, requireAmplifyUser } from './_amplifyAuth.ts';
import puppeteer from 'npm:puppeteer@23.11.1';

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);

    if (!user.isAdmin) {
      throw new HttpError(403, 'Admin access required');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://homexrei.base44.com';
    const logs = [];

    const log = (message) => {
      const timestamp = new Date().toISOString();
      logs.push(`[${timestamp}] ${message}`);
      console.log(message);
    };

    log('Starting browser automation...');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Helper functions
    const scrollPage = async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
    };

    const waitForNav = async (timeout = 5000) => {
      await page.waitForTimeout(timeout);
    };

    try {
      // 1. Load landing page
      log('Loading landing page...');
      await page.goto(appUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Landing page loaded');
      await scrollPage();
      log('Scrolled landing page');

      // 2. Navigate to Deals
      log('Navigating to Deals...');
      await page.goto(`${appUrl}/deals`, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Deals page loaded');
      await scrollPage();
      log('Scrolled Deals page');

      // 3. Navigate to Services
      log('Navigating to Services...');
      await page.goto(`${appUrl}/services`, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Services page loaded');
      await scrollPage();
      log('Scrolled Services page');

      // 4. Navigate to Insights
      log('Navigating to Insights...');
      await page.goto(`${appUrl}/insights`, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Insights page loaded');
      await scrollPage();
      log('Scrolled Insights page');

      // 5. First Login - mishavp2001@yahoo.com
      log('Navigating to sign in (first user)...');
      await page.goto(`${appUrl}/auth/login`, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Sign in page loaded');

      log('Filling in credentials for mishavp2001@yahoo.com...');
      await page.type('input[type="email"]', 'mishavp2001@yahoo.com', { delay: 100 });
      await page.type('input[type="password"]', 'moldova1@A', { delay: 100 });
      
      log('Clicking sign in button...');
      await page.click('button[type="submit"]');
      await waitForNav(5000);
      
      log('Waiting for dashboard to load...');
      await page.waitForSelector('body', { timeout: 10000 });
      await waitForNav(2000);
      log('Dashboard loaded for first user');
      await scrollPage();
      log('Scrolled dashboard');

      // 6. Sign out
      log('Signing out first user...');
      const logoutButton = await page.$('button:has-text("Logout")');
      if (logoutButton) {
        await logoutButton.click();
        await waitForNav(2000);
        log('Signed out successfully');
      } else {
        log('Logout button not found, navigating to landing');
        await page.goto(appUrl, { waitUntil: 'networkidle0' });
      }

      // 7. Second Login - funolympics2@gmail.com
      log('Navigating to sign in (second user)...');
      await page.goto(`${appUrl}/auth/login`, { waitUntil: 'networkidle0', timeout: 30000 });
      await waitForNav(2000);
      log('Sign in page loaded');

      log('Filling in credentials for funolympics2@gmail.com...');
      await page.type('input[type="email"]', 'funolympics2@gmail.com', { delay: 100 });
      await page.type('input[type="password"]', 'moldova1', { delay: 100 });
      
      log('Clicking sign in button...');
      await page.click('button[type="submit"]');
      await waitForNav(5000);
      
      log('Waiting for dashboard to load...');
      await page.waitForSelector('body', { timeout: 10000 });
      await waitForNav(2000);
      log('Dashboard loaded for second user');
      await scrollPage();
      log('Scrolled dashboard');

      log('Automation completed successfully!');

    } catch (error) {
      log(`Error during automation: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
      log('Browser closed');
    }

    return Response.json({
      success: true,
      logs,
      message: 'Automation completed successfully'
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Automation failed';
    const status = error instanceof HttpError ? error.status : 500;
    console.error('Automation error:', error);
    return Response.json({
      success: false,
      error: message,
      logs: [`Error: ${message}`]
    }, { status });
  }
});