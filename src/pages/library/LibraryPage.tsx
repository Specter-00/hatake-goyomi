import { useState } from 'react';
import { X, ChevronLeft, Search, Clock, BookOpen, ChevronRight } from 'lucide-react';
import {
  LIBRARY_ARTICLES, LIBRARY_CATEGORIES,
  searchArticles, type LibraryArticle, type LibraryCategory,
} from '../../data/library';

interface LibraryPageProps {
  onClose: () => void;
}

/**
 * 学習ライブラリ
 * 沖縄の栽培知識を「読みもの」として楽しめる画面。
 * 読書ビューは行間・文字サイズを読みやすさ最優先で設計。
 */
export function LibraryPage({ onClose }: LibraryPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | null>(null);
  const [query, setQuery] = useState('');
  const [article, setArticle] = useState<LibraryArticle | null>(null);

  const filtered = (query
    ? searchArticles(query)
    : selectedCategory
    ? LIBRARY_ARTICLES.filter(a => a.category === selectedCategory)
    : LIBRARY_ARTICLES
  );

  /* ===== 記事リーダー ===== */
  if (article) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-base flex flex-col" data-testid="library-reader">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top flex items-center gap-3">
          <button onClick={() => setArticle(null)} className="p-1 -ml-1" data-testid="reader-back">
            <ChevronLeft size={22} className="text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-wakatake font-medium">{article.category}</p>
          </div>
          <button onClick={onClose} className="p-1 -mr-1">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <article className="px-6 py-6 pb-24 max-w-lg mx-auto">
            {/* タイトルブロック */}
            <div className="mb-8">
              <div className="text-4xl mb-3">{article.emoji}</div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">
                {article.title}
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{article.summary}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} />
                <span>約{article.readMinutes}分で読めます</span>
              </div>
            </div>

            {/* 本文 */}
            <div className="space-y-8">
              {article.sections.map((section, i) => (
                <section key={i}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-1 self-stretch rounded-full bg-wakatake flex-shrink-0 mt-0.5" />
                    <h2 className="text-base font-bold text-gray-800 leading-snug">
                      {section.heading}
                    </h2>
                  </div>
                  {section.body.split('\n\n').map((para, j) => (
                    <p
                      key={j}
                      className="text-[15px] text-gray-700 mb-4 whitespace-pre-line"
                      style={{ lineHeight: 1.95, letterSpacing: '0.01em' }}
                    >
                      {para}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            {/* 出典 */}
            {article.sources && (
              <div className="mt-10 pt-4 border-t border-gray-100">
                {article.sources.map((s, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed">※ {s}</p>
                ))}
              </div>
            )}

            {/* 次の記事へ */}
            <NextArticleNav current={article} onSelect={setArticle} />
          </article>
        </div>
      </div>
    );
  }

  /* ===== 記事一覧 ===== */
  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col" data-testid="library-page">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <BookOpen size={18} className="text-wakatake" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-800">まなぶ</h1>
            <p className="text-xs text-gray-400">沖縄の栽培知識ライブラリ</p>
          </div>
          <button onClick={onClose} className="p-1 -mr-1">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        {/* 検索 */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="キーワードで探す（例：台風、土、ゴーヤー）"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            data-testid="library-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {/* カテゴリ選択（検索中は非表示） */}
        {!query && (
          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 gap-2.5">
              {LIBRARY_CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  className={`text-left rounded-2xl border p-3.5 transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-wakatake border-wakatake'
                      : 'bg-white border-gray-100 shadow-soft'
                  }`}
                  data-testid={`library-cat-${cat.key}`}
                >
                  <div className="text-xl mb-1.5">{cat.emoji}</div>
                  <p className={`text-sm font-bold mb-0.5 ${
                    selectedCategory === cat.key ? 'text-white' : 'text-gray-800'
                  }`}>
                    {cat.key}
                  </p>
                  <p className={`text-[11px] leading-relaxed ${
                    selectedCategory === cat.key ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    {cat.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 記事リスト */}
        <div className="px-5 pt-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 px-1">
            {query
              ? `「${query}」の検索結果 ${filtered.length}件`
              : selectedCategory
              ? selectedCategory
              : `すべての記事（${filtered.length}本）`}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">見つかりませんでした</p>
              <p className="text-xs text-gray-400 mt-1">別のキーワードで試してみてください</p>
            </div>
          ) : (
            filtered.map(a => (
              <button
                key={a.id}
                onClick={() => setArticle(a)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-soft p-4 active:scale-[0.99] transition-transform"
                data-testid={`library-article-${a.id}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] text-wakatake font-medium">{a.category}</p>
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Clock size={9} />{a.readMinutes}分
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 leading-snug mb-1">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{a.summary}</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 flex-shrink-0 mt-2" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** 同カテゴリの次の記事への導線 */
function NextArticleNav({ current, onSelect }: {
  current: LibraryArticle;
  onSelect: (a: LibraryArticle) => void;
}) {
  const sameCategory = LIBRARY_ARTICLES.filter(a => a.category === current.category);
  const idx = sameCategory.findIndex(a => a.id === current.id);
  const next = sameCategory[idx + 1] ?? sameCategory[0];
  if (!next || next.id === current.id) return null;

  return (
    <button
      onClick={() => { onSelect(next); window.scrollTo(0, 0); }}
      className="mt-8 w-full text-left bg-white rounded-2xl border border-gray-100 shadow-soft p-4 active:scale-[0.99] transition-transform"
    >
      <p className="text-[10px] text-gray-400 mb-1">次に読む</p>
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{next.emoji}</span>
        <p className="flex-1 text-sm font-bold text-gray-800">{next.title}</p>
        <ChevronRight size={15} className="text-gray-300" />
      </div>
    </button>
  );
}
