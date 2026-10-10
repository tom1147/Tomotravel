const FILE = 'TomoNightwalker-Android-v38.0.0.apk';
const LATEST = '/TomoNightwalker-Android-latest.apk';
const PREVIOUS = ['/TomoNightwalker-Android-v31.apk', '/TomoNightwalker-Android-v36.0.0.apk', '/TomoNightwalker-Android-v37.0.0.apk', '/TomoNightwalker-Android-v37.0.1.apk'];

function downloadHeaders(object) {
  return new Headers({
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Disposition': `attachment; filename="${FILE}"`,
    'Content-Length': String(object.size),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path !== `/${FILE}` && path !== LATEST && !PREVIOUS.includes(path)) {
      return new Response('Not found', { status: 404 });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }
    if (path === LATEST || PREVIOUS.includes(path)) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/${FILE}`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (request.method === 'HEAD') {
      const object = await env.APK_BUCKET.head(FILE);
      return object
        ? new Response(null, { status: 200, headers: downloadHeaders(object) })
        : new Response('Not found', { status: 404 });
    }

    const requestedRange = request.headers.has('Range');
    const object = await env.APK_BUCKET.get(
      FILE,
      requestedRange ? { range: request.headers } : {},
    );
    if (!object) return new Response('Not found', { status: 404 });

    const headers = downloadHeaders(object);
    let status = 200;
    if (requestedRange && object.range) {
      const start = object.range.offset ?? Math.max(0, object.size - (object.range.suffix ?? object.size));
      const length = object.range.length ?? (object.range.suffix === undefined
        ? object.size - start
        : Math.min(object.range.suffix, object.size));
      headers.set('Content-Range', `bytes ${start}-${start + length - 1}/${object.size}`);
      headers.set('Content-Length', String(length));
      status = 206;
    }
    return new Response(object.body, { status, headers });
  },
};
