import React from 'react';
import useRequest from '../hooks/useRequest';
import ApiContext from '../contexts/ApiContext';

type AccountProps = {
    userId: string
}

const Account = ({ userId }: AccountProps) => {
    const api = React.useContext(ApiContext);
    const request = React.useCallback(() => {



    }, []);

    const response = useRequest(request);



    return (
        <div className='account'>
            <div>
                <h1>
                    Статистика
                </h1>
            </div>

        </div>
    )
}

export default Account;