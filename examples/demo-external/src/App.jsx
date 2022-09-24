import { useState, useLayoutEffect } from 'react';
import { Layout } from '@linkdesign/components';
import { useRoutes, Router as ReactRouter } from 'react-router';
import history from './router/history';
import menuConfig from './config/menu';
import topBarConfig from './config/topBar';
import routes from './config/routes';

const LayoutContainer = Layout.container;

function Routes() {
  return useRoutes(routes);
}

function Router() {
  const [state, setState] = useState({
    action: history.action,
    location: history.location
  });

  useLayoutEffect(() => {
    history.listen(setState);
  }, []);

  return (
    <ReactRouter
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      <LayoutContainer
        top={topBarConfig}
        nav={menuConfig}
      >
        <Routes />
      </LayoutContainer>
    </ReactRouter>
  );
}


export default Router;
