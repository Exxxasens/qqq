import React from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';

const PrivateRoute = ({ isAuth, ...rest }: any) => {
    return isAuth ? 
    <Route {...rest} />
    :
    <div>Auth is required</div>
}

const mapStateToProps = (state: any) => {
    const { userId } = state;
    return {
        isAuth: Boolean(userId)
    }
}

export default connect(mapStateToProps)(PrivateRoute);