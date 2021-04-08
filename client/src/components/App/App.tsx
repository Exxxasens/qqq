import React from 'react';
import Menu from '../Menu';
import { Switch, Route, BrowserRouter as Router  } from 'react-router-dom'
import PrivateRoute from '../PrivateRoute';
import './App.scss';
import { connect } from 'react-redux';
import { Login, Register } from '../Authentication'
import Game from '../Game';
import CreateGame from '../CreateGame';

type AppProps = {
    userId: string
};

const App = ({ userId }: AppProps) => {
    const isAuth:boolean = Boolean(userId);

    return (
        <Router>
            <div className='app'>
                <Switch>
                    <Route path='/' exact>
                        {
                            isAuth ? <Menu/> : <Login/>
                        }
                    </Route>
                    <Route path='/create' exact>
                        <CreateGame/>
                    </Route>
                    <Route path='/game/:id' children={<Game/>} exact/>
                </Switch>
            </div>
        </Router>
    )
}

const mapStateToProps = (state: any): AppProps => {
    return {
        userId: state.userId
    }
}

export default connect(mapStateToProps)(App);