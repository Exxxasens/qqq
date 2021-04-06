import React from 'react';
import validateRegister from './validateRegister';
import RegisterTemplate from './RegisterTemplate';
import Form from '../../Form';
import { useHistory } from 'react-router-dom';
import ApiContext from '../../contexts/ApiContext';

const Register = () => {
    const history = useHistory();
    const api = React.useContext(ApiContext);

    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState({
        email: null,
        password: null,
        username: null
    });

    const [passwordCriteria, setPasswordCriteria] = React.useState({
        minLength: false,
        lowerCase: false,
        upperCase: false,
        number: false
    });

    const isPasswordClean = () => {
        for (let criteria in passwordCriteria) {
            if (!passwordCriteria[criteria]) return false;
        }
        return true;
    }

    const handleSubmit = (e, { username, email, password }) => {
        e.preventDefault();
        if (loading) return ; // if form submitted
        if (!isPasswordClean()) return; // checking all password crteria
        setLoading(true);

        api.register(username.value, email.value, password.value)
            .then(m => {
                setLoading(false);
                history.push('/register/success');
            })
            .catch(respError => {
                setLoading(false);
                if (respError.hasOwnProperty('field')) {
                    return setError(err => ({ ...err, [respError.field]: respError.message }));
                }
                setMessage(respError.message);
            });
    }

    const handleChange = (state) => {
        setError(validateRegister(state, setPasswordCriteria));
    }

    return (
        <div className='register-wrapper'>
            <div className='register'>
                <div>
                    <h1>Регистрация</h1>
                </div>
                <Form onSubmit={handleSubmit} onChange={handleChange}>
                    { RegisterTemplate(error, passwordCriteria) }
                </Form>
                { message && (<div className='info'>{message}</div>) }  
            </div>
        </div>
    )
}

export default Register;