import React from 'react';
import { Redirect } from 'react-router';
import { connect } from 'react-redux';
import { logout } from '../../../actions';
import ApiContext from '../../contexts/ApiContext';
import useRequest from '../../hooks/useRequest';


const Logout = ({ logout }) => {
    const api = React.useContext(ApiContext);
    const request = React.useCallback(() => {
        return api.logout();
    }, [api]);

    const { status } = useRequest(request);

    React.useEffect(() => {
        if (status === 'ok') logout();
    }, [status, logout]);

    // TODO: loading animation
    if (status === 'loading') return (
        <div>
            loading...
        </div>
    )
    if (status === 'ok') return <Redirect to='/'></Redirect>
    if (status === 'error') {
        // TODO: error handling
        return (
            <div>
                Unexpected error
            </div>
        )
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        logout: () => dispatch(logout())
    }
}

export default connect(null, mapDispatchToProps)(Logout);