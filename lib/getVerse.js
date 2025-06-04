import axios from 'axios'
import { parseStringPromise as parseXml } from 'xml2js'
import { decode } from 'html-entities'

export default async function getVerse() {
  try {
    const xml = (await axios.get(
      'https://www.biblegateway.com/votd/get/?format=atom&version=NIV',
      {
        timeout: 4000
      }
    )).data;

    const json  = await parseXml(xml, { explicitArray: false });
    const entry = json.feed.entry;

    const reference = entry.title;
    const verseHtml = entry.content._ || entry.content;
    const verse = decode(verseHtml).trim();

    return {
      reference,
      verse,
      provider: 'BibleGateway'
    };
  } catch {
    // 
  }

  // Fallback
  const { data } = await axios.get(
    'https://beta.ourmanna.com/api/v1/get/?format=json&order=daily',
    {
      timeout: 4000
    }
  );

  return {
    reference: data.verse.details.reference,
    verse: data.verse.details.text.trim(),
    provider: 'OurManna'
  };
}
