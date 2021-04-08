import parseJWT from './utils/parseJWT';

type ActionType = {
    type: 'USER_LOGIN' | 'USER_LOGOUT',
    payload: any
}

const reducer = (state: any, action: ActionType) => {

    const defaultState = {
        userId: '',
        username: ''
    }

    if (!state) {
        const token = window.localStorage.getItem('token');
        if (token) {
            const { id, username } = parseJWT(token);
            return {
                ...defaultState,
                userId: id,
                username
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
                username
            }

        case 'USER_LOGOUT':
            return {
                ...state,
                userId: null
            }

        default:
            return state;
    }
}

export default reducer;