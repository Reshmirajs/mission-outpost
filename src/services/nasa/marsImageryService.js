const NASA_IMAGES_API_ROOT = 'https://images-api.nasa.gov';
const REQUEST_TIMEOUT_MS = 10000;

let cachedRequest;

async function fetchJson(url, label) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NASA ${label} request failed (${response.status}).`);
    }

    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`NASA ${label} request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isMarsRoverImage(item) {
  const metadata = item?.data?.[0];
  if (!metadata || metadata.media_type !== 'image' || !metadata.nasa_id) return false;

  const searchableText = [
    metadata.title,
    metadata.description,
    ...(Array.isArray(metadata.keywords) ? metadata.keywords : []),
  ].join(' ').toLowerCase();

  return searchableText.includes('mars')
    && (searchableText.includes('rover')
      || searchableText.includes('perseverance')
      || searchableText.includes('curiosity'));
}

function getImageUrlFromManifest(manifest) {
  const files = manifest?.collection?.items;
  if (!Array.isArray(files)) return '';

  const imageUrls = files
    .map((file) => file?.href)
    .filter((href) => typeof href === 'string'
      && href.startsWith('https://')
      && !/metadata\.json(?:[?#]|$)/i.test(href)
      && /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(href));

  return imageUrls.find((href) => /~medium\./i.test(href) || /~medi\./i.test(href))
    || imageUrls.find((href) => /~orig\./i.test(href))
    || imageUrls.find((href) => /~small\./i.test(href) || /~smal\./i.test(href))
    || imageUrls[0]
    || '';
}

async function loadMarsRoverImage() {
  const searchUrl = new URL(`${NASA_IMAGES_API_ROOT}/search`);
  searchUrl.searchParams.set('q', 'Mars rover');
  searchUrl.searchParams.set('media_type', 'image');
  searchUrl.searchParams.set('page_size', '20');

  const searchResult = await fetchJson(searchUrl, 'Image Library search');
  const items = searchResult?.collection?.items;
  if (!Array.isArray(items)) {
    throw new Error('NASA Image Library returned an unexpected search response.');
  }

  const item = items.find(isMarsRoverImage);
  if (!item) {
    return { status: 'no-results' };
  }

  const metadata = item.data[0];
  const manifestUrl = `${NASA_IMAGES_API_ROOT}/asset/${encodeURIComponent(metadata.nasa_id)}`;
  const manifest = await fetchJson(manifestUrl, 'image manifest');
  const imageUrl = getImageUrlFromManifest(manifest);
  if (!imageUrl) {
    throw new Error('The NASA image manifest did not contain a usable image URL.');
  }

  return {
    status: 'live',
    imageUrl,
    nasaId: metadata.nasa_id,
    title: metadata.title || '',
    description: metadata.description || '',
    dateCreated: metadata.date_created || '',
    photographer: metadata.photographer || '',
    center: metadata.center || '',
    location: metadata.location || '',
    keywords: Array.isArray(metadata.keywords) ? metadata.keywords : [],
    mediaType: metadata.media_type,
    attribution: metadata.photographer || '',
    sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(metadata.nasa_id)}`,
  };
}

/** Search NASA's Image and Video Library and resolve one rover image manifest. */
export function fetchMarsRoverImage() {
  if (!cachedRequest) {
    cachedRequest = loadMarsRoverImage();
  }
  return cachedRequest;
}
