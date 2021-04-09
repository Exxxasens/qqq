import React from 'react';
import ApiContext from '../contexts/ApiContext';
import { connect } from 'react-redux';
import { login } from '../../actions';
import './Login.scss';

type LoginProps = {
    login: (token: string) => any
}

const Login = ({ login }: LoginProps) => {
    const api = React.useContext(ApiContext);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const onUsernameChange = (e: React.ChangeEvent) => {
        if (e.target instanceof HTMLInputElement) {
            let { value } = e.target;
            setUsername(value);
        }
    }

    const onPasswordChange = (e: React.ChangeEvent) => {
        if (e.target instanceof HTMLInputElement) {
            let { value } = e.target;
            setPassword(value);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading) return;

        if (username.length > 0 && password.length > 0) {
            setLoading(true);
            setError(null);
            api.login(username, password)
                .then(token => {
                    console.log('token', token);
                    setLoading(false);
                    setError(null);
                    login(token);
                })
                .catch(err => {
                    setError(err.message);
                })
        }

    }
    
    return (
        <div className='login-page-wrapper'>
            <div className='login-page'>
                <div className='header'>
                    <h1>Авторизация</h1>
                </div>
                <div className='description'>
                    <p>
                        Для использования сервиса требуется авторизация.
                    </p>
                    <p>
                        Пожалуйста введите логин и пароль для авторизации.
                    </p>
                </div>
                <form className='login-form' onSubmit={handleSubmit}>
                    <div className='username-input-wrapper'>
                        <div className='label-wrapper'>
                            <label className='username-label'>Никнейм</label>
                        </div>
                        <div className='input-wrapper'>
                            <input 
                                className='username-input'
                                type='text'
                                name='username'
                                onChange={onUsernameChange} 
                                value={username}
                            />
                        </div>
                    </div>

                    <div className='password-input-wrapper'>
                        <div className='label-wrapper'>
                            <label className='password-label'>Пароль</label>
                        </div>
                        <div className='input-wrapper'>
                            <input
                                className='password-input'
                                type='password'
                                name='username'
                                onChange={onPasswordChange}
                                value={password}
                            />
                        </div>
                    </div>

                    {
                        error && (
                            <div className='error'>
                                { error }
                            </div>
                        )
                    }

                    <div className='submit-btn-wrapper'>
                        <button type='submit' className='submit-btn'>
                            Войти
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

const mapActionToProps = (dispatch: any) => {
    return {
        login: (token: string) => dispatch(login(token))
    }
}



export default connect(null, mapActionToProps)(Login);