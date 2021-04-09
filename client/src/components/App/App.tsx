import React from 'react';
import Menu from '../Menu';
import { Switch, Route, BrowserRouter as Router  } from 'react-router-dom'
import './App.scss';
import { connect } from 'react-redux';
import Game from '../Game';
import CreateGame from '../CreateGame';
import Login from '../Login';
// import Authentication from '../Authentication';

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
                        <>
                            <Menu/>
                            <Switch>
                                

                                <Route path='/create'>
                                    <CreateGame/>
                                </Route>

                                <Route path='/game/:id' exact>
                                    <Game/>
                                </Route>

                            </Switch>
                        </>
                    )
                    :
                    (
                        <Login/>
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