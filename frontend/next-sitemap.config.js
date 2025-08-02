/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://caryo-marketplace.com',
  generateRobotsTxt: true, // (optional)
  generateIndexSitemap: false, // For smaller sites
  
  // Default transformation function
  transform: async (config, path) => {
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
  
  // Additional paths to include
  additionalPaths: async (config) => {
    const paths = [];
    
    // Add main pages with high priority
    paths.push(
      await config.transform(config, '/'),
      await config.transform(config, '/search'),
      await config.transform(config, '/about'),
      await config.transform(config, '/contact'),
      await config.transform(config, '/privacy'),
      await config.transform(config, '/terms'),
    );
    
    return paths;
  },
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/profile/',
          '/favorites/',
          '/settings/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://caryo-marketplace.com'}/sitemap.xml`,
    ],
  },
  
  // Change frequency and priority by path
  changefreq: 'daily',
  priority: 0.7,
  
  // Exclude certain paths
  exclude: [
    '/api/*',
    '/admin/*',
    '/dashboard/*',
    '/auth/*',
    '/profile/*',
    '/favorites/*',
    '/settings/*',
    '/_next/*',
    '/static/*',
    '/404',
    '/500',
  ],
  
  // Set custom priority and changefreq for specific paths
  transform: async (config, path) => {
    // High priority for main pages
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
    }
    
    if (path === '/search') {
      return {
        loc: path,
        changefreq: 'hourly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      }
    }
    
    // Car listing pages
    if (path.startsWith('/listings/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      }
    }
    
    // Brand and model pages
    if (path.startsWith('/cars/') || path.startsWith('/brands/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      }
    }
    
    // Default transformation
    return {
      loc: path,
      changefreq: 'weekly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    }
  }
}
