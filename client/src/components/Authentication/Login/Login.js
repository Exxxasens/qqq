import React from 'react';
import LoginTemplate from './LoginTemplate';
import validateLogin from './validateLogin';
import Form from '../../Form';
import ApiContext from '../../contexts/ApiContext';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { useHistory } from 'react-router-dom';

const Login = ({ login }) => {
    const api = React.useContext(ApiContext);
    const history = useHistory();
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState({
        username: null,
        password: null
    });

    const handleSubmit = (e, { username, password }) => {
        e.preventDefault();
        if (loading || message) return ;
        setLoading(true);
        api.login(username.value, password.value)
            .then(response => {
                setLoading(false);
                login(response);
                history.push('/');
            })
            .catch(err => {
                console.log(err);
                setLoading(false)
                return setMessage(err.message);
            });
    }

    const handleFormChange = (state) => {
        setMessage(null);
        setError(validateLogin(state))
    }

    return (
        <div className='login-wrapper'>
            <div className='login'>
                <div>
                    <h1>Авторизация</h1>
                </div>
                <Form onSubmit={handleSubmit} onChange={handleFormChange}>
                    { LoginTemplate(error) }
                </Form>
                {  message && (<div className='info'>
                    { message }
                </div>) }
            </div>
        </div>
    )
}

const mapActionsToProps = (dispatch) => {
    return {
        login: (token) => dispatch(actions.login(token))
    }
}

export default connect(null, mapActionsToProps)(Login);