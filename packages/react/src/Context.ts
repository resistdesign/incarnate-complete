import { createContext } from 'react';
import { Incarnate } from '@incarnate/core';

export const IncarnateContext = createContext<Incarnate | undefined>(undefined);

export const { Provider, Consumer } = IncarnateContext;
