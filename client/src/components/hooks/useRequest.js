import React from 'react';

const useRequest = (request) => {
    const inititalState = React.useMemo(() => ({
        data: null, status: 'loading'
    }), []);
    const [data, setData] = React.useState(inititalState);

    React.useEffect(() => {
        var cancelled = false;
        setData(inititalState);
        
        request()
            .then(data => !cancelled ? setData({ data, status: 'ok' }) : null)  
            .catch(err => setData({ data: err, status: 'error' }));

        return () => cancelled = true;
    
    }, [request, inititalState]);
    
    return data;
}

export default useRequest;