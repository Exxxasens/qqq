export const login = (token: string) => {
    return {
        type: 'USER_LOGIN',
        payload: {
            token
        }
    }
}

export const logout = () => {
    return {
        type: 'USER_LOGOUT',
        payload: {}
    }
}