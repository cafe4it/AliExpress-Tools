require("bootstrap-webpack");
import './index.css';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, browserHistory,IndexRedirect } from 'react-router';
import paths from './path_routes.js';

import Home from './pages/Home.jsx';



let Header = React.createClass({
	render(){
		let appName = chrome.i18n.getMessage('extName');
		return <h1>{appName}</h1>
	}
})

class App extends React.Component{
	constructor(props){
		super(props);
	}
	render(){
		return <div>
			<Header/>
			<div>{this.props.children}</div>
		</div>
	}
}


ReactDOM.render(
	<Router history={browserHistory}>
		<Route path={paths.index} component={App}>
			<IndexRedirect to={paths.home}/>
			<Route path={paths.home} component={Home}/>
		</Route>
	</Router>
	, document.getElementById('app'));
