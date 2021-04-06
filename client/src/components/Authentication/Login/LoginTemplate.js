import React from 'react';
import { Link } from 'react-router-dom';

const LoginTemplate = (error) => ({ username = {}, password = {} }, inputEventsHandlers) => {
    const isBtnDisabled = (!username.value || !password.value);
    return (
        <div>
            <div className='input-wrapper'>
                <input
                    name='username'
                    type='text' 
                    placeholder='Никнейм'
                    autoComplete='false'
                    autoCorrect='false'
                    autoCapitalize='false'
                    aria-disabled={ Boolean(error.username).toString() }
                    { ...inputEventsHandlers }
                    value={username.value || ''}
                />
                <div className='error'>
                    { error.username } 
                </div>
            </div>
            <div className='input-wrapper'>
                <input
                    name='password'
                    type='password'
                    placeholder='Пароль'
                    { ...inputEventsHandlers }
                    value={password.value || ''}
                />
                <div className='error'>
                    { error.password } 
                </div>
            </div>
            <div className='btn-wrapper'>
                <button 
                    type='submit' 
                    className='submit-btn'
                    disabled={ isBtnDisabled ? 'invalid' : null }>Войти</button>
            </div>
            <div className='flex row center'>
                <p>
                    У вас нет аккаунта?
                </p>
                <Link to='/register'>
                    Регистрация
                </Link>
            </div>
        </div>
    )
}

export default LoginTemplate;