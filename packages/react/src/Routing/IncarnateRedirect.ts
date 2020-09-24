import { FC, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export type IncarnateRedirectProps = {
  to: string;
  replace?: boolean;
};

export const IncarnateRedirect: FC<IncarnateRedirectProps> = props => {
  const { to, replace } = props;
  const history = useHistory();

  useEffect(() => {
    if (replace) {
      history.replace(to);
    } else {
      history.push(to);
    }
  }, [to, history, replace]);

  return null;
};
