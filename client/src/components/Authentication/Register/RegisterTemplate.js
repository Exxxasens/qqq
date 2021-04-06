import React from 'react';
import { Link } from 'react-router-dom';

const RegisterTemplate = (error, criteria) => ({
    email = {}, 
    password = {}, 
    repeatPassword = {}, 
    username = {} 
}, inputEventsHandlers) => {
    const isBtnDisabled = (error.password || error.email || error.repeatPassword || !email.value || !password.value || !username.value);
    return (
        <div>
            <div className='input-wrapper'>
                <input
                    name='email'
                    type='text' 
                    placeholder='Почта'
                    autoComplete='false'
                    autoCorrect='false'
                    autoCapitalize='false'
                    aria-invalid={ Boolean(error.email).toString() }
                    { ...inputEventsHandlers }
                    value={email.value || ''}
                />
                <div className='error'>
                    { error.email } 
                </div>
            </div>
            <div className='input-wrapper'>
                <input
                    name='username'
                    type='text' 
                    placeholder='Имя пользователя'
                    autoComplete='false'
                    autoCorrect='false'
                    autoCapitalize='false'
                    aria-invalid={ Boolean(error.username).toString() }
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
                    aria-invalid={ Boolean(error.password).toString() }
                    { ...inputEventsHandlers }
                    value={password.value || ''}
                />
                <div className='error'>
                    { error.password } 
                </div>
                { password.touched && password.value && (
                    <div className='criteria'>
                        <div className='criteria-item' data-valid={criteria.minLength.toString()}>Минимальная длина 8 символов</div>
                        <div className='criteria-item' data-valid={criteria.lowerCase.toString()}>Пароль должен содержать строчные буквы</div>
                        <div className='criteria-item' data-valid={criteria.upperCase.toString()}>Пароль должен содержать заглавные буквы</div>
                        <div className='criteria-item' data-valid={criteria.number.toString()}>Пароль должен содержать цифры</div>
                    </div>
                ) }
            </div>
            <div className='input-wrapper'>
                <input
                    name='repeatPassword'
                    type='password'
                    placeholder='Повторите пароль'
                    aria-invalid={ Boolean(error.repeatPassword).toString() }
                    { ...inputEventsHandlers }
                    value={repeatPassword.value || ''}
                />
                <div className='error'>
                    { error.repeatPassword } 
                </div>
            </div>
            <div className='btn-wrapper'>
                <button 
                    type='submit' 
                    className='submit-btn'
                    disabled={ isBtnDisabled }>Далее</button>
            </div>
            <div className='flex row center'>
                <p>
                    У вас есть аккаунт?
                </p>
                <Link to='/login'>
                    Войти
                </Link>
            </div>
        </div>
    )
}

export default RegisterTemplate;