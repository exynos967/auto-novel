import * as cheerio from 'cheerio';
import type { KyInstance } from 'ky';

import {
  type RemoteChapter,
  type RemoteNovelMetadata,
  type TocItem,
  WebNovelAttention,
  type WebNovelAuthor,
  type WebNovelProvider,
  WebNovelType,
} from './types';

function parseWebNovelType(typeText: string): WebNovelType {
  switch (typeText) {
    case 'COMPLETED':
      return WebNovelType.Completed;
    case 'RUNNING':
      return WebNovelType.Ongoing;
    default:
      throw new Error(`无法解析的小说类型：${typeText}`);
  }
}

export class Kakuyomu implements WebNovelProvider {
  readonly id = 'kakuyomu';
  readonly version = '1.0.0';

  client: KyInstance;

  constructor(client: KyInstance) {
    this.client = client;
  }

  async getMetadata(novelId: string): Promise<RemoteNovelMetadata | null> {
    const $ = await this.client
      .get(`https://kakuyomu.jp/works/${novelId}`)
      .text()
      .then((text) => cheerio.load(text));

    const script = $('#__NEXT_DATA__').first().html();
    if (!script) throw new Error('作品信息解析失败');

    const apollo = JSON.parse(script)?.props?.pageProps?.__APOLLO_STATE__;
    if (!apollo || typeof apollo !== 'object')
      throw new Error('作品信息解析失败');

    function unrefApollo(data: any): any {
      return apollo[data?.__ref] ?? undefined;
    }

    const work = apollo[`Work:${novelId}`];
    if (!work) throw new Error('作品信息解析失败');

    const title = work.alternativeTitle ?? work.title;
    if (!title) throw new Error('标题解析失败');

    const authorData = unrefApollo(work.author);
    if (!authorData?.activityName || !authorData?.name) {
      throw new Error('作者解析失败');
    }
    const authors: WebNovelAuthor[] = [
      {
        name: authorData.activityName,
        link: `https://kakuyomu.jp/users/${authorData.name}`,
      },
    ];

    const typeText = work.serialStatus;
    if (!typeText) {
      throw new Error('小说类型解析失败');
    }
    const type = parseWebNovelType(typeText);

    const attentions: WebNovelAttention[] = [];
    if (work.isCruel) attentions.push(WebNovelAttention.Cruelty);
    if (work.isViolent) attentions.push(WebNovelAttention.Violence);
    if (work.isSexual) attentions.push(WebNovelAttention.SexualContent);

    const keywords = Array.isArray(work.tagLabels) ? work.tagLabels : [];
    const points = work.totalReviewPoint ?? null;
    const totalCharacters = work.totalCharacterCount ?? 0;
    const introduction = work.introduction ?? '';

    const toc: TocItem[] = [];
    const tableOfContents = Array.isArray(work.tableOfContents)
      ? work.tableOfContents
      : [];
    for (const sectionRef of tableOfContents) {
      const section = unrefApollo(sectionRef);
      if (!section) {
        continue;
      }

      const chapter = unrefApollo(section.chapter);
      if (chapter?.title) {
        toc.push({
          title: chapter.title,
          chapterId: null,
          createAt: null,
        });
      }

      const episodes = Array.isArray(section.episodeUnions)
        ? section.episodeUnions
        : [];
      for (const episodeRef of episodes) {
        const episode = unrefApollo(episodeRef);
        if (!episode?.title || !episode?.id) {
          continue;
        }

        toc.push({
          title: episode.title,
          chapterId: episode.id,
          createAt: episode.publishedAt ?? null,
        });
      }
    }

    return {
      title,
      authors,
      type,
      attentions,
      keywords,
      points,
      totalCharacters,
      introduction,
      toc,
    };
  }

  async getChapter(novelId: string, chapterId: string): Promise<RemoteChapter> {
    const $ = await this.client
      .get(`https://kakuyomu.jp/works/${novelId}/episodes/${chapterId}`)
      .text()
      .then((text) => cheerio.load(text));

    $('rp, rt').remove();
    $('br').replaceWith('\n');

    const paragraphs = $('div.widget-episodeBody > p')
      .map((_, el) => $(el).text())
      .get();
    if (paragraphs.length === 0) {
      throw new Error('付费章节，无法获取');
    }

    return { paragraphs };
  }
}
