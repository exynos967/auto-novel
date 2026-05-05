import type { CheerioAPI } from 'cheerio';
import * as cheerio from 'cheerio';
import type { KyInstance } from 'ky';
import pLimit from 'p-limit';

import { parseJapanDateString } from '@/utils';

import {
  type RemoteChapter,
  type RemoteNovelMetadata,
  type TocItem,
  type WebNovelAuthor,
  type WebNovelProvider,
  WebNovelAttention,
  WebNovelType,
} from './types';

function parseAttention(tag: string): WebNovelAttention | undefined {
  switch (tag.trim()) {
    case 'R15':
    case 'R-15':
      return WebNovelAttention.R15;
    case 'R18':
    case 'R-18':
      return WebNovelAttention.R18;
    case '残酷描写有り':
    case '残酷描写あり':
    case '残酷な描写':
    case '残酷な描写あり':
      return WebNovelAttention.Cruelty;
    case '暴力描写有り':
    case '暴力描写あり':
      return WebNovelAttention.Violence;
    case '性描写有り':
    case '性的表現あり':
      return WebNovelAttention.SexualContent;
    default:
      return undefined;
  }
}

function parseWebNovelType(typeText: string): WebNovelType {
  switch (typeText) {
    case '完結済':
      return WebNovelType.Completed;
    case '連載中':
      return WebNovelType.Ongoing;
    case '短編':
      return WebNovelType.ShortStory;
    default:
      throw new Error(`无法解析的小说类型: ${typeText}`);
  }
}

function hrefLastSegment(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const normalized = href.endsWith('/') ? href.slice(0, -1) : href;
  const index = normalized.lastIndexOf('/');
  return index === -1 ? normalized : normalized.slice(index + 1);
}

export class Syosetu implements WebNovelProvider {
  readonly id = 'syosetu';
  readonly version = '2.0.0';

  client: KyInstance;

  private options: {
    concurrency: number;
  };

  constructor(
    client: KyInstance,
    options?: {
      concurrency?: number;
    },
  ) {
    this.client = client;
    this.options = {
      concurrency: Math.max(1, Math.floor(options?.concurrency ?? 1)),
    };
  }

  async getMetadata(novelId: string): Promise<RemoteNovelMetadata | null> {
    const [$, $info] = await Promise.all([
      this.client
        .get(`https://ncode.syosetu.com/${novelId}`)
        .text()

        .then((text) => cheerio.load(text)),
      this.client
        .get(`https://ncode.syosetu.com/novelview/infotop/ncode/${novelId}`)
        .text()
        .then((text) => cheerio.load(text)),
    ]);

    const title = $info('h1').first().text().trim();
    if (!title) throw new Error('标题解析失败');

    const infoData = $info('.p-infotop-data').first();
    const infoType = $info('.p-infotop-type').first();
    if (infoData.length === 0 || infoType.length === 0)
      throw new Error('作品信息解析失败');

    const row = (label: string) =>
      infoData
        .find('dt')
        .filter((_, el) => $info(el).text().trim() === label)
        .first()
        .next();

    const authorCell = row('作者名');
    const authorName = authorCell.text().trim();
    if (!authorName) throw new Error('作者解析失败');
    const authorLink = authorCell.find('a').attr('href');
    const authors: WebNovelAuthor[] = [{ name: authorName, link: authorLink }];

    const typeText = infoType
      .find('.p-infotop-type__type')
      .first()
      .text()
      .trim();
    if (!typeText) throw new Error('小说类型解析失败');
    const type = parseWebNovelType(typeText);

    const attentionSet = new Set<WebNovelAttention>();
    const keywords: string[] = [];

    const keywordTags = row('キーワード')
      .text()
      .trim()
      .split(/[\s\u00A0]+/)
      .map((it) => it.trim())
      .filter(Boolean);
    for (const tag of keywordTags) {
      const attention = parseAttention(tag);
      if (attention) {
        attentionSet.add(attention);
      } else {
        keywords.push(tag);
      }
    }

    const r18Text = infoType.find('.p-infotop-type__r18').first().text().trim();
    if (r18Text) {
      if (r18Text === 'R18') {
        attentionSet.add(WebNovelAttention.R18);
      } else {
        throw new Error(`无法解析的注意事项: ${r18Text}`);
      }
    }

    function extractNumber(text: string): number | undefined {
      const digits = text.replace(/[^0-9]/g, '');
      if (digits.length === 0) return undefined;
      const value = Number(digits);
      return Number.isFinite(value) ? value : undefined;
    }

    const points = extractNumber(row('総合評価').text());

    const totalCharacters = extractNumber(row('文字数').text());
    if (!totalCharacters) throw new Error('字数解析失败');

    const introduction = row('あらすじ').text().trim();
    if (!introduction) throw new Error('简介解析失败');

    let toc: TocItem[];
    if ($('div.p-eplist').first().length === 0) {
      toc = [
        {
          title: '无名',
          chapterId: 'default',
          createAt: undefined,
        },
      ];
    } else {
      const lastPageHref = $('.c-pager__item--last').first().attr('href');
      const totalPages = Number(lastPageHref?.split('/?p=')[1] ?? '1') || 1;
      const limit = pLimit(this.options.concurrency);

      function parseTocPage($: CheerioAPI): TocItem[] {
        return $('div.p-eplist')
          .first()
          .children()
          .map((_, element) => {
            const item = $(element);
            const link = item.find('a').first();

            if (link.length === 0) {
              return {
                title: item.text().trim(),
                chapterId: undefined,
                createAt: undefined,
              } satisfies TocItem;
            }

            const createAtText = item
              .find('div.p-eplist__update')
              .contents()
              .filter((_, node) => node.type === 'text')
              .first()
              .text()
              .trim();
            const createAt = parseJapanDateString(
              'yyyy/MM/dd HH:mm',
              createAtText,
            )?.toISOString();

            return {
              title: link.text().trim(),
              chapterId: hrefLastSegment(link.attr('href')),
              createAt,
            } satisfies TocItem;
          })
          .get();
      }

      toc = parseTocPage($);
      const tocPageNumbers = Array.from(
        { length: Math.max(0, totalPages - 1) },
        (_, index) => index + 2,
      );
      const pageTocs = await Promise.all(
        tocPageNumbers.map((page) =>
          limit(async () => {
            const $page = await this.client
              .get(`https://ncode.syosetu.com/${novelId}/?p=${page}`)
              .text()
              .then((text) => cheerio.load(text));

            return parseTocPage($page);
          }),
        ),
      );
      toc.push(...pageTocs.flat());
    }

    return {
      title,
      authors,
      type,
      attentions: Array.from(attentionSet),
      keywords,
      points,
      totalCharacters,
      introduction,
      toc,
    };
  }

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<RemoteChapter | null> {
    const url =
      chapterId === 'default'
        ? `https://ncode.syosetu.com/${novelId}`
        : `https://ncode.syosetu.com/${novelId}/${chapterId}`;

    const $ = await this.client
      .get(url)
      .text()
      .then((text) => cheerio.load(text));

    $('rp, rt').remove();
    $('br').replaceWith('\n');

    const paragraphs = $('div.p-novel__body > div > p')
      .map((_, paragraph) => {
        const p = $(paragraph);
        const image = p.children().first().children().first();
        if (image.length > 0 && image.is('img')) {
          return `<图片>https:${image.attr('src') ?? ''}`;
        }
        return p.text();
      })
      .get();

    return { paragraphs };
  }
}
