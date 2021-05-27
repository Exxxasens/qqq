import React from 'react';
import './Authentication.scss';
import ApiContext from '../contexts/ApiContext';
import { connect } from 'react-redux';
import { login } from '../../actions'; 

const Authentication = ({ login }: any): any => {
    const api = React.useContext(ApiContext);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [type, setType] = React.useState('login');

    React.useEffect(() => {
        setUsername('');
        setPassword('');
        setError(null);
    }, [type]);

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

        if (type === 'register') {

            if (password.length < 6) {
                return setError('Пароль слишком короткий. Минимальная длина 6 символов');
            }

            if (username.length < 4) {
                return setError('Никнейм слишком короткий. Минимальная длина 4 символа.');
            }
            
            setLoading(true);
            setError(null);

            return api.register(username, password)
                .then(() => {
                    setError('Пользователь успешно зарегистрирован');
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }

        if (username.length > 0 && password.length > 0) {
            setLoading(true);
            setError(null);
            api.login(username, password)
                .then(token => {
                    setLoading(false);
                    setError(null);
                    login(token);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                })
        }

    }

    return (
        <div className='login-page-wrapper'>
            <div className='login-page'>
                <div className='header'>
                    <h1>
                        { type === 'login' && 'Авторизация' }
                        { type === 'register' && 'Регистрация' } 
                    </h1>
                </div>
                <div className='description'>
                    <p>
                        Для использования сервиса требуется авторизация.
                    </p>
                    <p>
                        Пожалуйста введите логин и пароль для {(type === 'register') ? 'регистрации' : 'авторизации'}.
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
                        <button type='submit' className='submit-btn' disabled={isLoading}>
                            {(type === 'register') ? 'Регистрация' : 'Войти'}
                        </button>
                    </div>

                </form>

                { type === 'login' && (
                    <div className='switch'>
                        Нет аккаунта?
                        <button onClick={() => setType('register')} className='switch-btn'>
                            Регистрация
                        </button>
                    </div>
                )}

                { type === 'register' && (
                    <div className='switch'>
                        Уже есть аккаунт?
                        <button onClick={() => setType('login')} className='switch-btn'>
                            Войти
                        </button>
                    </div>
                )}

            </div>
        </div>
    )

}

const mapActionToProps = (dispatch: any) => {
    return {
        login: (token: string) => dispatch(login(token))
    }
}

export default connect(null, mapActionToProps)(Authentication);