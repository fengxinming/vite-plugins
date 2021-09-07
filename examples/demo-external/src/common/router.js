import { createElement } from 'react';
import { Router as ReactRouter, Redirect, Route, Switch } from 'react-router';
import { createHashHistory, createBrowserHistory, createMemoryHistory } from 'history';
import { objectWithoutProperties, pathJoin } from 'celia';

function createName() {
  return Math.random().toString(36).slice(2);
}

function createHistoryBy(mode, historyOptions) {
  switch (mode) {
    case 'hash':
      return createHashHistory(historyOptions);
    case 'history':
      return createBrowserHistory(historyOptions);
    case 'memory':
      return createMemoryHistory(historyOptions);
    default:
      throw new Error(`invalid mode: ${mode}`);
  }
}

function createRoute(
  parentName,
  parentPath,
  route,
  routeConfigCache,
) {
  // 具名路由
  let name = route.name || route.key;
  if (!name) {
    name = `${parentName}.${createName()}`;
    route.name = name;
  }

  // 解析了之后直接执行
  const routeCache = routeConfigCache[name];
  if (routeCache) {
    return routeCache.render(routeCache.props);
  }

  let { path } = route;
  if (!path) {
    throw new Error(`Missing path in named route ${name}`);
  }
  path = pathJoin(parentPath || '', path);

  const redirect = route.redirect || route.to;
  if (redirect) {
    const props = {
      key: name,
      exact: true,
      from: path,
      to: redirect
    };
    const render = function (props) {
      return createElement(Redirect, props); // 跳转路由
    };
    routeConfigCache[name] = { props, render };
    return render(props);
  }

  const routeConfig = objectWithoutProperties(route, [
    'to',
    'redirect',
    'component',
    'render',
    'children'
  ]);
  routeConfig.path = path;
  routeConfig.key = name;

  const { component, children, render } = route;

  routeConfig.render = function (cprops) {
    cprops.route = routeConfig;
    return render ? render(cprops) : createElement(component, cprops);
  };

  const routeRender = function (props) {
    return !children || !children.length
      ? createElement(Route, props)
      : createElement(
        component,
        { key: `${name}-component`, route: props },
        createSwitch(name, path, children, routeConfigCache)
      ); // 如果有子路由，先创建对应的组件，再递归创建 Route
  };
  routeConfigCache[name] = { props: routeConfig, render: routeRender };
  return routeRender(routeConfig);
}

function createSwitch(parentName, parentPath, routes, routeConfigCache) {
  return createElement(
    Switch,
    null,
    routes.map((route) => {
      return createRoute(
        parentName,
        parentPath,
        route,
        routeConfigCache
      );
    })
  );
}

export function create({
  mode,
  routes,
  ...historyOptions
}) {
  const history = createHistoryBy(mode, historyOptions);
  const routeConfigCache = {};

  return {
    history,

    Router() {
      return createElement(
        ReactRouter,
        { history },
        createSwitch(
          'router',
          '',
          routes,
          routeConfigCache
        )
      );
    }
  };
}
