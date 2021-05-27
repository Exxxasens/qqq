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
        console.log(config);
        const response = await fetch(url, config);
        return this.handleNetworkErrors(response);
    }

    handleNetworkErrors = async (response: Response) => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const { error, result }:ServerResponse = await response.json();
        if (error) {

            if (result === 'Токен не валиден') {
                console.log('token deleted')
                localStorage.clear();
            }

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
        this.token = token;
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

    fetchWithToken = async (url: string, config:any = {}) => {
        if (!url) throw new Error('Url is required parameter');
        const Authorization = 'Bearer ' + this.token;
        if (config.hasOwnProperty('headers')) {
            config.headers.Authorization = Authorization;
        } else {
            config.headers = {
                Authorization
            }
        }

        return this.fetchResource(url, config);
    }

    getMe = () => {
        return this.fetchWithToken(`api/user/me`, { method: 'POST' });
    }

}

export default ApiService