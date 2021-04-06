import React from 'react';

const Form = ({ children, onChange, onSubmit, ...props }) => {
    const [input, setInput] = React.useState({});
    // eslint-disable-next-line
    React.useEffect(() => onChange(input), [input]);
    const handleInputFocus = ({ target }) => {
        setInput(state => {
            return {
                ...state,
                [target.name]: {
                    ...state[target.name],
                    focused: true
                }
            }
        });
    }

    const handleInputChange = ({ target }) => {
        setInput(state => {
            return {
                ...state,
                [target.name]: {
                    ...state[target.name],
                    value: target.value,
                    touched: true
                }
            }
        });
    }

    const handleInputBlur = ({ target }) => {
        setInput(state => {
            return {
                ...state,
                [target.name]: {
                    ...state[target.name],
                    focused: false
                }
            }
        });
    }
    const eventHandlers = {
        onChange: handleInputChange,
        onBlur: handleInputBlur,
        onFocus: handleInputFocus
    }
    return (
        <div className="form-wrapper">
            <form {...props} onSubmit={e => onSubmit(e, input)}>{ children(input, eventHandlers) }</form>
        </div>
    );
}

export default Form;
