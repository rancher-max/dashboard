import https from 'https';
import pkg from '../package.json';

export default function({
  $axios, isDev, route, redirect, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json';
  $axios.defaults.xsrfCookieName = 'CSRF';
  $axios.defaults.xsrfHeaderName = 'X-Api-Csrf';
  $axios.defaults.withCredentials = true;

  if ( process.server ) {
    $axios.defaults.headers.common['user-agent'] = `Dashboard v${ pkg.version }`;
  }

  if ( isDev ) {
    // https://github.com/nuxt-community/axios-module/blob/dev/lib/module.js#L78
    // forces localhost to http, for no obvious reason.
    if ( $axios.defaults.baseURL.startsWith('http://') ) {
      $axios.defaults.baseURL = $axios.defaults.baseURL.replace(/^http:/, 'https:');
    }

    const insecureAgent = new https.Agent({ rejectUnauthorized: false });

    $axios.onRequest((config) => {
      console.log('Before', config);
      if ( process.server && isDev && config.url.startsWith('https://localhost/') ) {
        config.url = config.url.replace(/^https/, 'http');
      }

      if ( process.server && !config.url.startsWith('http') ) {
        config.headers.common['Host'] = req.headers.host;
      }

      config.httpsAgent = insecureAgent;
      console.log('After', config);
    });

    $axios.onError((error) => {
      const code = parseInt(error.response && error.response.status, 10);

      if (code === 401) {
        if ( route.name === 'index' ) {
          redirect('/auth/login');
        } else {
          redirect('/auth/login?timed-out');
        }
      }
    });
  }
}
