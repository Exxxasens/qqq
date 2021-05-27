import parseJWT from './utils/parseJWT';

type ActionType = {
    type: 'USER_LOGIN' | 'USER_LOGOUT',
    payload: any
}

const reducer = (state: any, action: ActionType) => {

    const defaultState = {
        userId: '',
        username: '',
        token: ''
    }

    if (!state) {
        const token = window.localStorage.getItem('token');
        if (token) {
            const { id, username } = parseJWT(token);
            return {
                ...defaultState,
                userId: id,
                username,
                token
            }
        }
        return {
            ...defaultState
        }
    }

    switch (action.type) {
        case 'USER_LOGIN':
            const { token } = action.payload;
            const { id, username } = parseJWT(token);
            return {
                ...state,
                userId: id,
                username,
                token
            }

        case 'USER_LOGOUT':
            localStorage.clear();
            return {
                ...state,
                userId: null,
                token: null,
                username: null
            }

        default:
            return state;
    }
}

export default reducer;