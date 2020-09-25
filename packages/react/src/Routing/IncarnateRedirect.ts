import { FC, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getUrl, IncarnateRoutePathContext } from './IncarnateRoute';

export type IncarnateRedirectProps = {
  to: string;
  replace?: boolean;
};

export const IncarnateRedirect: FC<IncarnateRedirectProps> = props => {
  const { to, replace } = props;
  const currentRoutePath = useContext(IncarnateRoutePathContext);
  const newRoutePath = getUrl(currentRoutePath, to);
  const history = useHistory();

  useEffect(() => {
    if (replace) {
      history.replace(newRoutePath);
    } else {
      history.push(newRoutePath);
    }
  }, [newRoutePath, history, replace]);

  return null;
};
