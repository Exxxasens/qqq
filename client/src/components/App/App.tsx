import React from 'react';
import Menu from '../Menu';
import { Switch, Route, BrowserRouter as Router  } from 'react-router-dom'
import './App.scss';
import { connect } from 'react-redux';
import Game from '../Game';
import CreateGame from '../CreateGame';
import Authentication from '../Authentication';
import Logout from '../Logout';
import Connect from '../Connect';
import Account from '../Account';

type AppProps = {
    userId: string
};

const App = ({ userId }: AppProps) => {
    const isAuth:boolean = Boolean(userId);

    return (
        <Router>
            <div className='app'>
                {
                    isAuth ? 
                    (
                        <Switch>
                            <Route path='/' exact>
                                <Menu/>
                            </Route>

                            <Route path='/create'>
                                <Menu/>
                                <CreateGame/>
                            </Route>

                            <Route path='/game/connect'>
                                <Menu/>
                                <Connect/>
                            </Route>

                            <Route path='/game/:id' exact>
                                <Game/>
                            </Route>

                            <Route path='/logout'>
                                <Logout/>
                            </Route>

                            <Route path='/me'>
                                <Account/>
                            </Route>

                        </Switch>
                    )
                    :
                    (
                        <Switch>
                            <Route path='/logout'>
                                <Logout/>
                            </Route>
                            <Route path='/'>
                                <Authentication/>
                            </Route>
                        </Switch>
                    )
                }
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