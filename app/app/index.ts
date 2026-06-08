import { registerRootComponent } from 'expo';
import { initSentry, wrapRoot } from './src/lib/sentry';
import App from './App';

initSentry();
registerRootComponent(wrapRoot(App));
