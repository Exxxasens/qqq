const validateRegister = ({ email = {}, password = {}, repeatPassword = {}, username = {} }, setPasswordCriteria) => {
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    const oneUppercaseLetter = /(?=.*?[A-Z])/;
    const oneLowercaseLetter = /(?=.*?[a-z])/;
    const oneDigit = /(?=.*?[0-9])/;
    const lengthRegex = /[A-Za-z0-9]{8,32}/;
    const result = {};

    if (!email.value && email.touched) {
        result.email = 'Необходимо ввести почту';
    } else if (!email.focused && email.touched && !emailRegex.test(email.value)) {
        result.email = 'Некорректная почта';
    } else {
        result.email = null;
    }

    if (!username.value && username.touched) {
        result.username = 'Необходимо ввести имя пользователя';
    } else if (username.value && !username.focused && username.value.length < 4) {
        result.username = 'Имя слишком короткое';
    }

    if (!password.value && password.touched) {
        result.password = 'Необходимо ввести пароль';
    } else {

        const minLength = lengthRegex.test(password.value);
        const lowerCase = oneLowercaseLetter.test(password.value);
        const upperCase = oneUppercaseLetter.test(password.value);
        const number = oneDigit.test(password.value);

        setPasswordCriteria({
            minLength,
            lowerCase,
            upperCase,
            number
        });

        result.password = null;
    }

    if (password.value
        && repeatPassword.value
        && password.value !== repeatPassword.value
        && password.touched 
        && repeatPassword.touched) {
            result.repeatPassword = 'Пароли должны совпадать';
    } else {
        result.repeatPassword = null;
    }

    return result;
};

export default validateRegister;