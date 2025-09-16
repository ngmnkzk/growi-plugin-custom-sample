import React from 'react';
import './GoogleSearch.css';

declare const growiFacade: {
  react: typeof React,
};

interface SearchResult {
  _id: string;
  path: string;
  title: string;
  body: string;
  score: number;
}

interface GoogleSearchProps {
  initialQuery?: string;
  children?: React.ReactNode;
}

export const GoogleSearch: React.FunctionComponent<GoogleSearchProps> = ({ initialQuery = '', children, ...props }) => {
  try {

    if (!growiFacade || !growiFacade.react) {
      console.error('growiFacade.react is not available');
      return <div>Error: React hooks not available</div>;
    }

    const { react } = growiFacade;
    const { useState, useCallback, useEffect } = react;


    const [query, setQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);


    const performSearch = useCallback(async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setHasSearched(true);

      try {
        // GROWI検索APIの複数のエンドポイントを試行
        let response;
        let data;

        // 1. 新しいAPI形式を試行
        try {
          response = await fetch(`/_api/v3/search?q=${encodeURIComponent(searchQuery)}&offset=0&limit=20`);
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
              if (data.data && Array.isArray(data.data)) {
                const validResults = data.data.filter((item: any) => item && typeof item === 'object');
                setResults(validResults);
                return;
              }
            } else {
              console.warn('v3 API returned non-JSON response:', contentType);
            }
          } else {
            console.warn('v3 API response not ok:', response.status, response.statusText);
          }
        } catch (e) {
          console.warn('v3 API failed:', e);
        }

        // 2. 古いAPI形式を試行
        try {
          response = await fetch(`/_api/search?q=${encodeURIComponent(searchQuery)}&offset=0&limit=20`);
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
              if (data.data && Array.isArray(data.data)) {
                const validResults = data.data.filter((item: any) => item && typeof item === 'object');
                setResults(validResults);
                return;
              }
            } else {
              console.warn('v1 API returned non-JSON response:', contentType);
            }
          } else {
            console.warn('v1 API response not ok:', response.status, response.statusText);
          }
        } catch (e) {
          console.warn('v1 API failed:', e);
        }

        // 3. 他のAPI形式を試行
        try {
          response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&offset=0&limit=20`);
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
              if (data.data && Array.isArray(data.data)) {
                const validResults = data.data.filter((item: any) => item && typeof item === 'object');
                setResults(validResults);
                return;
              }
            } else {
              console.warn('v2 API returned non-JSON response:', contentType);
            }
          } else {
            console.warn('v2 API response not ok:', response.status, response.statusText);
          }
        } catch (e) {
          console.warn('v2 API failed:', e);
        }

        // 4. デモ用の検索結果を表示
        console.info('Using demo search results for:', searchQuery);
        const demoResults = [
          {
            _id: 'demo-1',
            path: `/search-demo/${encodeURIComponent(searchQuery)}`,
            title: `Demo: "${searchQuery}" の検索結果`,
            body: `これはデモ用の検索結果です。実際のGROWI環境では、"${searchQuery}"に関連するページが表示されます。`,
            score: 1.0
          },
          {
            _id: 'demo-2',
            path: '/getting-started',
            title: 'GROWIの使い方',
            body: 'GROWIでの基本的な操作方法やMarkdown記法について説明しています。',
            score: 0.8
          },
          {
            _id: 'demo-3',
            path: '/plugins',
            title: 'プラグイン開発ガイド',
            body: 'GROWIプラグインの開発方法とベストプラクティスについて解説します。',
            score: 0.6
          }
        ];
        setResults(demoResults);

      } catch (error) {
        console.error('All search methods failed:', error);
        setResults([
          {
            _id: 'error',
            path: '#',
            title: '検索機能を準備中です',
            body: 'GROWI検索APIの設定を確認してください。現在はデモモードで動作しています。',
            score: 0
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const handleSearch = useCallback(() => {
      performSearch(query);
    }, [query, performSearch]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    }, [handleSearch]);

    const handleLuckySearch = useCallback(() => {
      if (Array.isArray(results) && results.length > 0) {
        // 最初の結果にジャンプ
        window.location.href = results[0].path;
      } else {
        // 検索を実行してから最初の結果にジャンプ
        performSearch(query).then(() => {
          // 結果が得られた場合は次のレンダリングでジャンプ
        });
      }
    }, [query, results, performSearch]);

    // 初期クエリがある場合は自動検索
    useEffect(() => {
      if (initialQuery) {
        performSearch(initialQuery);
      }
    }, [initialQuery, performSearch]);

    const formatSearchResultBody = (body: string | undefined | null, maxLength: number = 150) => {
      if (!body || typeof body !== 'string') return '';
      if (body.length <= maxLength) return body;
      return body.substring(0, maxLength) + '...';
    };

    return (
      <div className="google-search-container">
        <div className="google-search-header">
          <div className="google-logo">
            <span className="logo-g-blue">G</span>
            <span className="logo-r-red">R</span>
            <span className="logo-o-yellow">O</span>
            <span className="logo-w-blue">W</span>
            <span className="logo-i-green">I</span>
          </div>
        </div>

        <div className="google-search-box-container">
          <div className="google-search-box">
            <input
              type="text"
              className="google-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search GROWI pages..."
              autoFocus
            />
            <div className="google-search-icons">
              <button className="search-icon-btn" onClick={handleSearch}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#9aa0a6" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="google-search-buttons">
          <button
            className="google-search-btn"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'GROWI Search'}
          </button>
          <button
            className="google-search-btn"
            onClick={handleLuckySearch}
            disabled={isLoading || (!hasSearched && (!results || !Array.isArray(results) || results.length === 0))}
          >
            I'm Feeling Lucky
          </button>
        </div>

        {hasSearched && (
          <div className="google-search-results">
            {isLoading ? (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                <p>Searching GROWI pages...</p>
              </div>
            ) : (
              <>
                {results && Array.isArray(results) && results.length > 0 && (
                  <div className="search-stats">
                    About {results.length} results for "{query}"
                  </div>
                )}

                <div className="search-results-list">
                  {results && Array.isArray(results) && results.filter((result: any) => result && typeof result === 'object').map((result) => (
                    <div key={result._id || Math.random()} className="search-result-item">
                      <div className="result-url">
                        <a href={result.path || '#'} className="result-link">
                          {window.location.origin + (result.path || '')}
                        </a>
                      </div>
                      <div className="result-title">
                        <a href={result.path || '#'} className="result-title-link">
                          {result.title || result.path || 'Untitled'}
                        </a>
                      </div>
                      <div className="result-snippet">
                        {formatSearchResultBody(result.body)}
                      </div>
                    </div>
                  ))}
                </div>

                {(!results || !Array.isArray(results) || results.length === 0) && (
                  <div className="no-results">
                    <p>Your search - <strong>{query}</strong> - did not match any pages.</p>
                    <p>Suggestions:</p>
                    <ul>
                      <li>Make sure all words are spelled correctly.</li>
                      <li>Try different keywords.</li>
                      <li>Try more general keywords.</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('GoogleSearch component error:', error);
    return <div>Error loading search component</div>;
  }
};

export default GoogleSearch;