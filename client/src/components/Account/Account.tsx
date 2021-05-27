import React from 'react';
import './Account.scss';
import useRequest from '../hooks/useRequest';
import ApiContext from '../contexts/ApiContext';
import Loading from '../Loading';

const Account = () => {
    const api = React.useContext(ApiContext);
    const request = React.useCallback(() => {
        return api.getMe();
    }, []);

    const { data, status } = useRequest(request);

    const getPercent = (n: number) => {
        
        return (Number(n.toFixed(5)) * 100) + '%';
    }

    if (status === 'error') {
        return (
            <div className='error'>
                <h1>Ошибка</h1>
                <div>{ data }</div>
            </div>
        )
    }

    if (status === 'loading') {
        return <Loading/>
    }

    if (status === 'ok') {
        const { username, games_played, won } = data;
        
        const StatsBlock = () => {

            let wonStat = null
            if (won === 0) {
                wonStat = <div>Побед: { 0 }</div>
            } else {
                wonStat = <div>Побед: { won } ({ getPercent(won / games_played)  })</div>
            }

            return (
                <>
                    <div>Всего игр сыграно: { games_played }</div>
                    { wonStat }
                </>
            )


        }

        return (
            <div className='account'>
                <div>
                    <h1>
                        Статистика пользователя { username }
                    </h1>
    
                    <div className='stats'>
    
                        <StatsBlock/>
                        
                    </div>
    
                </div>
    
            </div>
        )
    }
}

export default Account;