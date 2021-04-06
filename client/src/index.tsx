import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import reducer from './reducer';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

const store = createStore(reducer);

const root = document.getElementById('root');

ReactDOM.render(
	<React.StrictMode>
		<Provider store={store}>
			<App/>
		</Provider>
	</React.StrictMode>,
	root
);
