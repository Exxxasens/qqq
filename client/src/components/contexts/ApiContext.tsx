import React from 'react';
import ApiService from '../../ApiService';
const instance = new ApiService();
const ApiContext = React.createContext(instance);
export default ApiContext;