type ServerResponse = {
    error: boolean,
    result: any
}

class ApiService {
    token: string

    constructor() {
        const token:string = window.localStorage.getItem('token') || '';
        this.token = token;
    }

    fetchResource = async (url: string, config: object) => {
        const response = await fetch(url, config);
        return this.handleNetworkErrors(response);
    }

    handleNetworkErrors = async (response: Response) => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const { error, result }:ServerResponse = await response.json();
        if (error) {
            throw new Error(result);
        }
        return result;
    }

    login = async (username: string, password: string) => {
        const body = {
            username,
            password
        }
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
        const token = await this.fetchResource('/api/login', config);
        window.localStorage.setItem('token', token);
        return token;
    }

    register = async (username: string, password: string) => {
        const body = {
            username,
            password
        }
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
        return this.fetchResource('/api/register', config);
    }

}

export default ApiService