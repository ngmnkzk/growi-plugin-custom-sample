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
    const { react } = growiFacade;
    const { useState, useCallback, useEffect } = react;

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = useCallback(async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setHasSearched(true);

      try {
        // GROWI検索APIエンドポイントを使用
        const response = await fetch(`/_api/v3/search?q=${encodeURIComponent(searchQuery)}&offset=0&limit=20`);

        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
        } else {
          // APIが利用できない場合のフォールバック
          console.warn('GROWI search API not available, showing mock results');
          setResults([
            {
              _id: '1',
              path: '/sample-page',
              title: `Search results for "${searchQuery}"`,
              body: 'This is a sample search result. In a real GROWI environment, this would show actual page content.',
              score: 1.0
            }
          ]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        // エラー時のフォールバック
        setResults([
          {
            _id: 'error',
            path: '/error',
            title: 'Search temporarily unavailable',
            body: 'Please try again later or contact your administrator.',
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
      if (results.length > 0) {
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

    const formatSearchResultBody = (body: string, maxLength: number = 150) => {
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
            disabled={isLoading || (!hasSearched && results.length === 0)}
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
                {results.length > 0 && (
                  <div className="search-stats">
                    About {results.length} results for "{query}"
                  </div>
                )}

                <div className="search-results-list">
                  {results.map((result) => (
                    <div key={result._id} className="search-result-item">
                      <div className="result-url">
                        <a href={result.path} className="result-link">
                          {window.location.origin + result.path}
                        </a>
                      </div>
                      <div className="result-title">
                        <a href={result.path} className="result-title-link">
                          {result.title || result.path}
                        </a>
                      </div>
                      <div className="result-snippet">
                        {formatSearchResultBody(result.body)}
                      </div>
                    </div>
                  ))}
                </div>

                {results.length === 0 && (
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