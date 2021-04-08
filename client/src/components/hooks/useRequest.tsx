import React, { EffectCallback } from 'react';

type RequestStatus = 'loading' | 'error' | 'ok';
type RequestState = {
    data: any,
    status: RequestStatus
}

const useRequest = (request: any) => {
    const inititalState:RequestState = React.useMemo(() => ({
        data: null, status: 'loading'
    }), []);
    const [data, setData] = React.useState(inititalState);

    React.useEffect(() => {
        var cancelled = false;
        setData(inititalState);
        
        request()
            .then((data: any) => !cancelled ? setData({ data, status: 'ok' }) : null)  
            .catch((err: any) => setData({ data: err, status: 'error' }));

        return () => {
            cancelled = true
        };
    
    }, [request, inititalState]);
    
    return data;
}

export default useRequest;