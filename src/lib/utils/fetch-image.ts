// src/lib/utils/fetch-image.ts

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

interface ImageResult {
  url: string;
  thumb: string;
  credit: string;
  creditUrl: string;
}

/**
 * Fetch an image from Pexels for a vocabulary word
 * Falls back to null if no image found
 */
export async function fetchVocabImage(
  word: string,
  translation: string
): Promise<ImageResult | null> {
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set");
    return null;
  }

  // Skip abstract words that won't have good images
  const skipPatterns = [
    /^(the|a|an|is|are|was|were|be|been|being)$/i,
    /^(have|has|had|do|does|did|will|would|could|should)$/i,
    /^(may|might|must|shall|can)$/i,
    /^(very|really|quite|just|also|too|more|most)$/i,
    /^(and|or|but|if|then|because|so|when|where|how|what|why)$/i,
    /^(hello|goodbye|please|thank|sorry|yes|no|okay)$/i,
    /^(I|you|he|she|it|we|they|my|your|his|her|its|our|their)$/i,
  ];

  const lowerTranslation = translation.toLowerCase().trim();
  if (skipPatterns.some(p => p.test(lowerTranslation))) {
    return null;
  }

  // Use English translation for search (better results)
  const searchTerm = translation
    .split(/[\/,;]/)[0]  // Take first meaning if multiple
    .replace(/[()]/g, '') // Remove parentheses
    .trim();

  if (searchTerm.length < 2) return null;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=square`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Pexels API error for "${searchTerm}":`, response.status);
      return null;
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      return {
        url: photo.src.medium,    // 350px
        thumb: photo.src.small,   // 130px
        credit: photo.photographer,
        creditUrl: photo.photographer_url,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching image for "${searchTerm}":`, error);
    return null;
  }
}

/**
 * Batch fetch images for multiple vocabulary words
 * Returns a map of word -> image URL
 */
export async function fetchVocabImages(
  vocabulary: { term: string; translation: string }[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Process in batches to avoid rate limiting (Pexels: 200 req/hr)
  const batchSize = 5;
  
  for (let i = 0; i < vocabulary.length; i += batchSize) {
    const batch = vocabulary.slice(i, i + batchSize);
    
    const promises = batch.map(async (vocab) => {
      const image = await fetchVocabImage(vocab.term, vocab.translation);
      if (image) {
        results[vocab.term] = image.thumb;
      }
    });

    await Promise.all(promises);
    
    // Small delay between batches (Pexels allows 200/hour = ~3/second)
    if (i + batchSize < vocabulary.length) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  return results;
}

/**
 * Get a placeholder emoji for words without images
 */
export function getWordEmoji(partOfSpeech?: string): string {
  const emojiMap: Record<string, string> = {
    noun: "📦",
    verb: "⚡",
    adjective: "✨",
    adverb: "💨",
    phrase: "💬",
    preposition: "📍",
    conjunction: "🔗",
    pronoun: "👤",
    number: "🔢",
    interjection: "❗",
  };

  return emojiMap[partOfSpeech?.toLowerCase() || ""] || "📝";
}
