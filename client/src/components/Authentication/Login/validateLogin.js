const validateLogin = ({ username = {}, password = {} }) => {
    const result = {};
    if (!username.value && username.touched) {
        result.username = 'Необходимо ввести никнейм';
    } else {
        result.username = null;
    }

    if (!password.value && password.touched) {
        result.password = 'Необходимо ввести пароль';
    } else {
        result.password = null;
    }

    return result;
};

export default validateLogin;