import React from 'react';

import { h, Properties } from 'hastscript';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

// import { getReactHooks } from '../react-hooks';

import './Hello.css';
import { GoogleSearch } from './GoogleSearch';

declare const growiFacade : {
  react: typeof React,
};

type FakeJson = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
export const helloGROWI = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const { react } = growiFacade;
      const { useEffect, useCallback, useState } = react;
      // ボタンのクリックイベントでカウントアップするためのstate
      const [count, setCount] = useState(0);
      // 外部データを取得して適用するためのstate
      const [obj, setObj] = useState<FakeJson | null>(null);

      // useEffectで外部データを取得
      const getFakeJson = async(count: number) => {
        const url = `https://jsonplaceholder.typicode.com/todos/${count}`;
        const response = await fetch(url);
        const json = await response.json() as FakeJson;
        setObj(json);
      };

      // countが変更されたら外部データを取得
      useEffect(() => {
        if (count > 0) getFakeJson(count);
      }, [count]);

      const { plugin } = JSON.parse(props.title);
      if (plugin) {
        return (
          <>
            <a {...props}>{children}</a>
            <div>Count: {count}</div>
            <button
              onClick={useCallback(() => setCount(c => c + 1), [])}
            >
              Up
            </button>
            { obj && (
              <div>
                <h2>{obj.title}</h2>
                <div>{obj.id} & {obj.userId}</div>
                <p>{obj.completed ? 'Completed' : 'Not Completed'}</p>
              </div>
            )}
          </>
        );
      }
    }
    catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return (
      <Tag {...props}>{children}</Tag>
    );
  };
};

export const enhancedGROWI = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const parsedTitle = JSON.parse(props.title || '{}');
      const { plugin, search } = parsedTitle;

      // Handle search directive
      if (search) {
        let queryString = '';
        if (children) {
          if (Array.isArray(children)) {
            queryString = children.filter(child =>
              typeof child === 'string' || typeof child === 'number'
            ).join('');
          } else if (typeof children === 'string' || typeof children === 'number') {
            queryString = String(children);
          }
        }
        return <GoogleSearch initialQuery={queryString} />;
      }

      // Handle original plugin directive
      if (plugin) {
        const { react } = growiFacade;
        const { useEffect, useCallback, useState } = react;
        const [count, setCount] = useState(0);
        const [obj, setObj] = useState<FakeJson | null>(null);

        const getFakeJson = async(count: number) => {
          const url = `https://jsonplaceholder.typicode.com/todos/${count}`;
          const response = await fetch(url);
          const json = await response.json() as FakeJson;
          setObj(json);
        };

        useEffect(() => {
          if (count > 0) getFakeJson(count);
        }, [count]);

        return (
          <>
            <a {...props}>{children}</a>
            <div>Count: {count}</div>
            <button
              onClick={useCallback(() => setCount(c => c + 1), [])}
            >
              Up
            </button>
            { obj && (
              <div>
                <h2>{obj.title}</h2>
                <div>{obj.id} & {obj.userId}</div>
                <p>{obj.completed ? 'Completed' : 'Not Completed'}</p>
              </div>
            )}
          </>
        );
      }
    }
    catch (err) {
      // console.error('enhancedGROWI error:', err);
    }
    return <Tag {...props}>{children}</Tag>;
  };
};

interface GrowiNode extends Node {
  name: string;
  data: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | { type: string, value: string, url?: string }[];
    [key: string]: any;
  };
  type: string;
  attributes: {[key: string]: string}
  children: GrowiNode[] | { type: string, value: string, url?: string }[];
  value: string;
  title?: string;
  url?: string;
}


export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    // You can use 2nd argument for specific node type
    // visit(tree, 'leafDirective', (node: Node) => {
    // :plugin[xxx]{hello=growi} -> textDirective
    // ::plugin[xxx]{hello=growi} -> leafDirective
    // :::plugin[xxx]{hello=growi} -> containerDirective
    visit(tree, (node: Node) => {
      const n = node as unknown as GrowiNode;

      if (n.name === 'plugin') {
        const data = n.data || (n.data = {});
        // Render your component
        const { value } = n.children[0] || { value: '' };
        data.hName = 'a'; // Tag name
        data.hChildren = [{ type: 'text', value: `🚀 ${value} - Custom Plugin!` }]; // Children
        // Set properties
        data.hProperties = {
          href: 'https://example.com/rss',
          title: JSON.stringify({ ...n.attributes, ...{ plugin: true } }), // Pass to attributes to the component
        };
      }

      if (n.name === 'search') {
        const data = n.data || (n.data = {});
        // Render Google search component using a tag like plugin
        const { value } = n.children[0] || { value: '' };
        data.hName = 'a'; // Use a tag to trigger googleSearchGROWI component
        data.hChildren = [{ type: 'text', value }]; // Pass search query as children
        // Set properties for search component
        data.hProperties = {
          href: '#', // Dummy href
          className: 'growi-google-search',
          title: JSON.stringify({ ...n.attributes, ...{ search: true } }),
        };
      }
    });
  };
};

export const rehypePlugin: Plugin = () => {
  return (tree: Node) => {
    // This plugin is currently disabled
    // You can add custom rehype transformations here if needed
  };
};
